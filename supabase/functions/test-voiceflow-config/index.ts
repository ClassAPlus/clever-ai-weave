import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICEFLOW_API_KEY = Deno.env.get("VOICEFLOW_API_KEY");
const VOICEFLOW_API_URL = "https://general-runtime.voiceflow.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!VOICEFLOW_API_KEY) {
      console.error("VOICEFLOW_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Voiceflow API key not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user + check admin
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = token
      ? await supabaseAuth.auth.getUser(token)
      : await supabaseAuth.auth.getUser();

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { user_id: userData.user.id });

    if (isAdmin !== true) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId, versionId } = await req.json();

    if (!projectId || typeof projectId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "projectId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const version = versionId && versionId.trim() ? versionId.trim() : "production";

    console.log(`Testing Voiceflow config - projectId: ${projectId}, versionId: ${version}`);

    // Create a temporary test session
    const testSessionId = `test-${Date.now()}`;

    // Try to launch a session to validate the project/version
    const vfResponse = await fetch(`${VOICEFLOW_API_URL}/state/user/${testSessionId}/interact`, {
      method: "POST",
      headers: {
        Authorization: VOICEFLOW_API_KEY,
        "Content-Type": "application/json",
        versionID: version,
      },
      body: JSON.stringify({
        action: { type: "launch" },
        config: { tts: false, stripSSML: true },
      }),
    });

    const responseText = await vfResponse.text();
    console.log(`Voiceflow response status: ${vfResponse.status}, body: ${responseText.slice(0, 500)}`);

    if (!vfResponse.ok) {
      let errorMessage = "Invalid Voiceflow configuration";

      if (vfResponse.status === 401 || vfResponse.status === 403) {
        errorMessage = "Voiceflow API key is invalid or lacks permission";
      } else if (vfResponse.status === 404) {
        errorMessage = "Project or version not found";
      } else {
        try {
          const errData = JSON.parse(responseText);
          errorMessage = errData.message || errData.error || errorMessage;
        } catch {
          // keep default
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          status: vfResponse.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse to check we got valid traces
    let traces;
    try {
      traces = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid response from Voiceflow" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasContent = Array.isArray(traces) && traces.length > 0;

    // Clean up the test session (fire-and-forget)
    fetch(`${VOICEFLOW_API_URL}/state/user/${testSessionId}`, {
      method: "DELETE",
      headers: { Authorization: VOICEFLOW_API_KEY },
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        message: hasContent
          ? `Connected successfully! Received ${traces.length} trace(s).`
          : "Connected but no initial traces returned.",
        traceCount: traces.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in test-voiceflow-config:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
