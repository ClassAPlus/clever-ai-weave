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
          opted_out,
          preferred_language
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

    // Determine the language to use: contact's preferred language takes priority, then business primary language
    let effectiveLanguage = "hebrew"; // default fallback
    
    // First, check if contact has a preferred language set
    if (contact.preferred_language) {
      effectiveLanguage = contact.preferred_language;
      console.log(`Using contact's preferred language: ${effectiveLanguage}`);
    } else {
      // Fall back to business primary language
      // Parse ai_language to get primary language
      // Format can be: "hebrew" (legacy), "hebrew,english" (legacy), or "hebrew:hebrew,english:true" (new format)
      const languageData = business.ai_language || "hebrew";
      
      const parts = languageData.split(":");
      if (parts.length >= 2) {
        // New format: "primary:lang1,lang2:autodetect"
        effectiveLanguage = parts[0];
      } else if (languageData.includes(",")) {
        // Legacy format: "lang1,lang2" - use first as primary
        effectiveLanguage = languageData.split(",")[0].trim();
      } else {
        // Single language legacy format
        effectiveLanguage = languageData;
      }
      console.log(`Using business primary language: ${effectiveLanguage}`);
    }
    
    const isHebrew = effectiveLanguage === 'hebrew';
    const isRTL = ['hebrew', 'arabic'].includes(effectiveLanguage);
    const scheduledDate = new Date(appointment.scheduled_at);

    // Format the appointment time based on effective language
    const timeStr = scheduledDate.toLocaleTimeString(isHebrew ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !isHebrew && effectiveLanguage !== 'arabic'
    });

    const dateStr = scheduledDate.toLocaleDateString(
      effectiveLanguage === 'hebrew' ? 'he-IL' : 
      effectiveLanguage === 'arabic' ? 'ar-SA' :
      effectiveLanguage === 'russian' ? 'ru-RU' :
      effectiveLanguage === 'spanish' ? 'es-ES' :
      effectiveLanguage === 'french' ? 'fr-FR' :
      effectiveLanguage === 'german' ? 'de-DE' : 'en-US', 
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }
    );

    // Build the reminder message
    const customerName = contact.name || '';
    
    // Default service text per language
    const defaultServiceText: Record<string, string> = {
      hebrew: 'תור',
      arabic: 'موعد',
      russian: 'запись',
      spanish: 'cita',
      french: 'rendez-vous',
      german: 'Termin',
      english: 'appointment'
    };
    const serviceText = appointment.service_type || defaultServiceText[effectiveLanguage] || 'appointment';

    let reminderMessage: string;

    // Check for language-specific template first, then legacy single template
    const templates = twilioSettings.appointmentReminderTemplates || {};
    const customTemplate = templates[effectiveLanguage] || twilioSettings.appointmentReminderTemplate;
    
    // Default templates per language
    const defaultTemplates: Record<string, string> = {
      hebrew: 'שלום{name}! תזכורת מ{business}: יש לך {service} ב-{date} בשעה {time}. השב "כן" לאישור או "ביטול" לביטול התור.',
      arabic: 'مرحبا{name}! تذكير من {business}: لديك {service} في {date} الساعة {time}. رد بـ"نعم" للتأكيد أو "إلغاء" للإلغاء.',
      russian: 'Здравствуйте{name}! Напоминание от {business}: у вас {service} {date} в {time}. Ответьте "ДА" для подтверждения или "ОТМЕНА" для отмены.',
      spanish: '¡Hola{name}! Recordatorio de {business}: Tienes {service} el {date} a las {time}. Responde SÍ para confirmar o CANCELAR para cancelar.',
      french: 'Bonjour{name}! Rappel de {business}: Vous avez {service} le {date} à {time}. Répondez OUI pour confirmer ou ANNULER pour annuler.',
      german: 'Hallo{name}! Erinnerung von {business}: Sie haben {service} am {date} um {time}. Antworten Sie JA zur Bestätigung oder ABBRECHEN zum Stornieren.',
      english: 'Hi{name}! Reminder from {business}: You have an {service} on {date} at {time}. Reply YES to confirm or CANCEL to cancel.'
    };
    
    if (customTemplate && customTemplate.trim()) {
      reminderMessage = customTemplate
        .replace(/\{name\}/gi, customerName ? ` ${customerName}` : '')
        .replace(/\{business\}/gi, business.name)
        .replace(/\{service\}/gi, serviceText)
        .replace(/\{time\}/gi, timeStr)
        .replace(/\{date\}/gi, dateStr);
    } else {
      const template = defaultTemplates[effectiveLanguage] || defaultTemplates.english;
      reminderMessage = template
        .replace(/\{name\}/gi, customerName ? ` ${customerName}` : '')
        .replace(/\{business\}/gi, business.name)
        .replace(/\{service\}/gi, serviceText)
        .replace(/\{time\}/gi, timeStr)
        .replace(/\{date\}/gi, dateStr);
    }

    console.log(`Sending reminder in ${effectiveLanguage} to ${contact.phone_number}`);

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
