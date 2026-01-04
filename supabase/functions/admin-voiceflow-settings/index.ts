import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const voiceflowProjectIdSchema = z
  .string()
  .trim()
  .min(1, "Project ID is required")
  .max(100, "Project ID must be less than 100 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Project ID must only contain letters, numbers, hyphens, and underscores");

const voiceflowVersionIdSchema = z
  .string()
  .trim()
  .max(50, "Version ID must be less than 50 characters")
  .regex(/^[a-zA-Z0-9_-]*$/, "Version ID must only contain letters, numbers, hyphens, and underscores")
  .optional()
  .or(z.literal(""));

const bulkUpdateSchema = z.object({
  voiceflowProjectId: voiceflowProjectIdSchema,
  voiceflowVersionId: voiceflowVersionIdSchema,
  applyToAll: z.boolean().optional().default(true),
  businessIds: z.array(z.string().uuid()).optional(),
});

type BulkUpdatePayload = z.infer<typeof bulkUpdateSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("is_admin", { user_id: user.id });
    if (roleError || isAdmin !== true) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = bulkUpdateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: parsed.error.flatten(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: BulkUpdatePayload = parsed.data;

    const updatedSettings = {
      voiceflowProjectId: payload.voiceflowProjectId,
      voiceflowVersionId: payload.voiceflowVersionId || "production",
    };

    let query = supabaseAdmin.from("businesses").select("id, twilio_settings");

    if (!payload.applyToAll) {
      if (!payload.businessIds || payload.businessIds.length === 0) {
        return new Response(JSON.stringify({ error: "businessIds is required when applyToAll is false" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("id", payload.businessIds);
    }

    const { data: businesses, error: fetchError } = await query;
    if (fetchError) {
      return new Response(JSON.stringify({ error: "Failed to load businesses" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates = (businesses ?? []).map((b) => {
      const nextTwilioSettings = {
        ...(typeof b.twilio_settings === "object" && b.twilio_settings ? b.twilio_settings : {}),
        ...updatedSettings,
      };

      return supabaseAdmin
        .from("businesses")
        .update({ twilio_settings: nextTwilioSettings })
        .eq("id", b.id);
    });

    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error).length;

    return new Response(
      JSON.stringify({
        success: true,
        updated: results.length - failed,
        failed,
        voiceflowProjectId: updatedSettings.voiceflowProjectId,
        voiceflowVersionId: updatedSettings.voiceflowVersionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-voiceflow-settings:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
