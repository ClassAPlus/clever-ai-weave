import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs multilingual voices - these work great for Hebrew and English
const ELEVENLABS_VOICES = {
  female: {
    primary: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, natural
    alt: 'XrExE9yKIg1WjnnlVkGX',     // Matilda
  },
  male: {
    primary: 'onwK4e9ZLuTAKqWW03F9', // Daniel - clear, professional
    alt: 'TX3LPaxmHKxFdv7VOQHJ',     // Liam
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, languageCode, gender, voiceId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const selectedGender = gender || 'female';
    
    // Use specified voice ID or auto-select based on gender
    const selectedVoiceId = voiceId || 
      (selectedGender === 'male' ? ELEVENLABS_VOICES.male.primary : ELEVENLABS_VOICES.female.primary);

    // Languages supported by eleven_turbo_v2_5 with language_code parameter
    // Hebrew is NOT supported by turbo model - must use multilingual_v2 which auto-detects
    const turboSupportedLanguages: Record<string, string> = {
      'en-US': 'en',
      'en-GB': 'en',
      'es-ES': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'it-IT': 'it',
      'nl-NL': 'nl',
      'pl-PL': 'pl',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'zh-CN': 'zh',
    };

    // Check if language is supported by turbo model
    const elevenLabsLang = languageCode ? turboSupportedLanguages[languageCode] : undefined;
    
    // Use turbo for supported languages, multilingual_v2 for Hebrew/Arabic/others (better auto-detection)
    const useMultilingual = !elevenLabsLang || languageCode === 'he-IL' || languageCode === 'ar-XA';

    console.log(`ElevenLabs TTS request: lang=${languageCode || 'auto'}, model=${useMultilingual ? 'multilingual_v2' : 'turbo_v2_5'}, voice=${selectedVoiceId}, text length=${text.length}`);

    // Build request body
    const requestBody: Record<string, any> = {
      text,
      model_id: useMultilingual ? 'eleven_multilingual_v2' : 'eleven_turbo_v2_5',
      output_format: 'mp3_44100_128',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    };

    // Only add language_code for turbo model (multilingual auto-detects from text)
    if (!useMultilingual && elevenLabsLang) {
      requestBody.language_code = elevenLabsLang;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);

    console.log('ElevenLabs audio generated, size:', bytes.byteLength);

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
