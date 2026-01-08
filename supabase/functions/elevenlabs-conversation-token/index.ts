import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * ElevenLabs Conversation Token Generator
 * 
 * Generates signed conversation tokens for WebRTC-based ElevenLabs conversations.
 * Used for web-based voice agents (not phone calls).
 * 
 * Supports per-tenant configuration overrides for multi-tenant deployments.
 */

interface ElevenLabsSettings {
  agentId?: string;
  voiceId?: string;
  enableTools?: boolean;
  customPromptOverride?: string;
  firstMessageOverride?: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  if (!ELEVENLABS_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { businessId, overrides } = await req.json();

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let agentId: string | undefined;
    let conversationOverrides: Record<string, unknown> | undefined;

    // If businessId provided, load tenant configuration
    if (businessId) {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('name, ai_instructions, ai_language, ai_personality, greeting_messages, services, twilio_settings')
        .eq('id', businessId)
        .single();

      if (error || !business) {
        return new Response(
          JSON.stringify({ error: 'Business not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const elevenlabsConfig = (business.twilio_settings as Record<string, unknown>)?.elevenlabs as ElevenLabsSettings | undefined;
      agentId = elevenlabsConfig?.agentId;

      if (!agentId) {
        return new Response(
          JSON.stringify({ error: 'ElevenLabs agent not configured for this business' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build overrides from business config
      const greeting = elevenlabsConfig?.firstMessageOverride || 
        (business.greeting_messages as Record<string, string>)?.default ||
        `Hello, welcome to ${business.name}. How can I help you?`;

      const language = elevenlabsConfig?.language || 
        business.ai_language || 
        ((business.twilio_settings as Record<string, unknown>)?.voiceLanguage as string) || 
        'en';

      conversationOverrides = {
        agent: {
          prompt: {
            prompt: elevenlabsConfig?.customPromptOverride || business.ai_instructions || `You are ${business.name}'s helpful AI assistant.`
          },
          first_message: greeting,
          language: language.split('-')[0], // ElevenLabs uses short codes
        }
      };

      if (elevenlabsConfig?.voiceId) {
        conversationOverrides.tts = {
          voice_id: elevenlabsConfig.voiceId
        };
      }
    } else if (overrides?.agentId) {
      // Direct agent ID provided
      agentId = overrides.agentId;
      conversationOverrides = overrides.conversationOverrides;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either businessId or overrides.agentId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation token from ElevenLabs
    const tokenUrl = new URL('https://api.elevenlabs.io/v1/convai/conversation/token');
    tokenUrl.searchParams.set('agent_id', agentId);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get conversation token:", tokenResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get conversation token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token } = await tokenResponse.json();

    return new Response(
      JSON.stringify({ 
        token,
        agentId,
        overrides: conversationOverrides 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in elevenlabs-conversation-token:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
