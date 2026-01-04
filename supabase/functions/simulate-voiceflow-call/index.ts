import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICEFLOW_API_KEY = Deno.env.get("VOICEFLOW_API_KEY");
const VOICEFLOW_API_URL = "https://general-runtime.voiceflow.com";

interface VoiceflowTrace {
  type: string;
  payload?: {
    message?: string;
    src?: string;
    buttons?: Array<{ name: string; request: unknown }>;
  };
}

interface ConversationTurn {
  role: "assistant" | "user";
  content: string;
  type?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VOICEFLOW_API_KEY) {
      return new Response(JSON.stringify({ error: "VOICEFLOW_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = token
      ? await supabaseAuth.auth.getUser(token)
      : await supabaseAuth.auth.getUser();

    const user = userData?.user;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("is_admin", { user_id: user.id });
    
    if (roleError || isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { businessId, sessionId, userInput, action } = body;

    if (!businessId) {
      return new Response(JSON.stringify({ error: "businessId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get business settings
    const { data: business, error: bizError } = await supabaseAdmin
      .from("businesses")
      .select("name, twilio_settings")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twilioSettings = business.twilio_settings as Record<string, unknown> || {};
    const voiceflowProjectId = twilioSettings.voiceflowProjectId as string;
    const voiceflowVersionId = (twilioSettings.voiceflowVersionId as string) || "production";

    if (!voiceflowProjectId) {
      return new Response(JSON.stringify({ error: "Voiceflow Project ID not configured for this business" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate or use session ID
    const currentSessionId = sessionId || `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Determine action type
    const isLaunch = action === "launch" || (!sessionId && !userInput);
    
    // Voiceflow's docs historically used `action`, newer guides use `request`.
    // To maximize compatibility across agent types/versions, send BOTH.
    const launchOrText = isLaunch
      ? ({ type: "launch" } as const)
      : ({ type: "text", payload: userInput || "" } as const);

    const voiceflowPayload = {
      action: launchOrText,
      request: launchOrText,
    };

    console.log("Voiceflow simulation request:", {
      businessId,
      businessName: business.name,
      sessionId: currentSessionId,
      projectId: voiceflowProjectId,
      versionId: voiceflowVersionId,
      isLaunch,
      userInput,
      payload: voiceflowPayload,
    });

    // Call Voiceflow API
    const vfResponse = await fetch(
      `${VOICEFLOW_API_URL}/state/user/${currentSessionId}/interact`,
      {
        method: "POST",
        headers: {
          Authorization: VOICEFLOW_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
          versionID: voiceflowVersionId,
          projectID: voiceflowProjectId,
        },
        body: JSON.stringify({
          ...voiceflowPayload,
          // Some Voiceflow deployments require versionID in-body (in addition to the header)
          versionID: voiceflowVersionId,
          config: {
            tts: false,
            stripSSML: true,
          },
        }),
      }
    );

    if (!vfResponse.ok) {
      const errorText = await vfResponse.text();
      console.error("Voiceflow API error:", vfResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Voiceflow API error",
          details: errorText,
          status: vfResponse.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const traces: VoiceflowTrace[] = await vfResponse.json();
    console.log("Voiceflow traces:", JSON.stringify(traces));

    // Process traces into conversation turns
    const turns: ConversationTurn[] = [];
    let hasEnded = false;
    const buttons: Array<{ name: string; request: unknown }> = [];

    for (const trace of traces) {
      switch (trace.type) {
        case "speak":
        case "text":
          if (trace.payload?.message) {
            turns.push({
              role: "assistant",
              content: trace.payload.message,
              type: trace.type,
            });
          }
          break;

        case "audio":
          if (trace.payload?.src) {
            turns.push({
              role: "assistant",
              content: `[Audio: ${trace.payload.src}]`,
              type: "audio",
            });
          }
          break;

        case "choice":
          if (trace.payload?.buttons) {
            buttons.push(...trace.payload.buttons);
          }
          break;

        case "end":
          hasEnded = true;
          break;

        case "visual":
        case "flow":
        case "block":
          // Internal navigation, skip
          break;

        default:
          console.log("Unhandled trace type:", trace.type, trace.payload);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: currentSessionId,
        businessName: business.name,
        projectId: voiceflowProjectId,
        versionId: voiceflowVersionId,
        turns,
        buttons: buttons.map((b) => b.name),
        hasEnded,
        rawTraces: traces,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in simulate-voiceflow-call:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
