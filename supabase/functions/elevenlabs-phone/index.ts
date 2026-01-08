import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ElevenLabs Phone Handler
 * 
 * Bridges Twilio calls with ElevenLabs Conversational AI using the "register call" approach.
 * This allows full programmatic control with per-tenant dynamic configuration overrides.
 * 
 * Flow:
 * 1. Receives redirect from voice-incoming with business context
 * 2. Loads business-specific AI configuration (greeting, persona, language, tools)
 * 3. Calls ElevenLabs register_call API with conversation_initiation_client_data overrides
 * 4. Returns TwiML from ElevenLabs to Twilio to establish WebSocket connection
 */

interface ElevenLabsSettings {
  agentId?: string;
  voiceId?: string;
  enableTools?: boolean;
  customPromptOverride?: string;
  firstMessageOverride?: string;
  language?: string;
}

interface BusinessSettings {
  id: string;
  name: string;
  ai_instructions?: string;
  ai_language?: string;
  ai_personality?: {
    tone?: string;
    style?: string;
    formality?: string;
  };
  greeting_messages?: {
    default?: string;
    afterHours?: string;
    holiday?: string;
  };
  services?: string[];
  business_hours?: Record<string, { open: string; close: string }>;
  timezone?: string;
  twilio_settings?: {
    elevenlabs?: ElevenLabsSettings;
    voiceLanguage?: string;
    [key: string]: unknown;
  };
  knowledge_base?: {
    faqs?: Array<{ question: string; answer: string }>;
    policies?: Record<string, string>;
  };
}

// Build the system prompt dynamically based on business configuration
function buildSystemPrompt(business: BusinessSettings): string {
  const parts: string[] = [];
  
  // Base identity
  parts.push(`You are ${business.name}'s AI phone receptionist.`);
  
  // Add custom instructions if provided
  if (business.ai_instructions) {
    parts.push(business.ai_instructions);
  }
  
  // Add personality traits
  if (business.ai_personality) {
    const { tone, style, formality } = business.ai_personality;
    if (tone) parts.push(`Speak with a ${tone} tone.`);
    if (style) parts.push(`Your communication style is ${style}.`);
    if (formality) parts.push(`Maintain a ${formality} level of formality.`);
  }
  
  // Add services context
  if (business.services && business.services.length > 0) {
    parts.push(`Services offered: ${business.services.join(', ')}.`);
  }
  
  // Add business hours context
  if (business.business_hours && business.timezone) {
    parts.push(`Business timezone: ${business.timezone}.`);
    // Could add current hours based on day of week
  }
  
  // Add FAQ knowledge
  if (business.knowledge_base?.faqs && business.knowledge_base.faqs.length > 0) {
    parts.push('\nFrequently Asked Questions:');
    for (const faq of business.knowledge_base.faqs.slice(0, 10)) {
      parts.push(`Q: ${faq.question}\nA: ${faq.answer}`);
    }
  }
  
  // Add policies
  if (business.knowledge_base?.policies) {
    const policies = Object.entries(business.knowledge_base.policies);
    if (policies.length > 0) {
      parts.push('\nBusiness Policies:');
      for (const [name, content] of policies.slice(0, 5)) {
        parts.push(`${name}: ${content}`);
      }
    }
  }
  
  // Core instructions for phone calls
  parts.push(`
Core phone receptionist guidelines:
- Be concise and natural in conversation - this is a phone call
- Listen actively and confirm understanding before taking action
- You can help with: booking appointments, answering questions, taking messages
- If you cannot help, offer to take a message for a callback
- Always be polite and professional`);
  
  return parts.join('\n\n');
}

// Get the first greeting message based on business config
function getFirstMessage(business: BusinessSettings): string {
  // Check for custom override in ElevenLabs settings
  const elevenlabsSettings = business.twilio_settings?.elevenlabs;
  if (elevenlabsSettings?.firstMessageOverride) {
    return elevenlabsSettings.firstMessageOverride;
  }
  
  // Use greeting messages from business config
  if (business.greeting_messages?.default) {
    return business.greeting_messages.default;
  }
  
  // Fallback based on language
  const lang = business.ai_language || business.twilio_settings?.voiceLanguage || 'en-US';
  if (lang.startsWith('he')) {
    return `שלום, הגעתם ל${business.name}. איך אוכל לעזור לכם היום?`;
  }
  
  return `Hello, thank you for calling ${business.name}. How can I help you today?`;
}

// Map language codes to ElevenLabs supported language codes
function mapToElevenLabsLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    'he-IL': 'he',
    'en-US': 'en',
    'en-GB': 'en',
    'ar-XA': 'ar',
    'ru-RU': 'ru',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'pt-BR': 'pt',
    'pt-PT': 'pt',
    'zh-CN': 'zh',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'it-IT': 'it',
    'nl-NL': 'nl',
    'pl-PL': 'pl',
    'tr-TR': 'tr',
    'hi-IN': 'hi',
  };
  return langMap[lang] || lang.split('-')[0] || 'en';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  if (!ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY not configured");
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice AI is not configured. Please try again later.</Say><Hangup/></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }

  try {
    // Parse Twilio form data or query params
    let businessId: string | null = null;
    let callerPhone: string | null = null;
    let calledNumber: string | null = null;
    let callSid: string | null = null;

    const url = new URL(req.url);
    
    // Check query params first (from redirect)
    businessId = url.searchParams.get('business_id');
    callerPhone = url.searchParams.get('caller_phone');
    callSid = url.searchParams.get('call_sid');

    // Also parse form data if present
    if (req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('form')) {
          const formData = await req.formData();
          callerPhone = callerPhone || formData.get('From')?.toString() || null;
          calledNumber = formData.get('Called')?.toString() || formData.get('To')?.toString() || null;
          callSid = callSid || formData.get('CallSid')?.toString() || null;
        }
      } catch (e) {
        console.log("Could not parse form data:", e);
      }
    }

    console.log("ElevenLabs phone handler - businessId:", businessId, "caller:", callerPhone, "callSid:", callSid);

    if (!businessId) {
      console.error("Missing business_id parameter");
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Configuration error. Goodbye.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch business configuration
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", businessId, bizError);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>This service is not configured. Goodbye.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    const bizSettings = business as BusinessSettings;
    const elevenlabsConfig = bizSettings.twilio_settings?.elevenlabs;
    
    // Get agent ID - must be configured
    const agentId = elevenlabsConfig?.agentId;
    if (!agentId) {
      console.error("ElevenLabs agent ID not configured for business:", businessId);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice AI agent is not configured. Please contact support.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // Build dynamic configuration overrides
    const systemPrompt = elevenlabsConfig?.customPromptOverride || buildSystemPrompt(bizSettings);
    const firstMessage = getFirstMessage(bizSettings);
    const language = mapToElevenLabsLanguage(
      elevenlabsConfig?.language || 
      bizSettings.ai_language || 
      bizSettings.twilio_settings?.voiceLanguage || 
      'en-US'
    );

    // Prepare conversation_initiation_client_data for register call
    const conversationInitData: Record<string, unknown> = {
      // Dynamic variables that can be used in the agent's prompts
      dynamic_variables: {
        business_name: bizSettings.name,
        business_id: businessId,
        caller_phone: callerPhone || 'unknown',
        call_sid: callSid || 'unknown',
        current_time: new Date().toISOString(),
        timezone: bizSettings.timezone || 'UTC',
      },
      // Override agent configuration dynamically per tenant
      overrides: {
        agent: {
          prompt: {
            prompt: systemPrompt
          },
          first_message: firstMessage,
          language: language,
        }
      }
    };

    // Add voice override if specified
    if (elevenlabsConfig?.voiceId) {
      (conversationInitData.overrides as Record<string, unknown>).tts = {
        voice_id: elevenlabsConfig.voiceId
      };
    }

    console.log("Registering call with ElevenLabs - agentId:", agentId, "language:", language);
    console.log("First message:", firstMessage.substring(0, 100));

    // Call ElevenLabs register_call API
    const registerResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/twilio/register_call',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          from_number: callerPhone || '+10000000000',
          to_number: calledNumber || business.twilio_phone_number || '+10000000000',
          direction: 'inbound',
          conversation_initiation_client_data: conversationInitData,
        }),
      }
    );

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error("ElevenLabs register_call failed:", registerResponse.status, errorText);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unable to connect to voice AI. Please try again later.</Say><Hangup/></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      );
    }

    // ElevenLabs returns TwiML directly
    const twiml = await registerResponse.text();
    console.log("Received TwiML from ElevenLabs:", twiml.substring(0, 200));

    // Update call record with ElevenLabs session info
    if (callSid) {
      await supabase
        .from('calls')
        .update({
          call_status: 'elevenlabs_connected',
          was_answered: true,
          call_summary: {
            ai_provider: 'elevenlabs',
            agent_id: agentId,
            language: language,
          }
        })
        .eq('twilio_call_sid', callSid);
    }

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error("Error in elevenlabs-phone:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please try again later.</Say><Hangup/></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
    );
  }
});
