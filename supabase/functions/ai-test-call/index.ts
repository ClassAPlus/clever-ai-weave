import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { businessId } = await req.json();
    
    if (!businessId) {
      throw new Error('businessId is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch business data to customize the AI session
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("name, ai_instructions, ai_language, business_hours, timezone, services, knowledge_base, twilio_settings")
      .eq("id", businessId)
      .single();

    if (bizError) {
      console.error("Error fetching business:", bizError);
      throw new Error("Failed to fetch business data");
    }

    // Build the system prompt similar to voice-realtime
    const businessName = business?.name || "Test Business";
    const instructions = business?.ai_instructions || "";
    const aiLang = business?.ai_language || "english";
    
    // Parse language
    const langMapping: Record<string, string> = {
      "hebrew": "Hebrew (עברית)",
      "english": "English",
      "arabic": "Arabic (العربية)",
      "spanish": "Spanish (Español)",
      "french": "French (Français)",
      "german": "German (Deutsch)",
      "russian": "Russian (Русский)",
    };
    
    let primaryLang = aiLang.split(":")[0].toLowerCase().trim();
    const languageName = langMapping[primaryLang] || "English";
    const isHebrew = primaryLang === "hebrew";

    // Get voice based on settings
    const settings = business?.twilio_settings as any;
    const gender = settings?.voiceGender || "female";
    const voice = gender === "male" ? "ash" : "alloy";

    // Build comprehensive system prompt
    const systemPrompt = `You are a friendly and professional AI receptionist for ${businessName}. 
Your DEFAULT language is ${languageName}.
Be concise but warm. Help callers with their questions, take messages, and schedule appointments.

THIS IS A TEST CALL - The user is testing the AI receptionist functionality.
Respond as you would to a real caller, but feel free to mention this is a test if asked.

=== DYNAMIC LANGUAGE SWITCHING ===
CRITICAL: You CAN and SHOULD switch languages during the conversation if the caller requests it.
- If the caller asks to speak in Hebrew (עברית), switch to Hebrew immediately.
- If the caller asks to speak in English, switch to English immediately.
- Supported languages: Hebrew, English, Arabic, Spanish, French, German, Russian

${instructions ? `=== BUSINESS INSTRUCTIONS ===\n${instructions}\n` : ""}

=== CRITICAL: 24-HOUR TIME INTERPRETATION ===
When scheduling appointments, ALWAYS use correct 24-hour time logic:
- 00:00 - 11:59 = Morning (בוקר)
- 12:00 - 17:59 = Afternoon (צהריים)
- 18:00 - 23:59 = Evening (ערב)

If the caller says "morning" but mentions 20:00 or 8:00 PM, this is a CONTRADICTION - clarify!

=== CRITICAL: BUSINESS HOURS VALIDATION ===
Business hours are configured. BEFORE scheduling ANY appointment:
1. Check if the requested day/time falls within business hours
2. If the business is CLOSED on the requested day, do NOT schedule
3. Suggest an alternative open day/time

Important guidelines:
- Keep responses brief (1-2 sentences when possible)
- Be polite and professional at all times
- If asked about specific business details you don't know, mention you're a demo/test

Available services: ${business?.services?.join(', ') || 'Not configured'}`;

    console.log(`Creating test session for business: ${businessName}`);

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", errorText);
      throw new Error(`Failed to create OpenAI session: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify({
      ...data,
      businessName,
      voice,
      language: languageName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
