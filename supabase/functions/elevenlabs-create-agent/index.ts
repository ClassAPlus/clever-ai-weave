import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

// Bump this when changing payload shape so we can verify deployments via error responses/logs
const FUNCTION_VERSION = "2025-12-30T06:40Z-webhook-tool-v3";

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

type WebhookParam = {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  enum?: string[];
};

type ToolDef = {
  name: string;
  description: string;
  timeoutSecs: number;
  params: Record<string, WebhookParam>;
  required: string[];
};

const BUILT_IN_TOOLS = ["end_call", "language_detection"] as const;

const TOOL_DEFS: ToolDef[] = [
  {
    name: "create_appointment",
    description:
      "Schedule a new appointment for the caller. MUST verify time is within business hours and get caller consent first.",
    timeoutSecs: 20,
    params: {
      scheduled_date: {
        type: "string",
        description:
          "ISO 8601 date/time with timezone (e.g., 2025-01-15T14:00:00+02:00)",
      },
      service_type: { type: "string", description: "Type of service requested" },
      caller_name: { type: "string", description: "Caller's name" },
      notes: { type: "string", description: "Additional notes" },
    },
    required: ["scheduled_date"],
  },
  {
    name: "check_available_slots",
    description:
      "Check available appointment slots for a specific date. Use this before booking.",
    timeoutSecs: 15,
    params: {
      date: { type: "string", description: "Date to check: 'today', 'tomorrow', or ISO date" },
      service_duration: { type: "number", description: "Duration in minutes (default 30)" },
    },
    required: ["date"],
  },
  {
    name: "check_business_hours",
    description: "Check if the business is open and get operating hours",
    timeoutSecs: 10,
    params: {
      day_of_week: {
        type: "string",
        enum: ["today", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        description: "The day to check hours for",
      },
    },
    required: [],
  },
  {
    name: "take_message",
    description: "Record a message from the caller for the business owner",
    timeoutSecs: 15,
    params: {
      caller_name: { type: "string", description: "Caller's name" },
      message: { type: "string", description: "The message content" },
      callback_requested: { type: "boolean", description: "Whether callback is requested" },
      urgency: { type: "string", enum: ["low", "medium", "high"], description: "Message urgency" },
    },
    required: ["message"],
  },
  {
    name: "send_confirmation_sms",
    description: "Send an SMS to the caller with confirmation or information",
    timeoutSecs: 15,
    params: {
      message: { type: "string", description: "SMS message to send" },
    },
    required: ["message"],
  },
  {
    name: "update_contact_info",
    description: "Update the caller's contact information",
    timeoutSecs: 10,
    params: {
      name: { type: "string", description: "Caller's name" },
      email: { type: "string", description: "Email address" },
      notes: { type: "string", description: "Notes about the caller" },
    },
    required: [],
  },
  {
    name: "reschedule_appointment",
    description: "Reschedule the caller's upcoming appointment to a new date/time",
    timeoutSecs: 20,
    params: {
      new_date: { type: "string", description: "New date/time in ISO 8601 format with timezone" },
      reason: { type: "string", description: "Reason for rescheduling" },
    },
    required: ["new_date"],
  },
  {
    name: "cancel_appointment",
    description: "Cancel the caller's upcoming appointment",
    timeoutSecs: 15,
    params: {
      reason: { type: "string", description: "Reason for cancellation" },
    },
    required: [],
  },
  {
    name: "confirm_appointment",
    description: "Confirm the caller's upcoming appointment",
    timeoutSecs: 15,
    params: {},
    required: [],
  },
  {
    name: "get_services_info",
    description: "Get information about services offered by the business",
    timeoutSecs: 10,
    params: {
      service_name: { type: "string", description: "Specific service to get info about (optional)" },
    },
    required: [],
  },
];

function buildWebhookToolConfig(args: {
  tool: ToolDef;
  businessId: string;
}) {
  const { tool, businessId } = args;

  // ElevenLabs tool API expects "properties" to be a dictionary (not an array)
  const paramProperties: Record<string, any> = {};
  for (const [key, schema] of Object.entries(tool.params)) {
    const prop: any = {
      type: schema.type,
      description: schema.description || "",
    };
    if (schema.enum) prop.enum = schema.enum;
    paramProperties[key] = prop;
  }

  const requestBodySchema = {
    type: "object",
    description: `Request payload for ${tool.name}`,
    required: ["tool_name", "business_id", "parameters"],
    properties: {
      tool_name: {
        type: "string",
        description: "The tool to execute",
        const: tool.name,
      },
      business_id: {
        type: "string",
        description: "Business ID",
        const: businessId,
      },
      caller_phone: {
        type: "string",
        description: "Caller phone number (provided by telephony integration)",
      },
      parameters: {
        type: "object",
        description: "Tool parameters",
        required: tool.required,
        properties: paramProperties,
      },
    },
  };

  // NOTE: ElevenLabs validates these as dictionaries and (currently) requires a non-empty properties map.
  // We include a harmless optional __unused param to satisfy their validator.
  const emptySchemaWithOneOptional = {
    properties: {
      __unused: {
        type: "string",
        description: "Internal (unused)",
      },
    },
  };

  return {
    type: "webhook",
    name: tool.name,
    description: tool.description,
    webhook: {
      api_schema: {
        url: WEBHOOK_BASE_URL,
        method: "POST",
        path_params_schema: emptySchemaWithOneOptional,
        query_params_schema: emptySchemaWithOneOptional,
        request_body_schema: requestBodySchema,
        request_headers: {
          "Content-Type": "application/json",
        },
      },
    },
    response_timeout_secs: tool.timeoutSecs,
    assignments: [],
    disable_interruptions: false,
    force_pre_tool_speech: false,
    tool_call_sound: null,
    tool_call_sound_behavior: "auto",
    execution_mode: "immediate",
  };
}

async function ensureBusinessTools(args: {
  businessId: string;
  twilioSettings: Record<string, any>;
}): Promise<{ toolIds: string[]; toolIdMap: Record<string, string> }> {
  const { businessId, twilioSettings } = args;

  const existingMap = (twilioSettings.elevenLabsToolIds || {}) as Record<string, string>;
  const toolIdMap: Record<string, string> = { ...existingMap };

  for (const tool of TOOL_DEFS) {
    if (toolIdMap[tool.name]) continue;

    console.log(`Creating ElevenLabs tool: ${tool.name}`);

    const toolConfig = buildWebhookToolConfig({ tool, businessId });

    if (tool.name === "create_appointment") {
      console.log(
        "Tool create payload version:",
        FUNCTION_VERSION,
        JSON.stringify({ tool_config: toolConfig })
      );
    }

    const resp = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tool_config: toolConfig }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("ElevenLabs tool create error:", resp.status, errorText);
      throw new Error(`Failed to create tool '${tool.name}': ${resp.status} - ${errorText}`);
    }

    const data = await resp.json();
    const id = data?.id as string | undefined;
    if (!id) {
      throw new Error(`Tool '${tool.name}' created but no id returned`);
    }

    toolIdMap[tool.name] = id;
  }

  const toolIds = TOOL_DEFS.map((t) => toolIdMap[t.name]).filter(Boolean);

  return { toolIds, toolIdMap };
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

    // Ensure server tools exist in ElevenLabs (new tools API) and collect their IDs
    const { toolIds, toolIdMap } = await ensureBusinessTools({
      businessId: business_id,
      twilioSettings,
    });

    // Build agent configuration (new format: prompt.tool_ids + prompt.built_in_tools)
    const agentConfig = {
      name: `${business.name} AI Receptionist`,
      conversation_config: {
        agent: {
          prompt: {
            prompt: buildSystemPrompt(business),
            tool_ids: toolIds,
            built_in_tools: [...BUILT_IN_TOOLS],
          },
          first_message: buildFirstMessage(business),
          language: langCode,
        },
        tts: {
          voice_id: selectedVoiceId,
          model_id: "eleven_turbo_v2_5", // Best for real-time conversations
          optimize_streaming_latency: 3,
        },
        stt: {
          model: "nova-2-conversationalai", // Best quality STT
        },
      },
      platform_settings: {
        auth: {
          enable_auth: false, // Public agent - uses Twilio connection
        },
        evaluation: {
          criteria: [],
        },
      },
    } as const;

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
        version: FUNCTION_VERSION,
        action,
        agent_id: agentId,
        business_id: business_id,
        business_name: business.name,
        voice_id: selectedVoiceId,
        language: langCode,
        message: `ElevenLabs agent ${action} successfully for ${business.name}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("elevenlabs-create-agent error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        version: FUNCTION_VERSION,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
