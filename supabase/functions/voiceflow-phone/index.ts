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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const businessId = url.searchParams.get('business_id');
  const callerPhone = url.searchParams.get('caller_phone');
  const callSid = url.searchParams.get('call_sid');

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

    // Parse incoming Twilio data
    let userInput = '';
    let isInitialCall = true;
    
    if (req.method === 'POST') {
      try {
        const formData = await req.formData();
        const speechResult = formData.get('SpeechResult');
        if (speechResult) {
          userInput = speechResult.toString();
          isInitialCall = false;
        }
      } catch (e) {
        console.log("No form data or speech result");
      }
    }

    // Create a unique session ID based on call
    const sessionId = `twilio-${callSid}-${callerPhone?.replace(/\D/g, '')}`;
    
    console.log("Voiceflow request - session:", sessionId, "input:", userInput, "initial:", isInitialCall);

    // Make request to Voiceflow Dialog API
    const voiceflowPayload = isInitialCall 
      ? { action: { type: 'launch' } }
      : { action: { type: 'text', payload: userInput } };

    if (!voiceflowProjectId) {
      console.error("Voiceflow project ID not configured for business:", businessId);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice AI is not properly configured. Please try again later.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    console.log("Calling Voiceflow API - project:", voiceflowProjectId, "version:", voiceflowVersionId);

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
      }
    );

    if (!vfResponse.ok) {
      const errorText = await vfResponse.text();
      console.error("Voiceflow API error:", vfResponse.status, errorText);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>I'm having trouble connecting. Please try again.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    const traces: VoiceflowTrace[] = await vfResponse.json();
    console.log("Voiceflow traces:", JSON.stringify(traces));

    // Process Voiceflow response and build TwiML
    let twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>`;
    let shouldGather = true;
    let hasEnded = false;

    for (const trace of traces) {
      switch (trace.type) {
        case 'speak':
        case 'text':
          if (trace.payload?.message) {
            // Use Polly voice for better quality
            const voice = voiceLanguage.startsWith('he') ? 'Polly.Adina' : 'Polly.Joanna';
            twiml += `<Say voice="${voice}" language="${voiceLanguage}">${escapeXml(trace.payload.message)}</Say>`;
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
      // Continue conversation - gather speech input
      const projectId = 'wqhakzywmqirucmetnuo';
      const gatherUrl = `https://${projectId}.supabase.co/functions/v1/voiceflow-phone?business_id=${businessId}&caller_phone=${encodeURIComponent(callerPhone || '')}&call_sid=${callSid}`;
      
      twiml += `<Gather input="speech" timeout="5" speechTimeout="auto" action="${gatherUrl}" method="POST" language="${voiceLanguage}">`;
      twiml += `</Gather>`;
      
      // Fallback if no input
      twiml += `<Say voice="Polly.Joanna">I didn't catch that. Let me transfer you.</Say>`;
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
