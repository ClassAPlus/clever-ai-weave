import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Cloud TTS voices - organized by language
const GOOGLE_VOICES: Record<string, { name: string; ssmlGender: string }[]> = {
  'he-IL': [
    { name: 'he-IL-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'he-IL-Wavenet-B', ssmlGender: 'MALE' },
    { name: 'he-IL-Wavenet-C', ssmlGender: 'FEMALE' },
    { name: 'he-IL-Wavenet-D', ssmlGender: 'MALE' },
    { name: 'he-IL-Standard-A', ssmlGender: 'FEMALE' },
    { name: 'he-IL-Standard-B', ssmlGender: 'MALE' },
  ],
  'en-US': [
    { name: 'en-US-Neural2-C', ssmlGender: 'FEMALE' },
    { name: 'en-US-Neural2-D', ssmlGender: 'MALE' },
    { name: 'en-US-Neural2-E', ssmlGender: 'FEMALE' },
    { name: 'en-US-Neural2-J', ssmlGender: 'MALE' },
    { name: 'en-US-Wavenet-C', ssmlGender: 'FEMALE' },
    { name: 'en-US-Wavenet-D', ssmlGender: 'MALE' },
  ],
  'en-GB': [
    { name: 'en-GB-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'en-GB-Neural2-B', ssmlGender: 'MALE' },
    { name: 'en-GB-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'en-GB-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'ar-XA': [
    { name: 'ar-XA-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'ar-XA-Wavenet-B', ssmlGender: 'MALE' },
    { name: 'ar-XA-Wavenet-C', ssmlGender: 'MALE' },
    { name: 'ar-XA-Standard-A', ssmlGender: 'FEMALE' },
    { name: 'ar-XA-Standard-B', ssmlGender: 'MALE' },
  ],
  'es-ES': [
    { name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'es-ES-Neural2-B', ssmlGender: 'MALE' },
    { name: 'es-ES-Wavenet-B', ssmlGender: 'MALE' },
    { name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
  ],
  'fr-FR': [
    { name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'fr-FR-Neural2-B', ssmlGender: 'MALE' },
    { name: 'fr-FR-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'fr-FR-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'de-DE': [
    { name: 'de-DE-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'de-DE-Neural2-B', ssmlGender: 'MALE' },
    { name: 'de-DE-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'de-DE-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'pt-BR': [
    { name: 'pt-BR-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'pt-BR-Neural2-B', ssmlGender: 'MALE' },
    { name: 'pt-BR-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'pt-BR-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'pt-PT': [
    { name: 'pt-PT-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'pt-PT-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'it-IT': [
    { name: 'it-IT-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'it-IT-Neural2-C', ssmlGender: 'MALE' },
    { name: 'it-IT-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'it-IT-Wavenet-C', ssmlGender: 'MALE' },
  ],
  'nl-NL': [
    { name: 'nl-NL-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'nl-NL-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'pl-PL': [
    { name: 'pl-PL-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'pl-PL-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'ru-RU': [
    { name: 'ru-RU-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'ru-RU-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'zh-CN': [
    { name: 'cmn-CN-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'cmn-CN-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'ja-JP': [
    { name: 'ja-JP-Neural2-B', ssmlGender: 'FEMALE' },
    { name: 'ja-JP-Neural2-C', ssmlGender: 'MALE' },
    { name: 'ja-JP-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'ja-JP-Wavenet-B', ssmlGender: 'FEMALE' },
  ],
  'ko-KR': [
    { name: 'ko-KR-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'ko-KR-Neural2-C', ssmlGender: 'MALE' },
    { name: 'ko-KR-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'ko-KR-Wavenet-B', ssmlGender: 'FEMALE' },
  ],
  'tr-TR': [
    { name: 'tr-TR-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'tr-TR-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'hi-IN': [
    { name: 'hi-IN-Neural2-A', ssmlGender: 'FEMALE' },
    { name: 'hi-IN-Neural2-B', ssmlGender: 'MALE' },
    { name: 'hi-IN-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'hi-IN-Wavenet-B', ssmlGender: 'MALE' },
  ],
  'th-TH': [
    { name: 'th-TH-Standard-A', ssmlGender: 'FEMALE' },
  ],
  'vi-VN': [
    { name: 'vi-VN-Wavenet-A', ssmlGender: 'FEMALE' },
    { name: 'vi-VN-Wavenet-B', ssmlGender: 'MALE' },
  ],
};

// Get the best voice for a language and gender
function getVoiceForLanguage(languageCode: string, gender: string): { name: string; ssmlGender: string } {
  const voices = GOOGLE_VOICES[languageCode] || GOOGLE_VOICES['en-US'];
  const targetGender = gender === 'male' ? 'MALE' : 'FEMALE';
  
  // Prefer Neural2 > Wavenet > Standard
  const sorted = [...voices].sort((a, b) => {
    const scoreA = a.name.includes('Neural2') ? 3 : a.name.includes('Wavenet') ? 2 : 1;
    const scoreB = b.name.includes('Neural2') ? 3 : b.name.includes('Wavenet') ? 2 : 1;
    return scoreB - scoreA;
  });
  
  // Find matching gender, or return first available
  return sorted.find(v => v.ssmlGender === targetGender) || sorted[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, languageCode, gender, voiceName } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!GOOGLE_CLOUD_API_KEY) {
      throw new Error('GOOGLE_CLOUD_API_KEY is not configured');
    }

    const lang = languageCode || 'en-US';
    const selectedGender = gender || 'female';
    
    // Use specified voice name or auto-select based on language/gender
    let voice: { name: string; ssmlGender: string };
    if (voiceName && GOOGLE_VOICES[lang]?.find(v => v.name === voiceName)) {
      const foundVoice = GOOGLE_VOICES[lang].find(v => v.name === voiceName);
      voice = foundVoice!;
    } else {
      voice = getVoiceForLanguage(lang, selectedGender);
    }

    console.log(`Google TTS request: lang=${lang}, voice=${voice.name}, text length=${text.length}`);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: lang,
            name: voice.name,
            ssmlGender: voice.ssmlGender,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', response.status, errorText);
      throw new Error(`Google TTS API error: ${response.status}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    // Decode base64 to binary
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Google TTS audio generated, size:', bytes.byteLength);

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Google TTS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
