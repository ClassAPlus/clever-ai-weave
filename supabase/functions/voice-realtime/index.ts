import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const LOG_EVENT_TYPES = [
  "response.content.done",
  "rate_limits.updated", 
  "response.done",
  "input_audio_buffer.committed",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.speech_started",
  "session.created",
  "response.function_call_arguments.done",
  "error"
];

// Tools for the AI to use
const TOOLS = [
  {
    type: "function",
    name: "create_appointment",
    description: "Schedule a new appointment for the caller. Use this when the caller wants to book an appointment.",
    parameters: {
      type: "object",
      properties: {
        scheduled_date: {
          type: "string",
          description: "The date and time for the appointment in ISO 8601 format (e.g., 2025-09-25T12:00:00)"
        },
        service_type: {
          type: "string",
          description: "The type of service or reason for the appointment"
        },
        caller_name: {
          type: "string",
          description: "The name of the caller"
        },
        notes: {
          type: "string",
          description: "Any additional notes about the appointment"
        }
      },
      required: ["scheduled_date"]
    }
  },
  {
    type: "function",
    name: "send_confirmation_sms",
    description: "Send an SMS confirmation to the caller. Use this when the caller asks for a confirmation message or after booking an appointment.",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to send to the caller"
        }
      },
      required: ["message"]
    }
  },
  {
    type: "function",
    name: "take_message",
    description: "Record a message from the caller to pass along to the business owner.",
    parameters: {
      type: "object",
      properties: {
        caller_name: {
          type: "string",
          description: "The name of the caller"
        },
        message: {
          type: "string",
          description: "The message the caller wants to leave"
        },
        callback_requested: {
          type: "boolean",
          description: "Whether the caller requested a callback"
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "The urgency level of the message"
        }
      },
      required: ["message"]
    }
  },
  {
    type: "function",
    name: "update_contact_info",
    description: "Update the caller's contact information. Use this whenever the caller provides their name, email, or any notes about themselves. ALWAYS call this function when you learn the caller's name or email.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The caller's full name"
        },
        email: {
          type: "string",
          description: "The caller's email address"
        },
        notes: {
          type: "string",
          description: "Any relevant notes about this caller (preferences, special requests, etc.)"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags to categorize this caller (e.g., 'vip', 'new customer', 'returning')"
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "check_business_hours",
    description: "Check if the business is currently open or closed, and get the business hours. Use this when the caller asks about business hours, opening times, or if the business is open.",
    parameters: {
      type: "object",
      properties: {
        day_of_week: {
          type: "string",
          enum: ["today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          description: "The day to check hours for. Use 'today' to check current status."
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "reschedule_appointment",
    description: "Reschedule an existing appointment to a new date/time. Use this when the caller wants to change their appointment time. First check their upcoming appointments to find the one to reschedule.",
    parameters: {
      type: "object",
      properties: {
        new_date: {
          type: "string",
          description: "The new date and time for the appointment in ISO 8601 format (e.g., 2025-09-25T12:00:00)"
        },
        reason: {
          type: "string",
          description: "Optional reason for rescheduling"
        }
      },
      required: ["new_date"]
    }
  },
  {
    type: "function",
    name: "cancel_appointment",
    description: "Cancel an existing appointment. Use this when the caller wants to cancel their appointment. Confirm the cancellation before proceeding.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Optional reason for cancellation"
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "get_services_info",
    description: "Get information about available services and pricing. Use this when the caller asks about what services are offered, how much something costs, pricing, rates, or wants to know what the business does.",
    parameters: {
      type: "object",
      properties: {
        service_name: {
          type: "string",
          description: "Optional: specific service to get details about. If not provided, returns all available services."
        }
      },
      required: []
    }
  }
];

// Contact history context for AI
interface CallerContext {
  name: string | null;
  email: string | null;
  notes: string | null;
  tags: string[] | null;
  appointments: Array<{ scheduled_at: string; service_type: string | null; status: string | null }>;
  recentConversations: Array<{ created_at: string; last_message: string }>;
  callHistory: Array<{ created_at: string; was_answered: boolean; duration_seconds: number | null }>;
}

// System prompt for the AI receptionist
const getSystemPrompt = (businessName: string, instructions: string, language: string, callerContext: CallerContext) => {
  const langMap: Record<string, string> = {
    "he-IL": "Hebrew",
    "en-US": "English",
    "en-GB": "British English",
    "ar-XA": "Arabic",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "de-DE": "German",
    "ru-RU": "Russian",
  };
  
  const languageName = langMap[language] || "English";
  
  // Build context about the caller
  let callerInfo = "";
  
  if (callerContext.name) {
    callerInfo += `The caller's name is ${callerContext.name}. Use their name naturally in conversation.\n`;
  }
  
  if (callerContext.email) {
    callerInfo += `Their email is ${callerContext.email}.\n`;
  }
  
  if (callerContext.notes) {
    callerInfo += `Notes about this caller: ${callerContext.notes}\n`;
  }
  
  if (callerContext.tags && callerContext.tags.length > 0) {
    callerInfo += `Tags: ${callerContext.tags.join(", ")}\n`;
  }
  
  // Appointment history
  if (callerContext.appointments.length > 0) {
    const upcoming = callerContext.appointments.filter(a => new Date(a.scheduled_at) > new Date() && a.status !== 'cancelled');
    const past = callerContext.appointments.filter(a => new Date(a.scheduled_at) <= new Date() || a.status === 'completed');
    
    if (upcoming.length > 0) {
      const nextAppt = upcoming[0];
      const apptDate = new Date(nextAppt.scheduled_at).toLocaleString(language.startsWith('he') ? 'he-IL' : 'en-US');
      callerInfo += `They have an upcoming appointment on ${apptDate} for ${nextAppt.service_type || 'a service'}.\n`;
    }
    
    if (past.length > 0) {
      callerInfo += `They have had ${past.length} previous appointment(s) with us.\n`;
    }
  }
  
  // Conversation history
  if (callerContext.recentConversations.length > 0) {
    const lastConvo = callerContext.recentConversations[0];
    const convoDate = new Date(lastConvo.created_at).toLocaleDateString(language.startsWith('he') ? 'he-IL' : 'en-US');
    callerInfo += `Last SMS conversation was on ${convoDate}. Last message: "${lastConvo.last_message.substring(0, 100)}${lastConvo.last_message.length > 100 ? '...' : ''}"\n`;
  }
  
  // Call history
  if (callerContext.callHistory.length > 0) {
    const totalCalls = callerContext.callHistory.length;
    const answeredCalls = callerContext.callHistory.filter(c => c.was_answered).length;
    callerInfo += `They have called us ${totalCalls} time(s) before (${answeredCalls} answered).\n`;
  }
  
  const isReturningCaller = callerContext.name || callerContext.callHistory.length > 0 || callerContext.appointments.length > 0;
  
  return `You are a friendly and professional AI receptionist for ${businessName}. 
Speak in ${languageName}.
Be concise but warm. Help callers with their questions, take messages, and schedule appointments.

${callerInfo ? `=== CALLER CONTEXT (Use this to personalize the conversation) ===\n${callerInfo}${isReturningCaller ? 'This is a returning caller - acknowledge their history warmly.\n' : ''}===\n\n` : ''}

${instructions || "Answer questions helpfully and take messages when the caller wants to leave one."}

CRITICAL: COLLECTING CALLER INFORMATION
- If you don't know the caller's name, ask for it naturally early in the conversation (e.g., "May I have your name please?")
- When the caller tells you their name, IMMEDIATELY use the update_contact_info function to save it
- If the caller provides their email, IMMEDIATELY use update_contact_info to save it
- Any time you learn new information about the caller (name, email, preferences), use update_contact_info
- This information helps us provide personalized service on future calls

Important guidelines:
- Keep responses brief (1-2 sentences when possible)
- If they have an upcoming appointment, proactively mention it if relevant
- If they're a returning caller, reference their history naturally (don't read out all details)
- If you don't know something specific about the business, offer to take a message
- Be polite and professional at all times
- If the caller wants to speak to a human, let them know you'll pass along their message
- When scheduling appointments, ALWAYS use the create_appointment function to actually book it
- When the caller asks for a confirmation SMS, ALWAYS use the send_confirmation_sms function to send it
- When taking a message, ALWAYS use the take_message function to record it
- After using a function, confirm to the caller that the action was completed
- ALWAYS collect and save caller's name and email when provided using update_contact_info`;
};

// Function to send SMS via Twilio
async function sendSMS(from: string, to: string, body: string): Promise<{ sid: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }
  
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

serve(async (req) => {
  const url = new URL(req.url);
  
  // Get business ID from query params
  const businessId = url.searchParams.get("businessId");
  const callSid = url.searchParams.get("callSid");
  
  console.log(`Voice realtime connection request: businessId=${businessId}, callSid=${callSid}`);
  console.log(`Request method: ${req.method}`);
  console.log(`Upgrade header: ${req.headers.get("upgrade")}`);
  console.log(`Connection header: ${req.headers.get("connection")}`);
  console.log(`OPENAI_API_KEY exists: ${!!OPENAI_API_KEY}`);
  
  // Fetch business settings and caller info
  let businessName = "our business";
  let instructions = "";
  let voiceLanguage = "en-US";
  let voice = "alloy";
  let businessPhone = "";
  let callerPhone = "";
  let contactId: string | null = null;
  let callerContext: CallerContext = {
    name: null,
    email: null,
    notes: null,
    tags: null,
    appointments: [],
    recentConversations: [],
    callHistory: []
  };
  
  if (businessId) {
    try {
      const { data: business } = await supabase
        .from("businesses")
        .select("name, ai_instructions, twilio_settings, twilio_phone_number, business_hours, timezone, services, knowledge_base")
        .eq("id", businessId)
        .single();
      
      if (business) {
        businessName = business.name || "our business";
        instructions = business.ai_instructions || "";
        businessPhone = business.twilio_phone_number || "";
        const settings = business.twilio_settings as any;
        voiceLanguage = settings?.voiceLanguage || "en-US";
        const gender = settings?.voiceGender || "female";
        voice = gender === "male" ? "ash" : "alloy";
        // Store business hours for the check_business_hours tool
        (globalThis as any).__businessHours = business.business_hours;
        (globalThis as any).__businessTimezone = business.timezone || "UTC";
        // Store services and knowledge base for the get_services_info tool
        (globalThis as any).__businessServices = business.services || [];
        (globalThis as any).__knowledgeBase = business.knowledge_base || {};
        console.log(`Loaded business: ${businessName}, language: ${voiceLanguage}, voice: ${voice}, services: ${(business.services || []).length}`);
      }
      
      // Get caller phone and contact info from the call record
      if (callSid) {
        const { data: callRecord } = await supabase
          .from("calls")
          .select("caller_phone, contact_id, contacts(name, email, notes, tags)")
          .eq("twilio_call_sid", callSid)
          .single();
        
        if (callRecord) {
          callerPhone = callRecord.caller_phone;
          contactId = callRecord.contact_id;
          
          // Get contact details
          const contactData = callRecord.contacts as any;
          if (contactData) {
            callerContext.name = contactData.name;
            callerContext.email = contactData.email;
            callerContext.notes = contactData.notes;
            callerContext.tags = contactData.tags;
            console.log(`Known contact: ${callerContext.name || 'Unknown'}, email: ${callerContext.email || 'none'}`);
          }
          console.log(`Caller phone: ${callerPhone}, contact ID: ${contactId}`);
          
          // Fetch appointments for this contact
          if (contactId) {
            const { data: appointments } = await supabase
              .from("appointments")
              .select("scheduled_at, service_type, status")
              .eq("contact_id", contactId)
              .order("scheduled_at", { ascending: false })
              .limit(5);
            
            if (appointments) {
              callerContext.appointments = appointments;
              console.log(`Found ${appointments.length} appointments for contact`);
            }
            
            // Fetch recent conversations with last message
            const { data: conversations } = await supabase
              .from("conversations")
              .select("id, created_at, messages(content, created_at, direction)")
              .eq("contact_id", contactId)
              .order("created_at", { ascending: false })
              .limit(3);
            
            if (conversations) {
              callerContext.recentConversations = conversations.map((conv: any) => {
                const messages = conv.messages || [];
                const lastMsg = messages.sort((a: any, b: any) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];
                return {
                  created_at: conv.created_at,
                  last_message: lastMsg?.content || ""
                };
              }).filter((c: any) => c.last_message);
              console.log(`Found ${callerContext.recentConversations.length} recent conversations`);
            }
            
            // Fetch call history
            const { data: callHistory } = await supabase
              .from("calls")
              .select("created_at, was_answered, duration_seconds")
              .eq("contact_id", contactId)
              .neq("twilio_call_sid", callSid) // Exclude current call
              .order("created_at", { ascending: false })
              .limit(10);
            
            if (callHistory) {
              callerContext.callHistory = callHistory;
              console.log(`Found ${callHistory.length} previous calls`);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching business:", err);
    }
  }
  
  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    console.log("Not a WebSocket upgrade request, returning 426");
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }
  
  console.log("Upgrading to WebSocket...");
  
  // Upgrade to WebSocket
  const { socket: twilioWs, response } = Deno.upgradeWebSocket(req);
  
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let latestMediaTimestamp = 0;
  let lastAssistantItem: string | null = null;
  let responseStartTimestamp: number | null = null;
  const markQueue: string[] = [];
  
  // Handle function calls from the AI
  const handleFunctionCall = async (functionName: string, args: any, callId: string) => {
    console.log(`Handling function call: ${functionName}`, JSON.stringify(args));
    console.log(`Context: businessId=${businessId}, contactId=${contactId}, callerPhone=${callerPhone}, businessPhone=${businessPhone}`);
    let result = "";
    
    try {
      switch (functionName) {
        case "create_appointment": {
          const { scheduled_date, service_type, caller_name, notes } = args;
          
          if (!businessId) {
            console.error("Cannot create appointment: businessId is missing");
            result = JSON.stringify({ success: false, error: "Business ID not available" });
            break;
          }
          
          // Generate confirmation code
          const confirmationCode = `APT-${Date.now().toString(36).toUpperCase()}`;
          
          console.log(`Creating appointment: businessId=${businessId}, contactId=${contactId}, scheduled_date=${scheduled_date}`);
          
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
            console.error("Full error details:", JSON.stringify(error));
            result = JSON.stringify({ success: false, error: error.message });
          } else {
            console.log("Appointment created successfully:", JSON.stringify(appointment));
            result = JSON.stringify({ 
              success: true, 
              confirmation_code: confirmationCode,
              scheduled_at: scheduled_date 
            });
            
            // Automatically send confirmation SMS if we have the caller's phone
            if (callerPhone && businessPhone) {
              const confirmMsg = voiceLanguage.startsWith("he") 
                ? `תור אושר ל-${businessName}. קוד אישור: ${confirmationCode}. תאריך: ${new Date(scheduled_date).toLocaleString('he-IL')}`
                : `Appointment confirmed at ${businessName}. Confirmation: ${confirmationCode}. Date: ${new Date(scheduled_date).toLocaleString('en-US')}`;
              
              try {
                console.log(`Sending SMS from ${businessPhone} to ${callerPhone}`);
                await sendSMS(businessPhone, callerPhone, confirmMsg);
                console.log("Confirmation SMS sent automatically");
              } catch (smsErr) {
                console.error("Failed to send auto confirmation SMS:", smsErr);
              }
            } else {
              console.log(`Skipping SMS: callerPhone=${callerPhone}, businessPhone=${businessPhone}`);
            }
          }
          break;
        }
        
        case "send_confirmation_sms": {
          const { message } = args;
          
          if (!callerPhone || !businessPhone) {
            result = JSON.stringify({ success: false, error: "Phone numbers not available" });
          } else {
            try {
              const smsResult = await sendSMS(businessPhone, callerPhone, message);
              console.log("SMS sent:", smsResult.sid);
              result = JSON.stringify({ success: true, message_sid: smsResult.sid });
            } catch (smsErr) {
              console.error("Failed to send SMS:", smsErr);
              result = JSON.stringify({ success: false, error: String(smsErr) });
            }
          }
          break;
        }
        
        case "take_message": {
          const { caller_name, message, callback_requested, urgency } = args;
          
          if (!businessId) {
            console.error("Cannot take message: businessId is missing");
            result = JSON.stringify({ success: false, error: "Business ID not available" });
            break;
          }
          
          console.log(`Taking message: businessId=${businessId}, contactId=${contactId}, message=${message}`);
          
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
            console.error("Full error details:", JSON.stringify(error));
            result = JSON.stringify({ success: false, error: error.message });
          } else {
            console.log("Message recorded successfully:", JSON.stringify(inquiry));
            result = JSON.stringify({ success: true, inquiry_id: inquiry.id });
            
            // Update contact name if provided
            if (caller_name && contactId) {
              console.log(`Updating contact ${contactId} with name: ${caller_name}`);
              const { error: contactError } = await supabase
                .from("contacts")
                .update({ name: caller_name, updated_at: new Date().toISOString() })
                .eq("id", contactId);
              
              if (contactError) {
                console.error("Error updating contact name:", contactError);
              } else {
                console.log("Contact name updated successfully");
              }
            }
          }
          break;
        }
        
        case "update_contact_info": {
          const { name, email, notes, tags } = args;
          
          console.log(`Updating contact info: contactId=${contactId}, name=${name}, email=${email}`);
          
          if (!contactId) {
            console.error("Cannot update contact: contactId is missing");
            result = JSON.stringify({ success: false, error: "No contact ID available" });
          } else {
            // Build update object with only provided fields
            const updateData: any = { updated_at: new Date().toISOString() };
            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;
            if (notes !== undefined) updateData.notes = notes;
            if (tags !== undefined) updateData.tags = tags;
            
            console.log(`Update data:`, JSON.stringify(updateData));
            
            const { error } = await supabase
              .from("contacts")
              .update(updateData)
              .eq("id", contactId);
            
            if (error) {
              console.error("Error updating contact:", error);
              console.error("Full error details:", JSON.stringify(error));
              result = JSON.stringify({ success: false, error: error.message });
            } else {
              console.log("Contact updated successfully:", JSON.stringify(updateData));
              result = JSON.stringify({ success: true, updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at') });
            }
          }
          break;
        }
        
        case "check_business_hours": {
          const { day_of_week } = args;
          const businessHours = (globalThis as any).__businessHours || {};
          const timezone = (globalThis as any).__businessTimezone || "UTC";
          
          // Map day names
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
          
          // Determine which day to check
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
              // Check if currently open
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
          
          console.log("Business hours check:", hoursInfo);
          result = JSON.stringify({ success: true, ...hoursInfo, message: statusMessage });
          break;
        }
        
        case "reschedule_appointment": {
          const { new_date, reason } = args;
          
          if (!contactId) {
            result = JSON.stringify({ success: false, error: "No contact found for this caller" });
          } else {
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
              result = JSON.stringify({ success: false, error: "No upcoming appointment found to reschedule" });
            } else {
              const appointment = upcomingAppts[0];
              const oldDate = new Date(appointment.scheduled_at).toLocaleString();
              const newDateFormatted = new Date(new_date).toLocaleString();
              
              // Update the appointment
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
                result = JSON.stringify({ success: false, error: updateError.message });
              } else {
                console.log("Appointment rescheduled:", appointment.id);
                result = JSON.stringify({ 
                  success: true, 
                  old_date: oldDate,
                  new_date: newDateFormatted,
                  confirmation_code: appointment.confirmation_code,
                  service_type: appointment.service_type,
                  message: `Appointment rescheduled from ${oldDate} to ${newDateFormatted}`
                });
                
                // Send SMS confirmation if possible
                if (callerPhone && businessPhone) {
                  const confirmMsg = voiceLanguage.startsWith("he") 
                    ? `התור שלך נדחה ל-${newDateFormatted}. קוד אישור: ${appointment.confirmation_code}`
                    : `Your appointment has been rescheduled to ${newDateFormatted}. Confirmation: ${appointment.confirmation_code}`;
                  
                  try {
                    await sendSMS(businessPhone, callerPhone, confirmMsg);
                    console.log("Reschedule SMS sent");
                  } catch (smsErr) {
                    console.error("Failed to send reschedule SMS:", smsErr);
                  }
                }
              }
            }
          }
          break;
        }
        
        case "cancel_appointment": {
          const { reason } = args;
          
          if (!contactId) {
            result = JSON.stringify({ success: false, error: "No contact found for this caller" });
          } else {
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
              result = JSON.stringify({ success: false, error: "No upcoming appointment found to cancel" });
            } else {
              const appointment = upcomingAppts[0];
              const apptDate = new Date(appointment.scheduled_at).toLocaleString();
              
              // Cancel the appointment
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
                result = JSON.stringify({ success: false, error: updateError.message });
              } else {
                console.log("Appointment cancelled:", appointment.id);
                result = JSON.stringify({ 
                  success: true, 
                  cancelled_date: apptDate,
                  service_type: appointment.service_type,
                  confirmation_code: appointment.confirmation_code,
                  message: `Appointment for ${apptDate} has been cancelled`
                });
                
                // Send SMS confirmation if possible
                if (callerPhone && businessPhone) {
                  const confirmMsg = voiceLanguage.startsWith("he") 
                    ? `התור שלך ל-${apptDate} בוטל. נשמח לראותך בפעם הבאה!`
                    : `Your appointment for ${apptDate} has been cancelled. We hope to see you again!`;
                  
                  try {
                    await sendSMS(businessPhone, callerPhone, confirmMsg);
                    console.log("Cancellation SMS sent");
                  } catch (smsErr) {
                    console.error("Failed to send cancellation SMS:", smsErr);
                  }
                }
              }
            }
          }
          break;
        }
        
        case "get_services_info": {
          const { service_name } = args;
          const services: string[] = (globalThis as any).__businessServices || [];
          const knowledgeBase: any = (globalThis as any).__knowledgeBase || {};
          
          // Check if knowledge base has pricing or service details
          const pricingInfo = knowledgeBase.pricing || knowledgeBase.prices || null;
          const serviceDetails = knowledgeBase.services || knowledgeBase.serviceDetails || null;
          
          if (service_name) {
            // Looking for a specific service
            const searchName = service_name.toLowerCase();
            const matchedService = services.find((s: string) => 
              s.toLowerCase().includes(searchName) || searchName.includes(s.toLowerCase())
            );
            
            if (matchedService) {
              // Check if we have detailed info in knowledge base
              let details = null;
              let price = null;
              
              if (serviceDetails && typeof serviceDetails === 'object') {
                details = serviceDetails[matchedService] || serviceDetails[searchName] || null;
              }
              
              if (pricingInfo && typeof pricingInfo === 'object') {
                price = pricingInfo[matchedService] || pricingInfo[searchName] || null;
              }
              
              result = JSON.stringify({
                success: true,
                service: matchedService,
                details: details,
                price: price,
                message: price 
                  ? `${matchedService} is available at ${price}. ${details || ''}`
                  : `${matchedService} is available. ${details || 'For specific pricing, please speak with a team member.'}`
              });
            } else {
              result = JSON.stringify({
                success: false,
                available_services: services,
                message: `I couldn't find a service matching "${service_name}". Our available services are: ${services.join(', ')}.`
              });
            }
          } else {
            // Return all services
            if (services.length === 0) {
              result = JSON.stringify({
                success: true,
                services: [],
                message: "Service information is not currently configured. Please speak with a team member for details on our offerings."
              });
            } else {
              // Build comprehensive service list with any available pricing
              const serviceList = services.map((service: string) => {
                let price = null;
                if (pricingInfo && typeof pricingInfo === 'object') {
                  price = pricingInfo[service] || null;
                }
                return price ? `${service} (${price})` : service;
              });
              
              result = JSON.stringify({
                success: true,
                services: services,
                pricing: pricingInfo,
                service_details: serviceDetails,
                message: `We offer the following services: ${serviceList.join(', ')}. Would you like more details about any specific service?`
              });
            }
          }
          console.log("Services info:", result);
          break;
        }
        
        default:
          result = JSON.stringify({ success: false, error: "Unknown function" });
      }
    } catch (err) {
      console.error("Function call error:", err);
      result = JSON.stringify({ success: false, error: String(err) });
    }
    
    // Send function result back to OpenAI
    if (openaiWs?.readyState === WebSocket.OPEN) {
      const functionOutput = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: result
        }
      };
      openaiWs.send(JSON.stringify(functionOutput));
      console.log("Sent function output:", result);
      
      // Trigger response generation
      openaiWs.send(JSON.stringify({ type: "response.create" }));
    }
  };
  
  const sendSessionUpdate = () => {
    if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return;
    
    const sessionUpdate = {
      type: "session.update",
      session: {
        turn_detection: { type: "server_vad" },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        voice: voice,
        instructions: getSystemPrompt(businessName, instructions, voiceLanguage, callerContext),
        modalities: ["text", "audio"],
        temperature: 0.8,
        tools: TOOLS,
        tool_choice: "auto"
      }
    };
    console.log("Sending session update with tools");
    openaiWs.send(JSON.stringify(sessionUpdate));
  };
  
  const sendInitialGreeting = () => {
    if (!openaiWs || openaiWs.readyState !== WebSocket.OPEN) return;
    
    const greetingEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: "Greet the caller warmly and ask how you can help them today."
        }]
      }
    };
    openaiWs.send(JSON.stringify(greetingEvent));
    openaiWs.send(JSON.stringify({ type: "response.create" }));
    console.log("Sent initial greeting request");
  };
  
  const sendMark = () => {
    if (!twilioWs || twilioWs.readyState !== WebSocket.OPEN || !streamSid) return;
    
    const markEvent = {
      event: "mark",
      streamSid: streamSid,
      mark: { name: "responsePart" }
    };
    twilioWs.send(JSON.stringify(markEvent));
    markQueue.push("responsePart");
  };
  
  twilioWs.onopen = () => {
    console.log("Twilio WebSocket connected");
  };
  
  twilioWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      
      switch (msg.event) {
        case "connected":
          console.log("Twilio media stream connected");
          break;
          
        case "start":
          streamSid = msg.start.streamSid;
          console.log(`Stream started: ${streamSid}`);
          responseStartTimestamp = null;
          latestMediaTimestamp = 0;
          lastAssistantItem = null;
          
          console.log("Connecting to OpenAI with API key...");
          
          try {
            openaiWs = new WebSocket(
              "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
              ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
            );
            
            openaiWs.onopen = () => {
              console.log("OpenAI WebSocket opened via subprotocol auth");
            };
            
            openaiWs.onmessage = (openaiEvent) => {
              try {
                const data = JSON.parse(openaiEvent.data);
                
                if (LOG_EVENT_TYPES.includes(data.type)) {
                  console.log(`OpenAI event: ${data.type}`);
                }
                
                switch (data.type) {
                  case "session.created":
                    console.log("OpenAI session created!");
                    sendSessionUpdate();
                    setTimeout(sendInitialGreeting, 300);
                    break;
                    
                  case "response.audio.delta":
                    if (streamSid && data.delta && twilioWs.readyState === WebSocket.OPEN) {
                      twilioWs.send(JSON.stringify({
                        event: "media",
                        streamSid: streamSid,
                        media: { payload: data.delta }
                      }));
                      
                      if (responseStartTimestamp === null) {
                        responseStartTimestamp = latestMediaTimestamp;
                      }
                      if (data.item_id) {
                        lastAssistantItem = data.item_id;
                      }
                      sendMark();
                    }
                    break;
                    
                  case "response.audio_transcript.done":
                    console.log(`AI: ${data.transcript}`);
                    break;
                    
                  case "response.function_call_arguments.done":
                    console.log(`Function call: ${data.name}`, data.arguments);
                    try {
                      const args = JSON.parse(data.arguments);
                      handleFunctionCall(data.name, args, data.call_id);
                    } catch (parseErr) {
                      console.error("Failed to parse function arguments:", parseErr);
                    }
                    break;
                    
                  case "input_audio_buffer.speech_started":
                    if (markQueue.length > 0 && responseStartTimestamp !== null && lastAssistantItem) {
                      const elapsed = latestMediaTimestamp - responseStartTimestamp;
                      openaiWs?.send(JSON.stringify({
                        type: "conversation.item.truncate",
                        item_id: lastAssistantItem,
                        content_index: 0,
                        audio_end_ms: elapsed
                      }));
                      if (twilioWs.readyState === WebSocket.OPEN && streamSid) {
                        twilioWs.send(JSON.stringify({ event: "clear", streamSid }));
                      }
                      markQueue.length = 0;
                      lastAssistantItem = null;
                      responseStartTimestamp = null;
                    }
                    break;
                    
                  case "error":
                    console.error("OpenAI error:", JSON.stringify(data.error));
                    break;
                }
              } catch (err) {
                console.error("Error processing OpenAI message:", err);
              }
            };
            
            openaiWs.onerror = (err) => {
              console.error("OpenAI WebSocket error");
            };
            
            openaiWs.onclose = (e) => {
              console.log(`OpenAI closed: ${e.code}`);
            };
            
          } catch (err) {
            console.error("Failed to connect to OpenAI:", err);
          }
          break;
          
        case "media":
          latestMediaTimestamp = parseInt(msg.media.timestamp, 10);
          if (openaiWs?.readyState === WebSocket.OPEN) {
            openaiWs.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.media.payload
            }));
          }
          break;
          
        case "mark":
          if (markQueue.length > 0) {
            markQueue.shift();
          }
          break;
          
        case "stop":
          console.log("Stream stopped");
          if (openaiWs) {
            openaiWs.close();
          }
          break;
      }
    } catch (err) {
      console.error("Error processing Twilio message:", err);
    }
  };
  
  twilioWs.onerror = (err) => {
    console.error("Twilio WebSocket error");
    if (openaiWs) {
      openaiWs.close();
    }
  };
  
  twilioWs.onclose = () => {
    console.log("Twilio WebSocket closed");
    if (openaiWs) {
      openaiWs.close();
    }
  };
  
  return response;
});
