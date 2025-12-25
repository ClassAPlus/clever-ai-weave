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

  console.log("Starting appointment reminders job...");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    
    // We need to query appointments for different timing windows based on business settings
    // Get all pending/confirmed appointments that haven't been reminded yet
    const { data: appointments, error: apptsError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        service_type,
        confirmation_code,
        status,
        business_id,
        contact_id,
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
          timezone,
          twilio_settings
        )
      `)
      .is('reminder_sent_at', null)
      .in('status', ['pending', 'confirmed'])
      .eq('contacts.opted_out', false)
      .gte('scheduled_at', now.toISOString()) // Only future appointments
      .order('scheduled_at', { ascending: true });

    if (apptsError) {
      console.error("Error fetching appointments:", apptsError);
      return new Response(JSON.stringify({ error: apptsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${appointments?.length || 0} pending appointments to evaluate`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as { appointmentId: string; status: string; error?: string }[],
    };

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No appointments need reminders",
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const appointment of appointments) {
      try {
        const contact = appointment.contacts as any;
        const business = appointment.businesses as any;
        const twilioSettings = business?.twilio_settings || {};

        // Check if business has appointment reminders enabled (default to true)
        if (twilioSettings.enableAppointmentReminders === false) {
          continue; // Silently skip - don't count as skipped
        }

        // Determine reminder timing (default to 1 day before)
        const reminderTiming = twilioSettings.appointmentReminderTiming || '1_day';
        const scheduledAt = new Date(appointment.scheduled_at);
        
        // Check if this appointment should be reminded based on timing setting
        if (!shouldSendReminder(now, scheduledAt, reminderTiming)) {
          continue; // Not time yet - silently skip
        }

        // Skip if no phone number or no Twilio number configured
        if (!contact?.phone_number || !business?.twilio_phone_number) {
          console.log(`Skipping appointment ${appointment.id} - missing phone info`);
          results.skipped++;
          results.details.push({ 
            appointmentId: appointment.id, 
            status: 'skipped',
            error: 'Missing phone number configuration'
          });
          continue;
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
          // Use custom template with placeholder substitution
          reminderMessage = customTemplate
            .replace(/\{name\}/gi, customerName || (isHebrew ? 'לקוח/ה יקר/ה' : 'Valued Customer'))
            .replace(/\{business\}/gi, business.name)
            .replace(/\{service\}/gi, serviceText)
            .replace(/\{time\}/gi, timeStr)
            .replace(/\{date\}/gi, dateStr);
        } else if (isHebrew) {
          reminderMessage = `שלום${customerName ? ` ${customerName}` : ''}! תזכורת מ${business.name}: יש לך ${serviceText} מחר ב-${timeStr}. ` +
            `השב "כן" לאישור או "ביטול" לביטול התור.`;
        } else {
          reminderMessage = `Hi${customerName ? ` ${customerName}` : ''}! Reminder from ${business.name}: You have an ${serviceText} tomorrow at ${timeStr}. ` +
            `Reply YES to confirm or CANCEL to cancel.`;
        }

        // Send SMS via Twilio
        console.log(`Sending reminder to ${contact.phone_number} for appointment ${appointment.id}`);
        
        const smsResult = await sendSMS(
          business.twilio_phone_number,
          contact.phone_number,
          reminderMessage
        );

        // Update appointment with reminder_sent_at
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', appointment.id);

        if (updateError) {
          console.error(`Failed to update appointment ${appointment.id}:`, updateError);
        }

        console.log(`Reminder sent successfully for appointment ${appointment.id}, SID: ${smsResult.sid}`);
        results.sent++;
        results.details.push({ appointmentId: appointment.id, status: 'sent' });

      } catch (err) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, err);
        results.failed++;
        results.details.push({ 
          appointmentId: appointment.id, 
          status: 'failed',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    console.log(`Reminder job complete. Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`);

    return new Response(JSON.stringify({ 
      message: "Appointment reminders processed",
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in appointment-reminders:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Determine if a reminder should be sent based on the timing setting
 * @param now Current time
 * @param scheduledAt Appointment scheduled time
 * @param timing Reminder timing setting ('same_day', '1_day', '2_days')
 */
function shouldSendReminder(now: Date, scheduledAt: Date, timing: string): boolean {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = scheduledAt.getTime() - now.getTime();
  const diffDays = diffMs / msPerDay;

  switch (timing) {
    case 'same_day':
      // Send reminder on the morning of the appointment (0-12 hours before, if scheduled after noon)
      // Or if appointment is within 0-24 hours and we're in the morning (before 10 AM local)
      return diffDays >= 0 && diffDays <= 1 && now.getHours() >= 7 && now.getHours() <= 10;
    
    case '2_days':
      // Send reminder 2 days before (between 24-48 hours before)
      return diffDays >= 1.5 && diffDays <= 2.5;
    
    case '1_day':
    default:
      // Send reminder 1 day before (between 12-36 hours before)
      return diffDays >= 0.5 && diffDays <= 1.5;
  }
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
