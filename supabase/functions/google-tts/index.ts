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

    // Map language codes to ElevenLabs ISO 639-1 codes
    const languageMap: Record<string, string> = {
      'he-IL': 'he',
      'en-US': 'en',
      'en-GB': 'en',
      'ar-XA': 'ar',
      'es-ES': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'it-IT': 'it',
      'nl-NL': 'nl',
      'pl-PL': 'pl',
      'ru-RU': 'ru',
      'zh-CN': 'zh',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'tr-TR': 'tr',
      'hi-IN': 'hi',
      'vi-VN': 'vi',
    };

    // Get the ElevenLabs language code (2-letter ISO)
    const elevenLabsLang = languageCode ? languageMap[languageCode] : undefined;

    console.log(`ElevenLabs TTS request: lang=${languageCode || 'auto'} (${elevenLabsLang || 'auto-detect'}), voice=${selectedVoiceId}, text length=${text.length}`);

    // Build request body - use eleven_turbo_v2_5 for better language handling when language is specified
    const requestBody: Record<string, any> = {
      text,
      model_id: elevenLabsLang ? 'eleven_turbo_v2_5' : 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    };

    // Add language_code for Turbo 2.5 to force correct language pronunciation
    if (elevenLabsLang) {
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
