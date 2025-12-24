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

// Google Cloud TTS voices - organized by language
const GOOGLE_VOICES: Record<string, { female: string; male: string }> = {
  'he-IL': { female: 'he-IL-Wavenet-A', male: 'he-IL-Wavenet-B' },
  'en-US': { female: 'en-US-Neural2-C', male: 'en-US-Neural2-D' },
  'en-GB': { female: 'en-GB-Neural2-A', male: 'en-GB-Neural2-B' },
  'ar-XA': { female: 'ar-XA-Wavenet-A', male: 'ar-XA-Wavenet-B' },
  'es-ES': { female: 'es-ES-Neural2-A', male: 'es-ES-Neural2-B' },
  'fr-FR': { female: 'fr-FR-Neural2-A', male: 'fr-FR-Neural2-B' },
  'de-DE': { female: 'de-DE-Neural2-A', male: 'de-DE-Neural2-B' },
  'pt-BR': { female: 'pt-BR-Neural2-A', male: 'pt-BR-Neural2-B' },
  'pt-PT': { female: 'pt-PT-Wavenet-A', male: 'pt-PT-Wavenet-B' },
  'it-IT': { female: 'it-IT-Neural2-A', male: 'it-IT-Neural2-C' },
  'nl-NL': { female: 'nl-NL-Wavenet-A', male: 'nl-NL-Wavenet-B' },
  'pl-PL': { female: 'pl-PL-Wavenet-A', male: 'pl-PL-Wavenet-B' },
  'ru-RU': { female: 'ru-RU-Wavenet-A', male: 'ru-RU-Wavenet-B' },
  'zh-CN': { female: 'cmn-CN-Wavenet-A', male: 'cmn-CN-Wavenet-B' },
  'ja-JP': { female: 'ja-JP-Neural2-B', male: 'ja-JP-Neural2-C' },
  'ko-KR': { female: 'ko-KR-Neural2-A', male: 'ko-KR-Neural2-C' },
  'tr-TR': { female: 'tr-TR-Wavenet-A', male: 'tr-TR-Wavenet-B' },
  'hi-IN': { female: 'hi-IN-Neural2-A', male: 'hi-IN-Neural2-B' },
  'th-TH': { female: 'th-TH-Standard-A', male: 'th-TH-Standard-A' },
  'vi-VN': { female: 'vi-VN-Wavenet-A', male: 'vi-VN-Wavenet-B' },
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
    const voiceLanguage = twilioSettings.voiceLanguage || 'en-US';
    const voiceGender = twilioSettings.voiceGender || 'female';
    const customVoiceName = twilioSettings.googleVoiceName;

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

    // Get Google Cloud API key
    const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!GOOGLE_CLOUD_API_KEY) {
      console.error("GOOGLE_CLOUD_API_KEY not configured");
      return new Response("Voice service not configured", { status: 500, headers: corsHeaders });
    }

    // Determine the voice to use
    const voiceConfig = GOOGLE_VOICES[voiceLanguage] || GOOGLE_VOICES['en-US'];
    const voiceName = customVoiceName || (voiceGender === 'male' ? voiceConfig.male : voiceConfig.female);
    const ssmlGender = voiceGender === 'male' ? 'MALE' : 'FEMALE';

    console.log(`Generating audio with Google TTS: voice=${voiceName}, lang=${voiceLanguage}, text="${textToSpeak.substring(0, 50)}..."`);

    // Generate audio with Google Cloud TTS
    const googleResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: textToSpeak },
          voice: {
            languageCode: voiceLanguage,
            name: voiceName,
            ssmlGender: ssmlGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
            effectsProfileId: ['telephony-class-application'],
          },
        }),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google TTS API error:", googleResponse.status, errorText);
      return new Response("Voice generation failed", { status: 500, headers: corsHeaders });
    }

    const data = await googleResponse.json();
    const audioContent = data.audioContent;

    // Decode base64 to binary
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`Audio generated successfully, size: ${bytes.byteLength} bytes`);

    // Return the audio directly - Twilio will fetch this
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': bytes.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("Error in voice-audio:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
