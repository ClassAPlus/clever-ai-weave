import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, contactId, message, contactPhone } = await req.json();

    console.log("Send manual SMS request:", { businessId, contactId, messageLength: message?.length });

    // Validate inputs
    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'Business ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 1600) {
      return new Response(
        JSON.stringify({ error: 'Message is too long (max 1600 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contactId && !contactPhone) {
      return new Response(
        JSON.stringify({ error: 'Contact ID or phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get business details
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", bizError);
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!business.twilio_phone_number) {
      return new Response(
        JSON.stringify({ error: 'No AI phone number configured for this business' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contact phone number
    let toPhone = contactPhone;
    let contact = null;

    if (contactId) {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('business_id', businessId)
        .single();

      if (contactError || !contactData) {
        console.error("Contact not found:", contactError);
        return new Response(
          JSON.stringify({ error: 'Contact not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      contact = contactData;
      toPhone = contact.phone_number;

      // Check if contact has opted out
      if (contact.opted_out) {
        return new Response(
          JSON.stringify({ error: 'Cannot send SMS to opted-out contact' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate phone format
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    const cleanPhone = toPhone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Sending SMS from", business.twilio_phone_number, "to", cleanPhone);

    // Send SMS via Twilio
    const smsResult = await sendSMS(business.twilio_phone_number, cleanPhone, message.trim());

    console.log("SMS sent successfully:", smsResult.sid);

    // If we have a contact, create/update conversation and add message
    if (contact) {
      // Find or create conversation
      let conversationId: string;
      
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId)
        .eq('contact_id', contactId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: businessId,
            contact_id: contactId,
            status: 'active'
          })
          .select('id')
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          // SMS was sent successfully, so don't fail the request
        } else {
          conversationId = newConv.id;
        }
      }

      // Add message to conversation
      if (conversationId) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: message.trim(),
            direction: 'outbound',
            ai_generated: false,
            twilio_message_sid: smsResult.sid
          });

        if (msgError) {
          console.error("Error saving message:", msgError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: smsResult.sid,
        sentTo: cleanPhone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in send-manual-sms:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send SMS' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendSMS(from: string, to: string, body: string): Promise<{ sid: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twilio SMS error:", errorText);
    throw new Error(`Twilio SMS error: ${errorText}`);
  }

  return await response.json();
}
