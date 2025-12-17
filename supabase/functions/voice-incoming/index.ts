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

    // Build TwiML response to dial forward numbers
    const forwardPhones = business.forward_to_phones || [];
    const projectId = 'wqhakzywmqirucmetnuo';
    const statusCallbackUrl = `https://${projectId}.supabase.co/functions/v1/voice-dial-result`;

    let twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>`;

    if (forwardPhones.length > 0) {
      // Dial with timeout and status callback
      twiml += `<Dial timeout="25" action="${statusCallbackUrl}" method="POST">`;
      
      for (const phone of forwardPhones) {
        twiml += `<Number statusCallback="${statusCallbackUrl}" statusCallbackEvent="initiated ringing answered completed">${phone}</Number>`;
      }
      
      twiml += `</Dial>`;
    } else {
      // No forward numbers configured - go directly to voicemail/hangup
      console.log("No forward numbers configured for business:", business.id);
      twiml += `<Say language="he-IL">מצטערים, אין אפשרות לענות כרגע. נחזור אליכם בהקדם.</Say>`;
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
