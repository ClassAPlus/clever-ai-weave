import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return new Response(JSON.stringify({ success: false, error: 'Appointment ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending manual reminder for appointment: ${appointmentId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the appointment with contact and business info
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        service_type,
        confirmation_code,
        status,
        reminder_sent_at,
        contacts!inner(
          id,
          phone_number,
          name,
          opted_out
        ),
        businesses!inner(
          id,
          name,
          twilio_phone_number,
          ai_language,
          twilio_settings
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appError || !appointment) {
      console.error("Appointment not found:", appError);
      return new Response(JSON.stringify({ success: false, error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contact = appointment.contacts as any;
    const business = appointment.businesses as any;
    const twilioSettings = business?.twilio_settings || {};

    // Validate
    if (contact.opted_out) {
      return new Response(JSON.stringify({ success: false, error: 'Contact has opted out of messages' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!contact.phone_number || !business.twilio_phone_number) {
      return new Response(JSON.stringify({ success: false, error: 'Missing phone number configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return new Response(JSON.stringify({ success: false, error: 'Cannot send reminder for cancelled or completed appointments' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isHebrew = business.ai_language === 'hebrew';
    const scheduledDate = new Date(appointment.scheduled_at);

    // Format the appointment time
    const timeStr = scheduledDate.toLocaleTimeString(isHebrew ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !isHebrew
    });

    const dateStr = scheduledDate.toLocaleDateString(isHebrew ? 'he-IL' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    // Build the reminder message
    const customerName = contact.name || '';
    const serviceText = appointment.service_type || (isHebrew ? 'תור' : 'appointment');

    let reminderMessage: string;

    // Check for custom template
    const customTemplate = twilioSettings.appointmentReminderTemplate;
    if (customTemplate && customTemplate.trim()) {
      reminderMessage = customTemplate
        .replace(/\{name\}/gi, customerName || (isHebrew ? 'לקוח/ה יקר/ה' : 'Valued Customer'))
        .replace(/\{business\}/gi, business.name)
        .replace(/\{service\}/gi, serviceText)
        .replace(/\{time\}/gi, timeStr)
        .replace(/\{date\}/gi, dateStr);
    } else if (isHebrew) {
      reminderMessage = `שלום${customerName ? ` ${customerName}` : ''}! תזכורת מ${business.name}: יש לך ${serviceText} ב-${dateStr} בשעה ${timeStr}. ` +
        `השב "כן" לאישור או "ביטול" לביטול התור.`;
    } else {
      reminderMessage = `Hi${customerName ? ` ${customerName}` : ''}! Reminder from ${business.name}: You have an ${serviceText} on ${dateStr} at ${timeStr}. ` +
        `Reply YES to confirm or CANCEL to cancel.`;
    }

    // Send SMS via Twilio
    console.log(`Sending reminder to ${contact.phone_number}`);

    const smsResult = await sendSMS(
      business.twilio_phone_number,
      contact.phone_number,
      reminderMessage
    );

    // Update appointment with reminder_sent_at
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', appointmentId);

    if (updateError) {
      console.error(`Failed to update appointment:`, updateError);
    }

    console.log(`Reminder sent successfully, SID: ${smsResult.sid}`);

    return new Response(JSON.stringify({ 
      success: true, 
      messageSid: smsResult.sid 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in send-appointment-reminder:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
    throw new Error(`Twilio SMS error: ${errorText}`);
  }

  return await response.json();
}
