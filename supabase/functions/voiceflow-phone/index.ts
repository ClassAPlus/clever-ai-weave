import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VOICEFLOW_API_KEY = Deno.env.get('VOICEFLOW_API_KEY');
const VOICEFLOW_API_URL = 'https://general-runtime.voiceflow.com';

interface VoiceflowTrace {
  type: string;
  payload?: {
    message?: string;
    src?: string;
    buttons?: Array<{ name: string; request: unknown }>;
  };
}

// Map language codes to valid Amazon Polly voices supported by Twilio
function getTwilioPollyVoice(language: string): string | null {
  const langLower = language.toLowerCase();
  
  if (langLower.startsWith('he')) return 'Polly.Carmit'; // Hebrew - Neural voice
  if (langLower.startsWith('en-us')) return 'Polly.Joanna';
  if (langLower.startsWith('en-gb')) return 'Polly.Amy';
  if (langLower.startsWith('en')) return 'Polly.Joanna';
  if (langLower.startsWith('es')) return 'Polly.Lupe';
  if (langLower.startsWith('fr')) return 'Polly.Lea';
  if (langLower.startsWith('de')) return 'Polly.Vicki';
  if (langLower.startsWith('it')) return 'Polly.Bianca';
  if (langLower.startsWith('pt')) return 'Polly.Camila';
  if (langLower.startsWith('ar')) return 'Polly.Zeina';
  if (langLower.startsWith('ru')) return 'Polly.Tatyana';
  if (langLower.startsWith('ja')) return 'Polly.Mizuki';
  if (langLower.startsWith('ko')) return 'Polly.Seoyeon';
  if (langLower.startsWith('zh')) return 'Polly.Zhiyu';
  
  // Return null for unsupported languages - will use language-only fallback
  return null;
}

// Twilio Gather speech recognition supports a limited set of languages
// This maps the voice language to a valid Gather language or falls back to en-US
function getGatherLanguage(language: string): string {
  const validGatherLanguages = [
    'arb', 'cmn-cn', 'da-dk', 'nl-nl', 'en-au', 'en-gb', 'en-in', 'en-nz', 
    'en-us', 'en-za', 'en-gb-wls', 'fr-fr', 'fr-ca', 'de-de', 'hi-in', 
    'is-is', 'it-it', 'ja-jp', 'ko-kr', 'nb-no', 'pl-pl', 'pt-br', 'pt-pt', 
    'ro-ro', 'ru-ru', 'es-es', 'es-mx', 'es-us', 'sv-se', 'tr-tr', 'cy-gb'
  ];
  
  const langLower = language.toLowerCase();
  
  // Direct match
  if (validGatherLanguages.includes(langLower)) {
    return langLower;
  }
  
  // Map common language prefixes to their Gather equivalent
  const prefixMap: Record<string, string> = {
    'en': 'en-us',
    'es': 'es-es',
    'fr': 'fr-fr',
    'de': 'de-de',
    'it': 'it-it',
    'pt': 'pt-br',
    'ru': 'ru-ru',
    'ja': 'ja-jp',
    'ko': 'ko-kr',
    'ar': 'arb',
    'zh': 'cmn-cn',
    'nl': 'nl-nl',
    'pl': 'pl-pl',
    'sv': 'sv-se',
    'tr': 'tr-tr',
    'da': 'da-dk',
    'nb': 'nb-no',
    'no': 'nb-no',
    'hi': 'hi-in',
    'ro': 'ro-ro',
    'is': 'is-is',
    'cy': 'cy-gb',
  };
  
  // Check prefix (first 2 chars)
  const prefix = langLower.substring(0, 2);
  if (prefixMap[prefix]) {
    return prefixMap[prefix];
  }
  
  // Hebrew and other unsupported languages fall back to English
  // (Twilio doesn't support Hebrew speech recognition)
  return 'en-us';
}

// Build a <Say> TwiML element with proper voice/language handling
function buildSayElement(message: string, language: string): string {
  const escapedMessage = escapeXml(message);
  const voice = getTwilioPollyVoice(language);
  
  if (voice) {
    return `<Say voice="${voice}" language="${language}">${escapedMessage}</Say>`;
  }
  // Fallback: just use language, let Twilio pick default voice
  return `<Say language="${language}">${escapedMessage}</Say>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Parse Twilio POST body robustly (handles application/x-www-form-urlencoded)
async function parseTwilioBody(req: Request): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const bodyText = await req.text();
      const urlParams = new URLSearchParams(bodyText);
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          params[key] = value;
        }
      }
    }
  } catch (e) {
    console.log("Error parsing Twilio body:", e);
  }
  
  return params;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  const businessId = url.searchParams.get('business_id');
  const callerPhone = url.searchParams.get('caller_phone');
  const callSid = url.searchParams.get('call_sid');

  // Health check endpoint
  // Supports:
  // - GET /voiceflow-phone?health=true
  // - POST /voiceflow-phone with JSON body: { "health": true }
  //   (useful from the browser via supabase.functions.invoke)
  let isHealthCheck = url.searchParams.get('health') === 'true';

  if (!isHealthCheck && !businessId && !callerPhone && !callSid) {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json().catch(() => null);
        isHealthCheck = !!body && body.health === true;
      } catch {
        // ignore
      }
    }
  }

  if (isHealthCheck) {
    console.log("Health check ping received");
    const hasVoiceflowKey = !!VOICEFLOW_API_KEY;
    const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL');
    const hasSupabaseKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const status = hasVoiceflowKey && hasSupabaseUrl && hasSupabaseKey ? 'healthy' : 'degraded';

    return new Response(
      JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
        checks: {
          voiceflow_api_key: hasVoiceflowKey,
          supabase_url: hasSupabaseUrl,
          supabase_service_key: hasSupabaseKey,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: status === 'healthy' ? 200 : 503
      }
    );
  }
  if (!VOICEFLOW_API_KEY) {
    console.error("VOICEFLOW_API_KEY not configured");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice AI is not configured. Please try again later.</Say><Hangup/></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get business settings
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", businessId, bizError);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Configuration error. Goodbye.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    const twilioSettings = business.twilio_settings || {};
    const voiceflowProjectId = twilioSettings.voiceflowProjectId;
    const voiceflowVersionId = twilioSettings.voiceflowVersionId || 'production';
    const voiceLanguage = twilioSettings.voiceLanguage || 'en-US';
    // Allow custom speech recognition language override (for languages not supported by Twilio Gather)
    const customSpeechRecognitionLanguage = twilioSettings.speechRecognitionLanguage;

    // Parse incoming Twilio data robustly
    let userInput = '';
    let isInitialCall = true;
    
    if (req.method === 'POST') {
      const twilioParams = await parseTwilioBody(req);
      console.log("Twilio params received:", Object.keys(twilioParams));
      
      const speechResult = twilioParams['SpeechResult'];
      if (speechResult) {
        userInput = speechResult;
        isInitialCall = false;
      }
    }

    // Create a unique session ID based on call
    const sessionId = `twilio-${callSid}-${callerPhone?.replace(/\D/g, '')}`;
    
    console.log("Voiceflow request - session:", sessionId, "input:", userInput, "initial:", isInitialCall);

    if (!voiceflowProjectId) {
      console.error("Voiceflow project ID not configured for business:", businessId);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice AI is not properly configured. Please try again later.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Make request to Voiceflow Dialog API with timeout
    // Voiceflow expects 'request' not 'action' in the payload
    const voiceflowPayload = isInitialCall 
      ? { request: { type: 'launch' } }
      : { request: { type: 'text', payload: userInput } };

    console.log("Calling Voiceflow API - project:", voiceflowProjectId, "version:", voiceflowVersionId);

    // Add 8 second timeout to prevent Twilio webhook timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let traces: VoiceflowTrace[] = [];
    
    try {
      const vfResponse = await fetch(
        `${VOICEFLOW_API_URL}/state/user/${sessionId}/interact?logs=off`,
        {
          method: 'POST',
          headers: {
            'Authorization': VOICEFLOW_API_KEY,
            'Content-Type': 'application/json',
            'versionID': voiceflowVersionId,
            'projectID': voiceflowProjectId,
          },
          body: JSON.stringify({
            ...voiceflowPayload,
            config: {
              tts: false,
              stripSSML: true,
            },
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);

      if (!vfResponse.ok) {
        const errorText = await vfResponse.text();
        console.error("Voiceflow API error:", vfResponse.status, errorText);
        throw new Error(`Voiceflow API error: ${vfResponse.status}`);
      }

      traces = await vfResponse.json();
      console.log("Voiceflow traces:", JSON.stringify(traces));
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("Voiceflow API timeout after 8s");
      } else {
        console.error("Voiceflow fetch error:", fetchError);
      }
      
      // Return a fallback TwiML that continues the conversation
      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response>${buildSayElement("I'm having trouble right now. Please try again in a moment.", voiceLanguage)}<Hangup/></Response>`;
      return new Response(fallbackTwiml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Process Voiceflow response and build TwiML
    let twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>`;
    let shouldGather = true;
    let hasEnded = false;

    for (const trace of traces) {
      switch (trace.type) {
        case 'speak':
        case 'text':
          if (trace.payload?.message) {
            twiml += buildSayElement(trace.payload.message, voiceLanguage);
          }
          break;
          
        case 'audio':
          if (trace.payload?.src) {
            twiml += `<Play>${trace.payload.src}</Play>`;
          }
          break;
          
        case 'end':
          hasEnded = true;
          shouldGather = false;
          break;
          
        case 'visual':
          // Visual blocks don't apply to phone calls
          break;
          
        default:
          console.log("Unhandled trace type:", trace.type);
      }
    }

    if (hasEnded) {
      twiml += `<Hangup/>`;
    } else if (shouldGather) {
      // Build gather URL safely (avoid unescaped '&' breaking TwiML XML parsing)
      const gatherUrlObj = new URL(`${supabaseUrl}/functions/v1/voiceflow-phone`);
      gatherUrlObj.searchParams.set('business_id', businessId || '');
      gatherUrlObj.searchParams.set('caller_phone', callerPhone || '');
      gatherUrlObj.searchParams.set('call_sid', callSid || '');
      const gatherUrl = escapeXml(gatherUrlObj.toString());

      // Use custom speech recognition language if specified, otherwise auto-detect from voice language
      const gatherLanguage = customSpeechRecognitionLanguage || getGatherLanguage(voiceLanguage);
      twiml += `<Gather input="speech" timeout="5" speechTimeout="auto" action="${gatherUrl}" method="POST" language="${gatherLanguage}"></Gather>`;

      // Fallback if no input - use proper voice for language
      twiml += buildSayElement("I didn't catch that. Let me transfer you.", voiceLanguage);
      twiml += `<Hangup/>`;
    }

    twiml += `</Response>`;
    console.log("Returning TwiML:", twiml);

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error("Error in voiceflow-phone:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please try again later.</Say><Hangup/></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }
});
