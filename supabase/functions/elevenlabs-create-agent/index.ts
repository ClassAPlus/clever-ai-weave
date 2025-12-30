import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Webhook URL for agent tools
const WEBHOOK_BASE_URL = `${SUPABASE_URL}/functions/v1/agent-webhook`;

// Language code mapping
const LANGUAGE_MAP: Record<string, string> = {
  hebrew: "he",
  english: "en",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  arabic: "ar",
  chinese: "zh",
  japanese: "ja",
  korean: "ko",
  dutch: "nl",
  polish: "pl",
  turkish: "tr",
  hindi: "hi",
  thai: "th",
  vietnamese: "vi",
};

// Voice ID recommendations per language
const VOICE_RECOMMENDATIONS: Record<string, { male: string; female: string }> = {
  he: { male: "onwK4e9ZLuTAKqWW03F9", female: "cgSgspJ2msm6clMCkdW9" }, // Daniel, Jessica
  en: { male: "JBFqnCBsd6RMkjVDRZzb", female: "EXAVITQu4vr4xnSDxMaL" }, // George, Sarah
  es: { male: "TX3LPaxmHKxFdv7VOQHJ", female: "XrExE9yKIg1WjnnlVkGX" }, // Liam, Matilda
  fr: { male: "nPczCjzI2devNBz1zQrb", female: "FGY2WhTYpPnrIDTdsKH5" }, // Brian, Laura
  de: { male: "cjVigY5qzO86Huf0OWal", female: "SAz9YHcvj6GT2YYXdXww" }, // Eric, River
  default: { male: "onwK4e9ZLuTAKqWW03F9", female: "cgSgspJ2msm6clMCkdW9" },
};

function buildSystemPrompt(business: any): string {
  const lang = business.ai_language || "english";
  const isHebrew = lang === "hebrew";
  const twilioSettings = business.twilio_settings || {};
  const voiceGender = twilioSettings.elevenLabsVoiceGender || twilioSettings.voiceGender || "female";
  const timeFormat = twilioSettings.timeFormat || "12h";
  const businessHours = business.business_hours || {};
  const services = business.services || [];
  const knowledgeBase = business.knowledge_base || {};
  
  // Format business hours for the prompt
  const hoursText = Object.entries(businessHours)
    .filter(([_, h]: [string, any]) => h?.start && h?.end)
    .map(([day, h]: [string, any]) => `${day}: ${h.start}-${h.end}`)
    .join(", ");
  
  // Format services
  const servicesText = services.length > 0 ? services.join(", ") : "General services";
  
  // Format FAQs from knowledge base
  const faqText = (knowledgeBase.faqs || [])
    .map((faq: any) => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join("\n\n");
  
  return `You are a friendly and professional AI receptionist for ${business.name}.
Your DEFAULT language is ${isHebrew ? "Hebrew (עברית)" : lang}.
Be concise but warm. Help callers with their questions, take messages, and schedule appointments.

=== BUSINESS INFORMATION ===
Business Name: ${business.name}
Timezone: ${business.timezone || "UTC"}
Business Hours: ${hoursText || "Please ask the caller to leave a message"}
Services: ${servicesText}

=== LANGUAGE SWITCHING ===
- If the caller speaks a different language, automatically switch to match them.
- Supported languages: Hebrew, English, Arabic, Spanish, French, German, Russian, and more.

=== ${isHebrew ? "HEBREW GENDER-AWARE SPEECH" : "SPEECH STYLE"} ===
${isHebrew 
  ? `You are speaking as a ${voiceGender} receptionist. Use appropriate gendered verb forms in Hebrew.
- Female: "אני שמחה לעזור לך" (I am happy-fem to help)
- Male: "אני שמח לעזור לך" (I am happy-masc to help)`
  : `You are speaking as a ${voiceGender} receptionist. Be professional and helpful.`}

=== APPOINTMENT BOOKING ===
CRITICAL: NEVER book an appointment without EXPLICIT verbal consent.
Before calling create_appointment:
1. Use check_available_slots to find available times
2. Verify the time is within business hours
3. Summarize the appointment details clearly
4. Ask: "Would you like me to confirm this appointment?"
5. Wait for clear YES before booking

=== TIME FORMAT ===
Speak times in ${timeFormat === "24h" ? "24-hour" : "12-hour AM/PM"} format.

=== GUIDELINES ===
- Keep responses brief (1-2 sentences when possible)
- Be polite and professional
- If you don't know something, offer to take a message
- Collect caller's name early in the conversation
- Always confirm details before taking action

${faqText ? `=== FREQUENTLY ASKED QUESTIONS ===\n${faqText}` : ""}

${knowledgeBase.policies ? `=== POLICIES ===\n${knowledgeBase.policies}` : ""}

${knowledgeBase.pricing ? `=== PRICING INFO ===\n${knowledgeBase.pricing}` : ""}

${business.ai_instructions ? `=== ADDITIONAL INSTRUCTIONS ===\n${business.ai_instructions}` : ""}`;
}

function buildFirstMessage(business: any): string {
  const lang = business.ai_language || "english";
  const greetings = business.greeting_messages || {};
  
  // Check for custom greeting
  if (greetings.phone_greeting) {
    return greetings.phone_greeting;
  }
  
  if (lang === "hebrew") {
    return `שלום! תודה שהתקשרת ל-${business.name}. איך אוכל לעזור לך?`;
  }
  
  return `Hello! Thank you for calling ${business.name}. How can I help you today?`;
}

function buildServerTools(businessId: string): any[] {
  const tools = [
    {
      type: "webhook",
      name: "create_appointment",
      description: "Schedule a new appointment for the caller. MUST verify time is within business hours and get caller consent first.",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: {
          "Content-Type": "application/json"
        },
        request_body_template: JSON.stringify({
          tool_name: "create_appointment",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            scheduled_date: "{{scheduled_date}}",
            service_type: "{{service_type}}",
            caller_name: "{{caller_name}}",
            notes: "{{notes}}"
          }
        }),
        response_timeout_secs: 20
      },
      parameters: {
        type: "object",
        properties: {
          scheduled_date: { type: "string", description: "ISO 8601 date/time with timezone (e.g., 2025-01-15T14:00:00+02:00)" },
          service_type: { type: "string", description: "Type of service requested" },
          caller_name: { type: "string", description: "Caller's name" },
          notes: { type: "string", description: "Additional notes" }
        },
        required: ["scheduled_date"]
      }
    },
    {
      type: "webhook",
      name: "check_available_slots",
      description: "Check available appointment slots for a specific date. Use this before booking.",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "check_available_slots",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            date: "{{date}}",
            service_duration: "{{service_duration}}"
          }
        }),
        response_timeout_secs: 15
      },
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date to check: 'today', 'tomorrow', or ISO date" },
          service_duration: { type: "number", description: "Duration in minutes (default 30)" }
        },
        required: ["date"]
      }
    },
    {
      type: "webhook",
      name: "check_business_hours",
      description: "Check if the business is open and get operating hours",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "check_business_hours",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            day_of_week: "{{day_of_week}}"
          }
        }),
        response_timeout_secs: 10
      },
      parameters: {
        type: "object",
        properties: {
          day_of_week: { 
            type: "string", 
            enum: ["today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            description: "The day to check hours for" 
          }
        }
      }
    },
    {
      type: "webhook",
      name: "take_message",
      description: "Record a message from the caller for the business owner",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "take_message",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            caller_name: "{{caller_name}}",
            message: "{{message}}",
            callback_requested: "{{callback_requested}}",
            urgency: "{{urgency}}"
          }
        }),
        response_timeout_secs: 15
      },
      parameters: {
        type: "object",
        properties: {
          caller_name: { type: "string", description: "Caller's name" },
          message: { type: "string", description: "The message content" },
          callback_requested: { type: "boolean", description: "Whether callback is requested" },
          urgency: { type: "string", enum: ["low", "medium", "high"], description: "Message urgency" }
        },
        required: ["message"]
      }
    },
    {
      type: "webhook",
      name: "send_confirmation_sms",
      description: "Send an SMS to the caller with confirmation or information",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "send_confirmation_sms",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            message: "{{message}}"
          }
        }),
        response_timeout_secs: 15
      },
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "SMS message to send" }
        },
        required: ["message"]
      }
    },
    {
      type: "webhook",
      name: "update_contact_info",
      description: "Update the caller's contact information",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "update_contact_info",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            name: "{{name}}",
            email: "{{email}}",
            notes: "{{notes}}"
          }
        }),
        response_timeout_secs: 10
      },
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Caller's name" },
          email: { type: "string", description: "Email address" },
          notes: { type: "string", description: "Notes about the caller" }
        }
      }
    },
    {
      type: "webhook",
      name: "reschedule_appointment",
      description: "Reschedule the caller's upcoming appointment to a new date/time",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "reschedule_appointment",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            new_date: "{{new_date}}",
            reason: "{{reason}}"
          }
        }),
        response_timeout_secs: 20
      },
      parameters: {
        type: "object",
        properties: {
          new_date: { type: "string", description: "New date/time in ISO 8601 format with timezone" },
          reason: { type: "string", description: "Reason for rescheduling" }
        },
        required: ["new_date"]
      }
    },
    {
      type: "webhook",
      name: "cancel_appointment",
      description: "Cancel the caller's upcoming appointment",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "cancel_appointment",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            reason: "{{reason}}"
          }
        }),
        response_timeout_secs: 15
      },
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for cancellation" }
        }
      }
    },
    {
      type: "webhook",
      name: "confirm_appointment",
      description: "Confirm the caller's upcoming appointment",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "confirm_appointment",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {}
        }),
        response_timeout_secs: 15
      },
      parameters: {
        type: "object",
        properties: {}
      }
    },
    {
      type: "webhook",
      name: "get_services_info",
      description: "Get information about services offered by the business",
      webhook: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        request_headers: { "Content-Type": "application/json" },
        request_body_template: JSON.stringify({
          tool_name: "get_services_info",
          business_id: businessId,
          caller_phone: "{{caller_phone}}",
          parameters: {
            service_name: "{{service_name}}"
          }
        }),
        response_timeout_secs: 10
      },
      parameters: {
        type: "object",
        properties: {
          service_name: { type: "string", description: "Specific service to get info about (optional)" }
        }
      }
    }
  ];

  // Add system tools
  tools.push(
    { type: "system", name: "end_call", description: "End the call when the conversation is complete" } as any,
    { type: "system", name: "language_detection", description: "Detect the caller's language and switch accordingly" } as any
  );

  return tools;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const { business_id, voice_id, update_existing } = await req.json();

    if (!business_id) {
      throw new Error("business_id is required");
    }

    // Fetch business data
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (bizError || !business) {
      throw new Error(`Business not found: ${business_id}`);
    }

    const twilioSettings = (business.twilio_settings as any) || {};
    const lang = business.ai_language || "english";
    const langCode = LANGUAGE_MAP[lang] || "en";
    const voiceGender = twilioSettings.elevenLabsVoiceGender || twilioSettings.voiceGender || "female";

    // Determine voice ID
    let selectedVoiceId = voice_id || twilioSettings.elevenLabsVoiceId;
    if (!selectedVoiceId) {
      const voiceRecs = VOICE_RECOMMENDATIONS[langCode] || VOICE_RECOMMENDATIONS.default;
      selectedVoiceId = voiceGender === "male" ? voiceRecs.male : voiceRecs.female;
    }

    // Build agent configuration
    const agentConfig = {
      name: `${business.name} AI Receptionist`,
      conversation_config: {
        agent: {
          prompt: {
            prompt: buildSystemPrompt(business),
            tools: buildServerTools(business_id)
          },
          first_message: buildFirstMessage(business),
          language: langCode
        },
        tts: {
          voice_id: selectedVoiceId,
          model_id: "eleven_turbo_v2_5", // Best for real-time conversations
          optimize_streaming_latency: 3
        },
        stt: {
          model: "nova-2-conversationalai" // Best quality STT
        }
      },
      platform_settings: {
        auth: {
          enable_auth: false // Public agent - uses Twilio connection
        },
        evaluation: {
          criteria: []
        }
      }
    };

    // Check if agent already exists for this business
    const existingAgentId = twilioSettings.elevenLabsAgentId;
    let agentId: string;
    let action: "created" | "updated";

    if (existingAgentId && update_existing) {
      // Update existing agent
      console.log(`Updating existing agent: ${existingAgentId}`);
      
      const updateResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/agents/${existingAgentId}`,
        {
          method: "PATCH",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(agentConfig)
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("ElevenLabs update error:", updateResponse.status, errorText);
        throw new Error(`Failed to update agent: ${updateResponse.status} - ${errorText}`);
      }

      agentId = existingAgentId;
      action = "updated";
    } else {
      // Create new agent
      console.log("Creating new ElevenLabs agent for:", business.name);
      
      const createResponse = await fetch(
        "https://api.elevenlabs.io/v1/convai/agents/create",
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(agentConfig)
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("ElevenLabs create error:", createResponse.status, errorText);
        throw new Error(`Failed to create agent: ${createResponse.status} - ${errorText}`);
      }

      const createResult = await createResponse.json();
      agentId = createResult.agent_id;
      action = "created";

      console.log("Agent created with ID:", agentId);
    }

    // Update business with the new agent ID
    const newTwilioSettings = {
      ...twilioSettings,
      elevenLabsAgentId: agentId,
      enableAiReceptionist: true,
      elevenLabsVoiceId: selectedVoiceId
    };

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        twilio_settings: newTwilioSettings,
        updated_at: new Date().toISOString()
      })
      .eq("id", business_id);

    if (updateError) {
      console.error("Error updating business:", updateError);
      // Don't fail - agent was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        agent_id: agentId,
        business_id: business_id,
        business_name: business.name,
        voice_id: selectedVoiceId,
        language: langCode,
        message: `ElevenLabs agent ${action} successfully for ${business.name}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("elevenlabs-create-agent error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
