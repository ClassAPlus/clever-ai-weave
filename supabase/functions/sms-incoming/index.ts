import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// Hebrew opt-out keywords
const OPT_OUT_KEYWORDS = ['stop', 'unsubscribe', 'עצור', 'הסר', 'הפסק'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const twilioData: Record<string, string> = {};
    formData.forEach((value, key) => {
      twilioData[key] = value.toString();
    });

    console.log("Incoming SMS webhook:", JSON.stringify(twilioData));

    const toNumber = twilioData.To; // Business Twilio number
    const fromNumber = twilioData.From; // Caller's phone
    const messageBody = twilioData.Body?.trim() || '';
    const messageSid = twilioData.MessageSid;

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find business by Twilio number
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('twilio_phone_number', toNumber)
      .single();

    if (bizError || !business) {
      console.error("Business not found for number:", toNumber);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Find or create contact
    let { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('business_id', business.id)
      .eq('phone_number', fromNumber)
      .single();

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          business_id: business.id,
          phone_number: fromNumber,
        })
        .select()
        .single();
      contact = newContact;
    }

    // Check for opt-out keywords
    const lowerMessage = messageBody.toLowerCase();
    if (OPT_OUT_KEYWORDS.some(kw => lowerMessage === kw)) {
      console.log("Opt-out request received from:", fromNumber);
      
      await supabase
        .from('contacts')
        .update({
          opted_out: true,
          opted_out_at: new Date().toISOString(),
        })
        .eq('id', contact?.id);

      const optOutReply = business.ai_language === 'hebrew'
        ? 'הוסרת מרשימת ההודעות שלנו. לא תקבל עוד הודעות מאיתנו.'
        : 'You have been unsubscribed. You will no longer receive messages from us.';

      await sendSMS(toNumber, fromNumber, optOutReply);

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Check if contact has opted out
    if (contact?.opted_out) {
      console.log("Contact has opted out, ignoring message");
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Find or create active conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', business.id)
      .eq('contact_id', contact?.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          business_id: business.id,
          contact_id: contact?.id,
          status: 'active',
        })
        .select()
        .single();
      conversation = newConv;
    }

    // Save incoming message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation?.id,
        direction: 'inbound',
        content: messageBody,
        ai_generated: false,
        twilio_message_sid: messageSid,
      });

    // Check rate limiting (max 10 messages per day per contact)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation?.id)
      .eq('direction', 'outbound')
      .gte('created_at', today.toISOString());

    if ((messageCount || 0) >= 10) {
      console.log("Rate limit reached for contact:", contact?.id);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Get conversation history for AI context
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('direction, content, created_at')
      .eq('conversation_id', conversation?.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Generate AI response
    const aiResponse = await generateAIResponse(business, messageHistory || [], messageBody);

    console.log("AI response:", aiResponse);

    // Send AI response via SMS
    const smsResult = await sendSMS(toNumber, fromNumber, aiResponse);

    // Save AI response message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation?.id,
        direction: 'outbound',
        content: aiResponse,
        ai_generated: true,
        twilio_message_sid: smsResult.sid,
      });

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation?.id);

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );

  } catch (error) {
    console.error("Error in sms-incoming:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }
});

async function generateAIResponse(
  business: any,
  messageHistory: any[],
  currentMessage: string
): Promise<string> {
  const language = business.ai_language || 'hebrew';
  const isHebrew = language === 'hebrew';
  
  const systemPrompt = `You are a helpful AI assistant for ${business.name}.
${business.ai_instructions || ''}

Business Services: ${(business.services || []).join(', ') || 'Not specified'}
Business Hours: ${JSON.stringify(business.business_hours || {})}

Instructions:
- Respond in ${isHebrew ? 'Hebrew' : 'English'}
- Keep responses concise (SMS length, under 160 characters when possible)
- Be friendly and professional
- If the customer wants to book an appointment, collect: preferred date/time and service type
- If you cannot help, offer to have someone call them back
- Never make up information about services or prices`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...messageHistory.map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: currentMessage },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI error:", errorText);
    return isHebrew 
      ? 'מצטערים, אירעה שגיאה. אנא נסו שוב מאוחר יותר.'
      : 'Sorry, an error occurred. Please try again later.';
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || (isHebrew ? 'תודה על פנייתך.' : 'Thank you for your message.');
}

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
    throw new Error(`Twilio SMS error: ${errorText}`);
  }

  return await response.json();
}
