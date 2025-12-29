import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ElevenLabs voices - use native language voices for best pronunciation
const ELEVENLABS_VOICES = {
  // Hebrew native voices (from ElevenLabs voice library)
  hebrew: {
    female: 'cgSgspJ2msm6clMCkdW9', // He-israel style voice
    male: 'onwK4e9ZLuTAKqWW03F9',
  },
  // Default English voices
  english: {
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    male: 'onwK4e9ZLuTAKqWW03F9',   // Daniel
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
    
    // Detect if Hebrew based on language code or text content
    const isHebrew = languageCode?.startsWith('he') || /[\u0590-\u05FF]/.test(text);
    
    // Use specified voice ID, or select based on language and gender
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId) {
      if (isHebrew) {
        selectedVoiceId = selectedGender === 'male' ? ELEVENLABS_VOICES.hebrew.male : ELEVENLABS_VOICES.hebrew.female;
      } else {
        selectedVoiceId = selectedGender === 'male' ? ELEVENLABS_VOICES.english.male : ELEVENLABS_VOICES.english.female;
      }
    }

    // Use eleven_v3 for Hebrew (best pronunciation), multilingual_v2 for other languages
    const modelId = isHebrew ? 'eleven_v3' : 'eleven_multilingual_v2';
    
    console.log(`ElevenLabs TTS request: lang=${languageCode || 'auto'}, isHebrew=${isHebrew}, model=${modelId}, voice=${selectedVoiceId}, text length=${text.length}`);

    // Build request body
    const requestBody: Record<string, any> = {
      text,
      model_id: modelId,
      output_format: 'mp3_44100_128',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    };

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
