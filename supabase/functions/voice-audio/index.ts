import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default voice messages by language
const DEFAULT_MESSAGES: Record<string, Record<string, string>> = {
  'no-answer': {
    'he-IL': 'מצטערים, אין אפשרות לענות כרגע. נחזור אליכם בהקדם.',
    'en-US': 'Sorry, we are unable to answer your call right now. We will get back to you soon.',
    'en-GB': 'Sorry, we are unable to answer your call at the moment. We shall get back to you shortly.',
    'es-ES': 'Lo sentimos, no podemos atender su llamada en este momento. Le devolveremos la llamada pronto.',
    'fr-FR': 'Désolé, nous ne pouvons pas répondre à votre appel pour le moment. Nous vous rappellerons bientôt.',
    'de-DE': 'Entschuldigung, wir können Ihren Anruf derzeit nicht entgegennehmen. Wir werden uns bald bei Ihnen melden.',
    'ar-XA': 'عذراً، لا يمكننا الرد على مكالمتك الآن. سنعاود الاتصال بك قريباً.',
    'ru-RU': 'Извините, мы не можем ответить на ваш звонок сейчас. Мы свяжемся с вами в ближайшее время.',
  },
  'missed-call': {
    'he-IL': 'שלום, לא הצלחנו לענות לשיחה שלך. נשלח לך הודעה בקרוב.',
    'en-US': 'Hello, we missed your call. We will send you a message shortly.',
    'en-GB': 'Hello, we missed your call. We shall send you a message shortly.',
    'es-ES': 'Hola, perdimos tu llamada. Te enviaremos un mensaje pronto.',
    'fr-FR': 'Bonjour, nous avons manqué votre appel. Nous vous enverrons un message bientôt.',
    'de-DE': 'Hallo, wir haben Ihren Anruf verpasst. Wir werden Ihnen bald eine Nachricht senden.',
    'ar-XA': 'مرحباً، فاتتنا مكالمتك. سنرسل لك رسالة قريباً.',
    'ru-RU': 'Здравствуйте, мы пропустили ваш звонок. Мы отправим вам сообщение в ближайшее время.',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get('business_id');
    const messageType = url.searchParams.get('type') || 'no-answer';
    const customText = url.searchParams.get('text');

    if (!businessId) {
      console.error("Missing business_id parameter");
      return new Response("Missing business_id", { status: 400, headers: corsHeaders });
    }

    console.log(`Voice audio request: business=${businessId}, type=${messageType}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get business settings
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('twilio_settings, ai_language, greeting_messages')
      .eq('id', businessId)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", businessId, bizError);
      return new Response("Business not found", { status: 404, headers: corsHeaders });
    }

    const twilioSettings = business.twilio_settings || {};
    const voiceId = twilioSettings.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default to Sarah
    const voiceLanguage = twilioSettings.voiceLanguage || 'en-US';

    // Determine the text to speak
    let textToSpeak = customText;
    
    if (!textToSpeak) {
      // Check for custom greeting in business settings
      const greetings = business.greeting_messages || {};
      if (greetings[messageType]) {
        textToSpeak = greetings[messageType];
      } else {
        // Use default message for the language
        textToSpeak = DEFAULT_MESSAGES[messageType]?.[voiceLanguage] 
          || DEFAULT_MESSAGES[messageType]?.['en-US'] 
          || 'Sorry, we cannot take your call right now.';
      }
    }

    console.log(`Generating audio with voice=${voiceId}, text="${textToSpeak.substring(0, 50)}..."`);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
      return new Response("Voice service not configured", { status: 500, headers: corsHeaders });
    }

    // Generate audio with ElevenLabs
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToSpeak,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs API error:", elevenLabsResponse.status, errorText);
      return new Response("Voice generation failed", { status: 500, headers: corsHeaders });
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    console.log(`Audio generated successfully, size: ${audioBuffer.byteLength} bytes`);

    // Return the audio directly - Twilio will fetch this
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("Error in voice-audio:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
