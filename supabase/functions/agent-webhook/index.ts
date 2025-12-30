import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Timezone offset map for common timezones
const TIMEZONE_OFFSETS: Record<string, string> = {
  "Asia/Jerusalem": "+02:00",
  "Asia/Tel_Aviv": "+02:00",
  "Europe/London": "+00:00",
  "Europe/Paris": "+01:00",
  "Europe/Berlin": "+01:00",
  "America/New_York": "-05:00",
  "America/Los_Angeles": "-08:00",
  "America/Chicago": "-06:00",
  "UTC": "+00:00"
};

function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      const match = tzPart.value.match(/GMT([+-]\d{2}:\d{2})/);
      if (match) return match[1];
    }
  } catch (e) {
    console.log("Error getting timezone offset:", e);
  }
  return TIMEZONE_OFFSETS[timezone] || "+00:00";
}

// Send SMS via Twilio
async function sendSMS(from: string, to: string, body: string): Promise<{ sid: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const formData = new URLSearchParams();
  formData.append("From", from);
  formData.append("To", to);
  formData.append("Body", body);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio SMS error: ${error}`);
  }
  
  return await response.json();
}

// Load business context
async function loadBusinessContext(businessId: string) {
  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  
  if (error || !business) {
    throw new Error(`Business not found: ${businessId}`);
  }
  
  return {
    business,
    businessName: business.name,
    timezone: business.timezone || "UTC",
    businessHours: business.business_hours || {},
    services: business.services || [],
    knowledgeBase: business.knowledge_base || {},
    settings: business.twilio_settings || {},
    businessPhone: business.twilio_phone_number,
    aiLanguage: business.ai_language || "english",
  };
}

// Get or create contact by phone
async function getOrCreateContact(businessId: string, callerPhone: string) {
  // First try to find existing contact
  let { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("business_id", businessId)
    .eq("phone_number", callerPhone)
    .single();
  
  if (!contact) {
    // Create new contact
    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert({
        business_id: businessId,
        phone_number: callerPhone,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating contact:", error);
      return null;
    }
    contact = newContact;
  }
  
  return contact;
}

// Tool handlers
const toolHandlers: Record<string, (args: any, ctx: any) => Promise<any>> = {
  
  // Create appointment
  async create_appointment(args, ctx) {
    const { scheduled_date, service_type, caller_name, notes, time_of_day_stated } = args;
    const { businessId, contactId, businessHours, timezone, businessName, businessPhone, callerPhone, aiLanguage, settings } = ctx;
    
    if (!businessId) {
      return { success: false, error: "Business ID not available" };
    }
    
    const appointmentDate = new Date(scheduled_date);
    
    // Validate day of week
    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });
    const appointmentDay = dayFormatter.format(appointmentDate).toLowerCase();
    const dayMap: Record<string, string> = {
      "monday": "mon", "tuesday": "tue", "wednesday": "wed",
      "thursday": "thu", "friday": "fri", "saturday": "sat", "sunday": "sun"
    };
    const dayKey = dayMap[appointmentDay];
    const hours = businessHours[dayKey];
    
    if (!hours || !hours.start || !hours.end) {
      return { 
        success: false, 
        error: `We are closed on ${appointmentDay}. Please choose a different day.`,
        closed_day: appointmentDay
      };
    }
    
    // Validate time is within business hours
    const timeFormatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: timezone, 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    const appointmentTime = timeFormatter.format(appointmentDate);
    
    if (appointmentTime < hours.start || appointmentTime >= hours.end) {
      return { 
        success: false, 
        error: `The requested time ${appointmentTime} is outside business hours. On ${appointmentDay}, we are open from ${hours.start} to ${hours.end}.`,
        business_hours: { opens: hours.start, closes: hours.end }
      };
    }
    
    // Generate confirmation code
    const confirmationCode = `APT-${Date.now().toString(36).toUpperCase()}`;
    
    // Create the appointment
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        business_id: businessId,
        contact_id: contactId,
        scheduled_at: scheduled_date,
        service_type: service_type || "General",
        notes: notes ? `${caller_name ? `Caller: ${caller_name}. ` : ""}${notes}` : (caller_name || ""),
        confirmation_code: confirmationCode,
        status: "scheduled"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating appointment:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Appointment created:", appointment.id);
    
    // Send confirmation SMS
    if (callerPhone && businessPhone) {
      const preferredFormat = settings?.timeFormat || '12h';
      const apptDate = new Date(scheduled_date);
      const dateFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
        timeZone: timezone,
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      const fmtTimeFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
        timeZone: timezone,
        hour: preferredFormat === '24h' ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: preferredFormat !== '24h'
      });
      const fmtDate = dateFormatter.format(apptDate);
      const fmtTime = fmtTimeFormatter.format(apptDate);
      
      const confirmMsg = aiLanguage.startsWith("he") 
        ? `תור אושר ל-${businessName}. קוד אישור: ${confirmationCode}. ${fmtDate} בשעה ${fmtTime}`
        : `Appointment confirmed at ${businessName}. Confirmation: ${confirmationCode}. ${fmtDate} at ${fmtTime}`;
      
      try {
        await sendSMS(businessPhone, callerPhone, confirmMsg);
        console.log("Confirmation SMS sent");
      } catch (smsErr) {
        console.error("Failed to send confirmation SMS:", smsErr);
      }
    }
    
    return { 
      success: true, 
      confirmation_code: confirmationCode,
      scheduled_at: scheduled_date,
      message: `Appointment scheduled successfully. Confirmation code: ${confirmationCode}`
    };
  },

  // Send SMS
  async send_confirmation_sms(args, ctx) {
    const { message } = args;
    const { callerPhone, businessPhone } = ctx;
    
    if (!callerPhone || !businessPhone) {
      return { success: false, error: "Phone numbers not available" };
    }
    
    try {
      const smsResult = await sendSMS(businessPhone, callerPhone, message);
      console.log("SMS sent:", smsResult.sid);
      return { success: true, message_sid: smsResult.sid };
    } catch (smsErr) {
      console.error("Failed to send SMS:", smsErr);
      return { success: false, error: String(smsErr) };
    }
  },

  // Take message
  async take_message(args, ctx) {
    const { caller_name, message, callback_requested, urgency } = args;
    const { businessId, contactId } = ctx;
    
    if (!businessId) {
      return { success: false, error: "Business ID not available" };
    }
    
    // Create an inquiry record
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .insert({
        business_id: businessId,
        contact_id: contactId,
        summary: message,
        priority: urgency || "medium",
        status: callback_requested ? "pending" : "new"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating inquiry:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Message recorded:", inquiry.id);
    
    // Update contact name if provided
    if (caller_name && contactId) {
      await supabase
        .from("contacts")
        .update({ name: caller_name, updated_at: new Date().toISOString() })
        .eq("id", contactId);
    }
    
    return { success: true, inquiry_id: inquiry.id, message: "Your message has been recorded. Someone will get back to you soon." };
  },

  // Update contact info
  async update_contact_info(args, ctx) {
    const { name, email, notes, tags } = args;
    const { contactId } = ctx;
    
    if (!contactId) {
      return { success: false, error: "No contact ID available" };
    }
    
    const updateData: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    
    const { error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", contactId);
    
    if (error) {
      console.error("Error updating contact:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at') };
  },

  // Check business hours
  async check_business_hours(args, ctx) {
    const { day_of_week } = args;
    const { businessHours, timezone } = ctx;
    
    const dayMap: Record<string, string> = {
      "monday": "mon", "tuesday": "tue", "wednesday": "wed",
      "thursday": "thu", "friday": "fri", "saturday": "sat", "sunday": "sun"
    };
    
    // Get current time in business timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const currentDay = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || '';
    const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const checkDay = day_of_week === "today" || !day_of_week ? currentDay : day_of_week;
    const dayKey = dayMap[checkDay] || checkDay.substring(0, 3).toLowerCase();
    const hours = businessHours[dayKey];
    
    let isOpen = false;
    let statusMessage = "";
    let hoursInfo: any = { day: checkDay };
    
    if (!hours || !hours.start || !hours.end) {
      statusMessage = `The business is closed on ${checkDay}`;
      hoursInfo.closed = true;
    } else {
      hoursInfo.opens = hours.start;
      hoursInfo.closes = hours.end;
      
      if (day_of_week === "today" || !day_of_week) {
        if (currentTime >= hours.start && currentTime < hours.end) {
          isOpen = true;
          statusMessage = `We are currently open. We close at ${hours.end}`;
        } else if (currentTime < hours.start) {
          statusMessage = `We are currently closed. We open at ${hours.start} today`;
        } else {
          statusMessage = `We are currently closed for today. We were open from ${hours.start} to ${hours.end}`;
        }
        hoursInfo.is_currently_open = isOpen;
        hoursInfo.current_time = currentTime;
      } else {
        statusMessage = `On ${checkDay}, we are open from ${hours.start} to ${hours.end}`;
      }
    }
    
    // Include all days for reference
    const allHours: Record<string, string> = {};
    const fullDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    fullDays.forEach(day => {
      const key = dayMap[day];
      const h = businessHours[key];
      if (h && h.start && h.end) {
        allHours[day] = `${h.start} - ${h.end}`;
      } else {
        allHours[day] = "Closed";
      }
    });
    hoursInfo.all_hours = allHours;
    
    return { success: true, ...hoursInfo, message: statusMessage };
  },

  // Reschedule appointment
  async reschedule_appointment(args, ctx) {
    const { new_date, reason } = args;
    const { contactId, timezone, aiLanguage, callerPhone, businessPhone, settings } = ctx;
    
    if (!contactId) {
      return { success: false, error: "No contact found for this caller" };
    }
    
    // Find the caller's upcoming appointment
    const { data: upcomingAppts, error: fetchError } = await supabase
      .from("appointments")
      .select("id, scheduled_at, service_type, confirmation_code")
      .eq("contact_id", contactId)
      .gte("scheduled_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(1);
    
    if (fetchError || !upcomingAppts || upcomingAppts.length === 0) {
      return { success: false, error: "No upcoming appointment found to reschedule" };
    }
    
    const appointment = upcomingAppts[0];
    const preferredFormat = settings?.timeFormat || '12h';
    
    const formatApptDateTime = (dateStr: string): string => {
      const d = new Date(dateStr);
      const dateFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
        timeZone: timezone,
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
        timeZone: timezone,
        hour: preferredFormat === '24h' ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: preferredFormat !== '24h'
      });
      return `${dateFormatter.format(d)} at ${timeFormatter.format(d)}`;
    };
    
    const oldDate = formatApptDateTime(appointment.scheduled_at);
    const newDateFormatted = formatApptDateTime(new_date);
    
    const updateData: any = {
      scheduled_at: new_date,
      status: "rescheduled",
      updated_at: new Date().toISOString()
    };
    if (reason) {
      updateData.notes = `Rescheduled: ${reason}`;
    }
    
    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointment.id);
    
    if (updateError) {
      console.error("Error rescheduling appointment:", updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log("Appointment rescheduled:", appointment.id);
    
    // Send SMS confirmation
    if (callerPhone && businessPhone) {
      const confirmMsg = aiLanguage.startsWith("he") 
        ? `התור שלך נדחה ל-${newDateFormatted}. קוד אישור: ${appointment.confirmation_code}`
        : `Your appointment has been rescheduled to ${newDateFormatted}. Confirmation: ${appointment.confirmation_code}`;
      
      try {
        await sendSMS(businessPhone, callerPhone, confirmMsg);
      } catch (smsErr) {
        console.error("Failed to send reschedule SMS:", smsErr);
      }
    }
    
    return { 
      success: true, 
      old_date: oldDate,
      new_date: newDateFormatted,
      confirmation_code: appointment.confirmation_code,
      message: `Appointment rescheduled from ${oldDate} to ${newDateFormatted}`
    };
  },

  // Cancel appointment
  async cancel_appointment(args, ctx) {
    const { reason } = args;
    const { contactId, callerPhone, businessPhone, aiLanguage } = ctx;
    
    if (!contactId) {
      return { success: false, error: "No contact found for this caller" };
    }
    
    // Find the caller's upcoming appointment
    const { data: upcomingAppts, error: fetchError } = await supabase
      .from("appointments")
      .select("id, scheduled_at, service_type, confirmation_code")
      .eq("contact_id", contactId)
      .gte("scheduled_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(1);
    
    if (fetchError || !upcomingAppts || upcomingAppts.length === 0) {
      return { success: false, error: "No upcoming appointment found to cancel" };
    }
    
    const appointment = upcomingAppts[0];
    const apptDate = new Date(appointment.scheduled_at).toLocaleString();
    
    const updateData: any = {
      status: "cancelled",
      updated_at: new Date().toISOString()
    };
    if (reason) {
      updateData.notes = `Cancelled: ${reason}`;
    }
    
    const { error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointment.id);
    
    if (updateError) {
      console.error("Error cancelling appointment:", updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log("Appointment cancelled:", appointment.id);
    
    // Send SMS confirmation
    if (callerPhone && businessPhone) {
      const confirmMsg = aiLanguage.startsWith("he") 
        ? `התור שלך ל-${apptDate} בוטל. נשמח לראותך בפעם הבאה!`
        : `Your appointment for ${apptDate} has been cancelled. We hope to see you again!`;
      
      try {
        await sendSMS(businessPhone, callerPhone, confirmMsg);
      } catch (smsErr) {
        console.error("Failed to send cancellation SMS:", smsErr);
      }
    }
    
    return { 
      success: true, 
      cancelled_date: apptDate,
      confirmation_code: appointment.confirmation_code,
      message: `Appointment for ${apptDate} has been cancelled`
    };
  },

  // Confirm appointment
  async confirm_appointment(args, ctx) {
    const { contactId, timezone, aiLanguage, callerPhone, businessPhone, settings } = ctx;
    
    if (!contactId) {
      return { success: false, error: "No contact found for this caller" };
    }
    
    // Find the caller's upcoming appointment
    const { data: upcomingAppts, error: fetchError } = await supabase
      .from("appointments")
      .select("id, scheduled_at, service_type, confirmation_code, status")
      .eq("contact_id", contactId)
      .gte("scheduled_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(1);
    
    if (fetchError || !upcomingAppts || upcomingAppts.length === 0) {
      return { success: false, error: "No upcoming appointment found to confirm" };
    }
    
    const appointment = upcomingAppts[0];
    const preferredFormat = settings?.timeFormat || '12h';
    
    const apptDateTime = new Date(appointment.scheduled_at);
    const dateFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
      timeZone: timezone,
      hour: preferredFormat === '24h' ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: preferredFormat !== '24h'
    });
    const formattedDate = dateFormatter.format(apptDateTime);
    const formattedTime = timeFormatter.format(apptDateTime);
    
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ 
        status: "confirmed",
        updated_at: new Date().toISOString()
      })
      .eq("id", appointment.id);
    
    if (updateError) {
      console.error("Error confirming appointment:", updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log("Appointment confirmed:", appointment.id);
    
    // Send SMS confirmation
    if (callerPhone && businessPhone) {
      const confirmMsg = aiLanguage.startsWith("he") 
        ? `התור שלך אושר! ${formattedDate} בשעה ${formattedTime}. קוד אישור: ${appointment.confirmation_code}`
        : `Appointment confirmed! ${formattedDate} at ${formattedTime}. Confirmation: ${appointment.confirmation_code}`;
      
      try {
        await sendSMS(businessPhone, callerPhone, confirmMsg);
      } catch (smsErr) {
        console.error("Failed to send confirmation SMS:", smsErr);
      }
    }
    
    return { 
      success: true, 
      date: formattedDate,
      time: formattedTime,
      service_type: appointment.service_type,
      confirmation_code: appointment.confirmation_code,
      message: `Your appointment on ${formattedDate} at ${formattedTime} is confirmed. Confirmation code: ${appointment.confirmation_code}`
    };
  },

  // Check available slots
  async check_available_slots(args, ctx) {
    const { date, service_duration = 30 } = args;
    const { businessId, businessHours, timezone, aiLanguage, settings } = ctx;
    
    // Parse the date
    let targetDate: Date;
    const now = new Date();
    
    if (date === "today") {
      targetDate = now;
    } else if (date === "tomorrow") {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      targetDate = new Date(date);
    }
    
    // Get the day of week for the target date
    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' });
    const dayName = dayFormatter.format(targetDate).toLowerCase();
    
    const dayMap: Record<string, string> = {
      "monday": "mon", "tuesday": "tue", "wednesday": "wed",
      "thursday": "thu", "friday": "fri", "saturday": "sat", "sunday": "sun"
    };
    const dayKey = dayMap[dayName];
    const hours = businessHours[dayKey];
    
    if (!hours || !hours.start || !hours.end) {
      return { 
        success: false, 
        closed: true,
        day: dayName,
        message: `We are closed on ${dayName}. Please try another day.`
      };
    }
    
    // Build date boundaries in business timezone
    const tzOffset = getTimezoneOffset(timezone);
    const getTzDateStr = (d: Date): string => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const da = parts.find(p => p.type === 'day')?.value;
      return `${y}-${m}-${da}`;
    };

    const dateStr = getTzDateStr(targetDate);
    const startOfDay = `${dateStr}T00:00:00${tzOffset}`;
    const endOfDay = `${dateStr}T23:59:59${tzOffset}`;

    // Fetch existing appointments
    const { data: existingAppts, error: fetchError } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("business_id", businessId)
      .gte("scheduled_at", startOfDay)
      .lte("scheduled_at", endOfDay)
      .neq("status", "cancelled");

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      return { success: false, error: "Could not check availability" };
    }

    // Parse business hours
    const [openHour, openMin] = hours.start.split(':').map(Number);
    const [closeHour, closeMin] = hours.end.split(':').map(Number);

    // Mark booked time slots
    const bookedSlots: Set<number> = new Set();
    for (const appt of existingAppts || []) {
      const apptTime = new Date(appt.scheduled_at);
      const apptDuration = appt.duration_minutes || 30;
      for (let offsetMin = 0; offsetMin < apptDuration; offsetMin += 30) {
        bookedSlots.add(apptTime.getTime() + offsetMin * 60_000);
      }
    }

    // Formatters
    const timeFormatter24 = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const timeFormatter12 = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const hourInTz = (ms: number): number => {
      const h = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', hour12: false }).format(new Date(ms));
      return parseInt(h, 10);
    };

    // Construct open/close instants
    let currentSlotMs = new Date(`${dateStr}T${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}:00${tzOffset}`).getTime();
    const closeTimeMs = new Date(`${dateStr}T${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}:00${tzOffset}`).getTime();

    // If checking today, start from now
    if (date === "today") {
      const nowParts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);
      const nowH = parseInt(nowParts.find(p => p.type === 'hour')?.value || '0', 10);
      const nowM = parseInt(nowParts.find(p => p.type === 'minute')?.value || '0', 10);

      let roundedH = nowH;
      let roundedM = nowM < 30 ? 30 : 0;
      if (nowM >= 30) roundedH += 1;

      const roundedMs = new Date(`${dateStr}T${String(roundedH).padStart(2, '0')}:${String(roundedM).padStart(2, '0')}:00${tzOffset}`).getTime();
      if (roundedMs > currentSlotMs) currentSlotMs = roundedMs;
    }

    // Generate available slots
    const availableSlots: Array<{ time: string; display_24h: string; display_12h: string }> = [];
    const stepMs = 30 * 60_000;
    const serviceMs = service_duration * 60_000;

    for (let slotMs = currentSlotMs; slotMs < closeTimeMs; slotMs += stepMs) {
      const slotEndMs = slotMs + serviceMs;
      if (slotEndMs > closeTimeMs) break;

      let isAvailable = true;
      for (let offsetMs = 0; offsetMs < serviceMs; offsetMs += stepMs) {
        const checkMs = slotMs + offsetMs;
        if (checkMs >= closeTimeMs || bookedSlots.has(checkMs)) {
          isAvailable = false;
          break;
        }
      }

      if (isAvailable) {
        const slotDate = new Date(slotMs);
        availableSlots.push({
          time: slotDate.toISOString(),
          display_24h: timeFormatter24.format(slotDate),
          display_12h: timeFormatter12.format(slotDate),
        });
      }
    }

    // Format date for display
    const displayDateFormatter = new Intl.DateTimeFormat(aiLanguage.startsWith('he') ? 'he-IL' : 'en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const displayDate = displayDateFormatter.format(new Date(`${dateStr}T12:00:00${tzOffset}`));

    if (availableSlots.length === 0) {
      return {
        success: true,
        fully_booked: true,
        date: displayDate,
        message: `We are fully booked on ${displayDate}. Would you like to check another day?`,
      };
    }

    // Group by time-of-day
    const preferredFormat = settings?.timeFormat || '12h';
    const morning = availableSlots.filter(s => hourInTz(Date.parse(s.time)) < 12);
    const afternoon = availableSlots.filter(s => {
      const h = hourInTz(Date.parse(s.time));
      return h >= 12 && h < 17;
    });
    const evening = availableSlots.filter(s => hourInTz(Date.parse(s.time)) >= 17);

    const getDisplay = (s: { display_24h: string; display_12h: string }) => 
      preferredFormat === '24h' ? s.display_24h : s.display_12h;

    const summary: string[] = [];
    if (morning.length > 0) summary.push(`${morning.length} morning slots (${getDisplay(morning[0])} - ${getDisplay(morning[morning.length - 1])})`);
    if (afternoon.length > 0) summary.push(`${afternoon.length} afternoon slots (${getDisplay(afternoon[0])} - ${getDisplay(afternoon[afternoon.length - 1])})`);
    if (evening.length > 0) summary.push(`${evening.length} evening slots (${getDisplay(evening[0])} - ${getDisplay(evening[evening.length - 1])})`);

    // Log availability quote
    const quotedSlots = availableSlots.map(getDisplay);
    if (businessId && quotedSlots.length > 0) {
      try {
        await supabase
          .from("ai_availability_logs")
          .insert({
            business_id: businessId,
            requested_date: dateStr,
            quoted_slots: quotedSlots,
            slot_count: quotedSlots.length,
            time_format: preferredFormat,
          });
      } catch (logErr) {
        console.error("Exception logging availability:", logErr);
      }
    }

    return {
      success: true,
      date: displayDate,
      total_available: availableSlots.length,
      morning_slots: morning.map(getDisplay),
      afternoon_slots: afternoon.map(getDisplay),
      evening_slots: evening.map(getDisplay),
      summary: summary.join(', '),
      message: `On ${displayDate}, we have ${availableSlots.length} available slots: ${summary.join(', ')}. Would you like to book one of these times?`,
    };
  },

  // Get services info
  async get_services_info(args, ctx) {
    const { service_name } = args;
    const { services, knowledgeBase } = ctx;
    
    const pricingInfo = knowledgeBase.pricing || knowledgeBase.prices || null;
    const serviceDetails = knowledgeBase.services || knowledgeBase.serviceDetails || null;
    
    if (service_name) {
      const searchName = service_name.toLowerCase();
      const matchedService = services.find((s: string) => 
        s.toLowerCase().includes(searchName) || searchName.includes(s.toLowerCase())
      );
      
      if (matchedService) {
        let details = null;
        let price = null;
        
        if (serviceDetails && typeof serviceDetails === 'object') {
          details = serviceDetails[matchedService] || serviceDetails[searchName] || null;
        }
        
        if (pricingInfo && typeof pricingInfo === 'object') {
          price = pricingInfo[matchedService] || pricingInfo[searchName] || null;
        }
        
        return {
          success: true,
          service: matchedService,
          details: details,
          price: price,
          message: price 
            ? `${matchedService} is available at ${price}. ${details || ''}`
            : `${matchedService} is available. ${details || 'For specific pricing, please speak with a team member.'}`
        };
      } else {
        return {
          success: false,
          available_services: services,
          message: `I couldn't find a service matching "${service_name}". Our available services are: ${services.join(', ')}.`
        };
      }
    } else {
      if (services.length === 0) {
        return {
          success: true,
          services: [],
          message: "Service information is not currently configured. Please speak with a team member for details on our offerings."
        };
      } else {
        const serviceList = services.map((service: string) => {
          let price = null;
          if (pricingInfo && typeof pricingInfo === 'object') {
            price = pricingInfo[service] || null;
          }
          return price ? `${service} (${price})` : service;
        });
        
        return {
          success: true,
          services: services,
          pricing: pricingInfo,
          message: `We offer the following services: ${serviceList.join(', ')}. Would you like more details about any specific service?`
        };
      }
    }
  },
};

serve(async (req) => {
  const requestId = `req_${Date.now().toString(36)}`;
  console.log(`[${requestId}] ========== AGENT WEBHOOK START ==========`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  console.log(`[${requestId}] Headers:`, JSON.stringify(Object.fromEntries(req.headers.entries())));

  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log(`[${requestId}] Raw body (first 2000 chars):`, rawBody.substring(0, 2000));
    
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error(`[${requestId}] JSON parse error:`, parseErr);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON body",
        request_id: requestId,
        raw_preview: rawBody.substring(0, 500)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`[${requestId}] Parsed body keys:`, Object.keys(body));
    console.log(`[${requestId}] Full parsed body:`, JSON.stringify(body, null, 2));
    
    // ElevenLabs sends tool calls - dynamic_variables contains business_id and caller_phone
    const { tool_name, parameters, dynamic_variables } = body;
    
    console.log(`[${requestId}] Extracted fields:`);
    console.log(`[${requestId}]   tool_name: ${tool_name}`);
    console.log(`[${requestId}]   parameters:`, JSON.stringify(parameters));
    console.log(`[${requestId}]   dynamic_variables:`, JSON.stringify(dynamic_variables));
    console.log(`[${requestId}]   body.business_id: ${body.business_id}`);
    console.log(`[${requestId}]   body.caller_phone: ${body.caller_phone}`);
    
    // Extract business_id and caller_phone from either top level or dynamic_variables
    const business_id = body.business_id || dynamic_variables?.business_id;
    const caller_phone = body.caller_phone || dynamic_variables?.caller_phone;
    
    console.log(`[${requestId}] Resolved: business_id=${business_id}, caller_phone=${caller_phone}`);
    
    if (!tool_name) {
      console.error(`[${requestId}] Missing tool_name`);
      return new Response(JSON.stringify({ 
        error: "Missing tool_name",
        request_id: requestId,
        received_keys: Object.keys(body),
        hint: "Expected { tool_name, business_id, caller_phone, parameters }"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!business_id) {
      console.error(`[${requestId}] Missing business_id`);
      return new Response(JSON.stringify({ 
        error: "Missing business_id",
        request_id: requestId,
        received_keys: Object.keys(body),
        dynamic_variables_keys: dynamic_variables ? Object.keys(dynamic_variables) : null
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Load business context
    console.log(`[${requestId}] Loading business context for: ${business_id}`);
    const businessContext = await loadBusinessContext(business_id);
    console.log(`[${requestId}] Business loaded: ${businessContext.businessName}`);
    
    // Get or create contact
    let contact = null;
    if (caller_phone) {
      console.log(`[${requestId}] Getting/creating contact for: ${caller_phone}`);
      contact = await getOrCreateContact(business_id, caller_phone);
      console.log(`[${requestId}] Contact ID: ${contact?.id}`);
    } else {
      console.log(`[${requestId}] No caller_phone provided, skipping contact lookup`);
    }
    
    // Build context object for tool handlers
    const ctx = {
      businessId: business_id,
      callerPhone: caller_phone,
      contactId: contact?.id || null,
      ...businessContext,
    };
    
    // Get the handler
    const handler = toolHandlers[tool_name];
    if (!handler) {
      console.error(`[${requestId}] Unknown tool: ${tool_name}`);
      return new Response(JSON.stringify({ 
        error: `Unknown tool: ${tool_name}`,
        request_id: requestId,
        available_tools: Object.keys(toolHandlers)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Execute the tool
    console.log(`[${requestId}] Executing tool: ${tool_name}`);
    console.log(`[${requestId}] Tool parameters:`, JSON.stringify(parameters, null, 2));
    
    const startTime = Date.now();
    const result = await handler(parameters || {}, ctx);
    const duration = Date.now() - startTime;
    
    console.log(`[${requestId}] Tool ${tool_name} completed in ${duration}ms`);
    console.log(`[${requestId}] Tool result:`, JSON.stringify(result, null, 2));
    console.log(`[${requestId}] ========== AGENT WEBHOOK END ==========`);
    
    return new Response(JSON.stringify({ ...result, request_id: requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (e) {
    console.error(`[${requestId}] ========== AGENT WEBHOOK ERROR ==========`);
    console.error(`[${requestId}] Error type:`, e?.constructor?.name);
    console.error(`[${requestId}] Error message:`, e instanceof Error ? e.message : String(e));
    console.error(`[${requestId}] Error stack:`, e instanceof Error ? e.stack : "N/A");
    
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      request_id: requestId,
      error_type: e?.constructor?.name
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
