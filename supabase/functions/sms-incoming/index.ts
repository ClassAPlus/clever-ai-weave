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

// AI Tools for function calling
const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book an appointment for the customer. Use when customer confirms they want to schedule.',
      parameters: {
        type: 'object',
        properties: {
          service_type: {
            type: 'string',
            description: 'The service the customer wants (e.g., haircut, consultation)',
          },
          preferred_date: {
            type: 'string',
            description: 'Preferred date in YYYY-MM-DD format',
          },
          preferred_time: {
            type: 'string',
            description: 'Preferred time in HH:MM format (24h)',
          },
          notes: {
            type: 'string',
            description: 'Any additional notes from the customer',
          },
        },
        required: ['service_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_inquiry',
      description: 'Create an inquiry for the business owner to review. Use for complex questions, pricing requests, or issues that need human attention.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Brief summary of what the customer needs help with',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high', 'urgent'],
            description: 'Priority level based on urgency',
          },
        },
        required: ['summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_callback',
      description: 'Request that the business owner calls the customer back. Use when customer explicitly asks to speak with someone.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Why the customer wants a callback',
          },
          urgency: {
            type: 'string',
            enum: ['normal', 'urgent'],
            description: 'How urgent the callback request is',
          },
        },
        required: ['reason'],
      },
    },
  },
];

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

    // Generate AI response with tool calling
    const aiResult = await generateAIResponseWithTools(
      supabase,
      business,
      contact,
      conversation,
      messageHistory || [],
      messageBody
    );

    console.log("AI response:", aiResult.message);
    if (aiResult.toolsExecuted.length > 0) {
      console.log("Tools executed:", aiResult.toolsExecuted);
    }

    // Send AI response via SMS
    const smsResult = await sendSMS(toNumber, fromNumber, aiResult.message);

    // Save AI response message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation?.id,
        direction: 'outbound',
        content: aiResult.message,
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

async function generateAIResponseWithTools(
  supabase: any,
  business: any,
  contact: any,
  conversation: any,
  messageHistory: any[],
  currentMessage: string
): Promise<{ message: string; toolsExecuted: string[] }> {
  const language = business.ai_language || 'hebrew';
  const isHebrew = language === 'hebrew';
  
  const systemPrompt = `You are a helpful AI assistant for ${business.name}.
${business.ai_instructions || ''}

Business Services: ${(business.services || []).join(', ') || 'Not specified'}
Business Hours: ${JSON.stringify(business.business_hours || {})}
Timezone: ${business.timezone || 'Asia/Jerusalem'}

AVAILABLE ACTIONS:
1. book_appointment - When customer wants to schedule. Collect service type, date, and time first.
2. create_inquiry - For questions needing owner attention (pricing, complex issues, complaints).
3. request_callback - When customer explicitly asks to speak with someone.

Instructions:
- Respond in ${isHebrew ? 'Hebrew' : 'English'}
- Keep responses concise (SMS length, under 160 characters when possible)
- Be friendly and professional
- Use tools when appropriate - don't just say you'll do something, actually call the function
- For appointments: confirm details before booking
- Never make up information about services or prices
- If unsure, create an inquiry for the owner`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...messageHistory.map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: currentMessage },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: AI_TOOLS,
        tool_choice: 'auto',
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", errorText);
      return {
        message: isHebrew 
          ? 'מצטערים, אירעה שגיאה. אנא נסו שוב מאוחר יותר.'
          : 'Sorry, an error occurred. Please try again later.',
        toolsExecuted: [],
      };
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message;
    const toolsExecuted: string[] = [];

    // Check if AI wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: any[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, args);
        toolsExecuted.push(functionName);
        
        let toolResult: string;
        
        try {
          switch (functionName) {
            case 'book_appointment':
              toolResult = await executeBookAppointment(supabase, business, contact, conversation, args, isHebrew);
              break;
            case 'create_inquiry':
              toolResult = await executeCreateInquiry(supabase, business, contact, conversation, args, isHebrew);
              break;
            case 'request_callback':
              toolResult = await executeRequestCallback(supabase, business, contact, conversation, args, isHebrew);
              break;
            default:
              toolResult = 'Unknown function';
          }
        } catch (err) {
          console.error(`Tool ${functionName} error:`, err);
          toolResult = `Error executing ${functionName}`;
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: toolResult,
        });
      }

      // Get final response after tool execution
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults,
      ];

      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: finalMessages,
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error("OpenAI final response error:", errorText);
        return {
          message: isHebrew 
            ? 'הפעולה בוצעה בהצלחה. נחזור אליך בהקדם.'
            : 'Action completed successfully. We will get back to you soon.',
          toolsExecuted,
        };
      }

      const finalData = await finalResponse.json();
      return {
        message: finalData.choices[0]?.message?.content || (isHebrew ? 'תודה על פנייתך.' : 'Thank you for your message.'),
        toolsExecuted,
      };
    }

    // No tool calls, return direct response
    return {
      message: assistantMessage.content || (isHebrew ? 'תודה על פנייתך.' : 'Thank you for your message.'),
      toolsExecuted: [],
    };

  } catch (error) {
    console.error("AI generation error:", error);
    return {
      message: isHebrew 
        ? 'מצטערים, אירעה שגיאה. אנא נסו שוב מאוחר יותר.'
        : 'Sorry, an error occurred. Please try again later.',
      toolsExecuted: [],
    };
  }
}

async function executeBookAppointment(
  supabase: any,
  business: any,
  contact: any,
  conversation: any,
  args: { service_type: string; preferred_date?: string; preferred_time?: string; notes?: string },
  isHebrew: boolean
): Promise<string> {
  // Parse date and time
  let scheduledAt: Date;
  
  if (args.preferred_date && args.preferred_time) {
    scheduledAt = new Date(`${args.preferred_date}T${args.preferred_time}:00`);
  } else if (args.preferred_date) {
    scheduledAt = new Date(`${args.preferred_date}T10:00:00`); // Default to 10 AM
  } else {
    // Default to tomorrow at 10 AM
    scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(10, 0, 0, 0);
  }

  // Generate confirmation code
  const confirmationCode = `APT-${Date.now().toString(36).toUpperCase()}`;

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      business_id: business.id,
      contact_id: contact?.id,
      conversation_id: conversation?.id,
      service_type: args.service_type,
      scheduled_at: scheduledAt.toISOString(),
      notes: args.notes || null,
      confirmation_code: confirmationCode,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error("Appointment creation error:", error);
    return isHebrew 
      ? 'שגיאה ביצירת התור. נסו שוב.'
      : 'Error creating appointment. Please try again.';
  }

  // Create owner notification
  await supabase
    .from('owner_notifications')
    .insert({
      business_id: business.id,
      related_appointment_id: appointment.id,
      notification_type: 'new_appointment',
      channel: 'sms',
      content: isHebrew
        ? `תור חדש: ${args.service_type} ב-${scheduledAt.toLocaleDateString('he-IL')} ${scheduledAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}. קוד: ${confirmationCode}`
        : `New appointment: ${args.service_type} on ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Code: ${confirmationCode}`,
    });

  // Notify owner via SMS if configured
  if (business.owner_phone && business.owner_notification_channels?.includes('sms')) {
    const notifyMessage = isHebrew
      ? `📅 תור חדש ב-${business.name}: ${args.service_type}, ${scheduledAt.toLocaleDateString('he-IL')} ${scheduledAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}. טלפון: ${contact?.phone_number}`
      : `📅 New appointment at ${business.name}: ${args.service_type}, ${scheduledAt.toLocaleDateString()} ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Phone: ${contact?.phone_number}`;
    
    try {
      await sendSMS(business.twilio_phone_number, business.owner_phone, notifyMessage);
    } catch (err) {
      console.error("Owner notification SMS failed:", err);
    }
  }

  return JSON.stringify({
    success: true,
    confirmationCode,
    scheduledAt: scheduledAt.toISOString(),
    service: args.service_type,
  });
}

async function executeCreateInquiry(
  supabase: any,
  business: any,
  contact: any,
  conversation: any,
  args: { summary: string; priority?: string },
  isHebrew: boolean
): Promise<string> {
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .insert({
      business_id: business.id,
      contact_id: contact?.id,
      conversation_id: conversation?.id,
      summary: args.summary,
      priority: args.priority || 'normal',
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error("Inquiry creation error:", error);
    return isHebrew 
      ? 'שגיאה ביצירת הפנייה.'
      : 'Error creating inquiry.';
  }

  // Create owner notification
  await supabase
    .from('owner_notifications')
    .insert({
      business_id: business.id,
      related_inquiry_id: inquiry.id,
      notification_type: 'new_inquiry',
      channel: 'sms',
      content: isHebrew
        ? `פנייה חדשה (${args.priority || 'normal'}): ${args.summary}`
        : `New inquiry (${args.priority || 'normal'}): ${args.summary}`,
    });

  // Notify owner if high priority
  if ((args.priority === 'high' || args.priority === 'urgent') && 
      business.owner_phone && 
      business.owner_notification_channels?.includes('sms')) {
    const notifyMessage = isHebrew
      ? `⚠️ פנייה ${args.priority === 'urgent' ? 'דחופה' : 'חשובה'}: ${args.summary}. טלפון: ${contact?.phone_number}`
      : `⚠️ ${args.priority === 'urgent' ? 'Urgent' : 'Important'} inquiry: ${args.summary}. Phone: ${contact?.phone_number}`;
    
    try {
      await sendSMS(business.twilio_phone_number, business.owner_phone, notifyMessage);
    } catch (err) {
      console.error("Owner notification SMS failed:", err);
    }
  }

  return JSON.stringify({
    success: true,
    inquiryId: inquiry.id,
    priority: args.priority || 'normal',
  });
}

async function executeRequestCallback(
  supabase: any,
  business: any,
  contact: any,
  conversation: any,
  args: { reason: string; urgency?: string },
  isHebrew: boolean
): Promise<string> {
  const isUrgent = args.urgency === 'urgent';

  // Create inquiry for callback request
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .insert({
      business_id: business.id,
      contact_id: contact?.id,
      conversation_id: conversation?.id,
      summary: isHebrew 
        ? `בקשה לשיחה חוזרת: ${args.reason}`
        : `Callback request: ${args.reason}`,
      priority: isUrgent ? 'urgent' : 'high',
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error("Callback request error:", error);
    return isHebrew 
      ? 'שגיאה בבקשה לשיחה חוזרת.'
      : 'Error requesting callback.';
  }

  // Create owner notification
  await supabase
    .from('owner_notifications')
    .insert({
      business_id: business.id,
      related_inquiry_id: inquiry.id,
      notification_type: 'callback_request',
      channel: 'sms',
      content: isHebrew
        ? `📞 בקשה לשיחה חוזרת${isUrgent ? ' (דחוף)' : ''}: ${args.reason}`
        : `📞 Callback requested${isUrgent ? ' (urgent)' : ''}: ${args.reason}`,
    });

  // Always notify owner for callback requests
  if (business.owner_phone && business.owner_notification_channels?.includes('sms')) {
    const notifyMessage = isHebrew
      ? `📞 ${isUrgent ? 'דחוף! ' : ''}בקשה לשיחה חוזרת מ-${contact?.phone_number}: ${args.reason}`
      : `📞 ${isUrgent ? 'Urgent! ' : ''}Callback requested from ${contact?.phone_number}: ${args.reason}`;
    
    try {
      await sendSMS(business.twilio_phone_number, business.owner_phone, notifyMessage);
    } catch (err) {
      console.error("Owner notification SMS failed:", err);
    }
  }

  return JSON.stringify({
    success: true,
    urgent: isUrgent,
  });
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
