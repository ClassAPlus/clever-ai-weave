import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // List voices from the authenticated ElevenLabs account.
    // This includes custom/cloned voices created by the user.
    const resp = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("ElevenLabs voices API error:", resp.status, t);
      return new Response(JSON.stringify({ error: `ElevenLabs voices API error: ${resp.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();

    const voices = Array.isArray(json?.voices) ? json.voices : [];
    const simplified = voices.map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
      preview_url: v.preview_url,
      labels: v.labels,
    }));

    return new Response(JSON.stringify({ voices: simplified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("elevenlabs-voices error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
