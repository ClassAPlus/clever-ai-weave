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
    const formData = await req.formData();
    const twilioData: Record<string, string> = {};
    formData.forEach((value, key) => {
      twilioData[key] = value.toString();
    });

    console.log("Dial result webhook:", JSON.stringify(twilioData));

    const callSid = twilioData.CallSid;
    const dialCallStatus = twilioData.DialCallStatus; // completed, busy, no-answer, failed, canceled
    const calledNumber = twilioData.Called;
    const callerPhone = twilioData.From;
    const callDuration = parseInt(twilioData.DialCallDuration || '0', 10);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the call record
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .select('*, businesses(*), contacts(*)')
      .eq('twilio_call_sid', callSid)
      .single();

    if (callError || !callRecord) {
      console.error("Call record not found for SID:", callSid, callError);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    const business = callRecord.businesses;
    const contact = callRecord.contacts;
    const isMissedCall = ['no-answer', 'busy', 'failed', 'canceled'].includes(dialCallStatus);
    const wasAnswered = dialCallStatus === 'completed' && callDuration > 0;

    // Check settings
    const useGoogleTTS = !!Deno.env.get('GOOGLE_CLOUD_API_KEY');
    const projectId = 'wqhakzywmqirucmetnuo';
    const twilioSettings = business.twilio_settings || {};
    const enableAiReceptionist = twilioSettings.enableAiReceptionist !== false; // Default true

    console.log(`Call ${callSid}: status=${dialCallStatus}, answered=${wasAnswered}, duration=${callDuration}, aiReceptionist=${enableAiReceptionist}`);

    // Update call record
    await supabase
      .from('calls')
      .update({
        call_status: dialCallStatus,
        was_answered: wasAnswered,
        duration_seconds: callDuration,
      })
      .eq('id', callRecord.id);

    // If missed call, send textback SMS
    if (isMissedCall && !callRecord.textback_sent) {
      console.log("Missed call detected, checking if textback should be sent...");

      // Check if contact has opted out
      if (contact?.opted_out) {
        console.log("Contact has opted out, skipping textback");
      } else {
        // Check quiet hours
        const now = new Date();
        const israelTime = new Date(now.toLocaleString('en-US', { timeZone: business.timezone || 'Asia/Jerusalem' }));
        const currentHour = israelTime.getHours();
        const currentMinutes = israelTime.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        
        const quietStart = business.quiet_hours_start || '22:00';
        const quietEnd = business.quiet_hours_end || '07:00';
        
        const isQuietHours = isInQuietHours(currentTimeStr, quietStart, quietEnd);
        
        if (isQuietHours) {
          console.log("Currently in quiet hours, skipping textback");
        } else {
          // Send textback SMS
          const textbackMessage = business.ai_language === 'hebrew'
            ? `שלום, קיבלנו שיחה שלא נענתה מהמספר שלך ל${business.name}. איך נוכל לעזור? ניתן להשיב להודעה זו.`
            : `Hi, we missed your call to ${business.name}. How can we help? You can reply to this message.`;

          try {
            const twilioResponse = await sendSMS(
              business.twilio_phone_number,
              callerPhone,
              textbackMessage
            );

            console.log("Textback SMS sent:", twilioResponse.sid);

            // Update call record
            await supabase
              .from('calls')
              .update({
                textback_sent: true,
                textback_sent_at: new Date().toISOString(),
              })
              .eq('id', callRecord.id);

            // Create conversation and initial message
            const { data: conversation, error: convError } = await supabase
              .from('conversations')
              .insert({
                business_id: business.id,
                contact_id: contact?.id,
                call_id: callRecord.id,
                status: 'active',
              })
              .select()
              .single();

            if (conversation) {
              await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  direction: 'outbound',
                  content: textbackMessage,
                  ai_generated: true,
                  twilio_message_sid: twilioResponse.sid,
                });
            }

            // Create owner notification for missed call
            const notificationContent = business.ai_language === 'hebrew'
              ? `שיחה שלא נענתה מ-${callerPhone}. הודעת טקסטבק נשלחה.`
              : `Missed call from ${callerPhone}. Textback SMS sent.`;

            await supabase
              .from('owner_notifications')
              .insert({
                business_id: business.id,
                notification_type: 'missed_call',
                channel: 'sms',
                content: notificationContent,
                related_call_id: callRecord.id,
              });

            // Send notification to owner if configured
            if (business.owner_phone && business.owner_notification_channels?.includes('sms')) {
              await sendSMS(
                business.twilio_phone_number,
                business.owner_phone,
                notificationContent
              );
            }

          } catch (smsError) {
            console.error("Error sending textback SMS:", smsError);
          }
        }
      }
    }

    // Handle missed call - either connect to AI or play message
    let twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>`;
    
    if (isMissedCall && enableAiReceptionist) {
      // Connect to AI receptionist for real-time conversation
      const realtimeWsUrl = `wss://${projectId}.functions.supabase.co/functions/v1/voice-realtime?businessId=${business.id}&callSid=${callSid}`;
      console.log("Connecting missed call to AI receptionist:", realtimeWsUrl);
      twiml += `<Connect><Stream url="${realtimeWsUrl}"/></Connect>`;
    } else if (isMissedCall && useGoogleTTS) {
      // Play Google Cloud TTS voice message for missed calls (AI disabled)
      const audioUrl = `https://${projectId}.supabase.co/functions/v1/voice-audio?business_id=${business.id}&type=missed-call`;
      twiml += `<Play>${audioUrl}</Play>`;
      twiml += `<Hangup/>`;
      console.log("Playing Google Cloud TTS missed call message");
    } else {
      twiml += `<Hangup/>`;
    }
    
    twiml += `</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error("Error in voice-dial-result:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }
});

function isInQuietHours(current: string, start: string, end: string): boolean {
  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
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
