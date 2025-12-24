import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const twilioData: Record<string, string> = {};
    formData.forEach((value, key) => {
      twilioData[key] = value.toString();
    });

    console.log("Incoming call webhook:", JSON.stringify(twilioData));

    const calledNumber = twilioData.Called; // The Twilio number that was called
    const callerPhone = twilioData.From; // The caller's phone number
    const callSid = twilioData.CallSid;

    if (!calledNumber || !callerPhone) {
      console.error("Missing required fields: Called or From");
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, there was an error processing your call.</Say></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Initialize Supabase client with service role for webhook access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the business by their Twilio number
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('twilio_phone_number', calledNumber)
      .single();

    if (bizError || !business) {
      console.error("Business not found for number:", calledNumber, bizError);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>This number is not configured. Goodbye.</Say></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    console.log("Found business:", business.name, "ID:", business.id);

    // Get or create contact
    let { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('business_id', business.id)
      .eq('phone_number', callerPhone)
      .single();

    if (!contact) {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          business_id: business.id,
          phone_number: callerPhone,
        })
        .select()
        .single();

      if (contactError) {
        console.error("Error creating contact:", contactError);
      } else {
        contact = newContact;
      }
    }

    // Create call record with initial status
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .insert({
        business_id: business.id,
        contact_id: contact?.id,
        caller_phone: callerPhone,
        call_status: 'ringing',
        twilio_call_sid: callSid,
        was_answered: false,
      })
      .select()
      .single();

    if (callError) {
      console.error("Error creating call record:", callError);
    } else {
      console.log("Created call record:", callRecord.id);
    }

    // Build TwiML response
    const forwardPhones = business.forward_to_phones || [];
    const projectId = 'wqhakzywmqirucmetnuo';
    const statusCallbackUrl = `https://${projectId}.supabase.co/functions/v1/voice-dial-result`;

    // Get Twilio settings from business configuration
    const twilioSettings = business.twilio_settings || {};
    const ringTimeout = twilioSettings.ringTimeout || 30;
    const voiceLanguage = twilioSettings.voiceLanguage || 'he-IL';
    const voiceGender = twilioSettings.voiceGender || 'female';
    const enableAiReceptionist = twilioSettings.enableAiReceptionist !== false; // Default to true

    // Check if Google Cloud TTS is configured
    const useGoogleTTS = !!Deno.env.get('GOOGLE_CLOUD_API_KEY');
    
    // Map language codes to Twilio voice names (fallback if Google TTS not available)
    const getVoiceName = (lang: string, gender: string): string => {
      const voiceMap: Record<string, Record<string, string>> = {
        'he-IL': { female: 'Polly.Adina', male: 'Polly.Adina' },
        'en-US': { female: 'Polly.Joanna', male: 'Polly.Matthew' },
        'en-GB': { female: 'Polly.Amy', male: 'Polly.Brian' },
        'ar-XA': { female: 'Polly.Zeina', male: 'Polly.Zeina' },
        'ru-RU': { female: 'Polly.Tatyana', male: 'Polly.Maxim' },
        'es-ES': { female: 'Polly.Conchita', male: 'Polly.Enrique' },
        'fr-FR': { female: 'Polly.Celine', male: 'Polly.Mathieu' },
        'de-DE': { female: 'Polly.Marlene', male: 'Polly.Hans' },
        'pt-BR': { female: 'Polly.Vitoria', male: 'Polly.Ricardo' },
        'pt-PT': { female: 'Polly.Ines', male: 'Polly.Cristiano' },
        'zh-CN': { female: 'Polly.Zhiyu', male: 'Polly.Zhiyu' },
        'ja-JP': { female: 'Polly.Mizuki', male: 'Polly.Takumi' },
        'ko-KR': { female: 'Polly.Seoyeon', male: 'Polly.Seoyeon' },
        'it-IT': { female: 'Polly.Carla', male: 'Polly.Giorgio' },
        'nl-NL': { female: 'Polly.Lotte', male: 'Polly.Ruben' },
        'pl-PL': { female: 'Polly.Ewa', male: 'Polly.Jacek' },
        'tr-TR': { female: 'Polly.Filiz', male: 'Polly.Filiz' },
        'hi-IN': { female: 'Polly.Aditi', male: 'Polly.Aditi' },
        'th-TH': { female: 'Polly.Achara', male: 'Polly.Achara' },
        'vi-VN': { female: 'Polly.Joanna', male: 'Polly.Matthew' },
      };
      return voiceMap[lang]?.[gender] || voiceMap['en-US'][gender] || 'Polly.Joanna';
    };

    const pollyVoiceName = getVoiceName(voiceLanguage, voiceGender);
    console.log("Using settings - timeout:", ringTimeout, "GoogleTTS:", useGoogleTTS, "language:", voiceLanguage, "AI receptionist:", enableAiReceptionist);

    let twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>`;

    if (forwardPhones.length > 0) {
      // Dial with configurable timeout and status callback
      // If no answer, the action URL will handle the AI receptionist
      twiml += `<Dial timeout="${ringTimeout}" action="${statusCallbackUrl}" method="POST">`;
      
      for (const phone of forwardPhones) {
        twiml += `<Number statusCallback="${statusCallbackUrl}" statusCallbackEvent="initiated ringing answered completed">${phone}</Number>`;
      }
      
      twiml += `</Dial>`;
    } else if (enableAiReceptionist) {
      // No forward numbers - go directly to AI receptionist
      console.log("Connecting to AI receptionist for business:", business.id);
      const realtimeWsUrl = `wss://${projectId}.functions.supabase.co/functions/v1/voice-realtime?businessId=${business.id}&callSid=${callSid}`;
      // XML attribute escaping: TwiML is XML, so '&' must be encoded as '&amp;'
      const realtimeWsUrlXml = realtimeWsUrl.replaceAll("&", "&amp;");
      twiml += `<Connect><Stream url="${realtimeWsUrlXml}"/></Connect>`;
    } else {
      // No forward numbers and AI disabled - play voice message
      console.log("No forward numbers and AI disabled for business:", business.id);
      
      if (useGoogleTTS) {
        const audioUrl = `https://${projectId}.supabase.co/functions/v1/voice-audio?business_id=${business.id}&type=no-answer`;
        twiml += `<Play>${audioUrl}</Play>`;
      } else {
        const fallbackMessage = voiceLanguage.startsWith('he') 
          ? 'מצטערים, אין אפשרות לענות כרגע. נחזור אליכם בהקדם.'
          : 'Sorry, we are unable to answer your call right now. We will get back to you soon.';
        twiml += `<Say voice="${pollyVoiceName}" language="${voiceLanguage}">${fallbackMessage}</Say>`;
      }
      
      twiml += `<Hangup/>`;
    }

    twiml += `</Response>`;
    console.log("Returning TwiML:", twiml);

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error("Error in voice-incoming:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please try again later.</Say></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }
});
