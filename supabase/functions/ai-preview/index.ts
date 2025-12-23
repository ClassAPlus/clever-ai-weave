import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      businessName,
      industryType,
      personality,
      knowledgeBase,
      customTools,
      sampleMessage,
      language = 'hebrew'
    } = await req.json();

    console.log("AI Preview request:", { businessName, sampleMessage, personality });

    // Build personality instructions
    const personalityInstructions = buildPersonalityInstructions(personality);
    const knowledgeContext = buildKnowledgeContext(knowledgeBase);

    const isHebrew = language === 'hebrew';

    const systemPrompt = `You are a helpful AI assistant for ${businessName || 'this business'}${industryType ? ` (${industryType} business)` : ''}.
${personalityInstructions}

${knowledgeContext}

IMPORTANT INSTRUCTIONS:
- This is a PREVIEW mode - generate a realistic response as you would to a real customer
- Respond in ${isHebrew ? 'Hebrew' : 'English'}
- Match the personality settings exactly
- Use the knowledge base to answer questions when relevant
- Keep your response natural and helpful
- Do NOT mention that this is a preview or test`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sampleMessage },
    ];

    console.log("Calling OpenAI with system prompt length:", systemPrompt.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          response: isHebrew 
            ? 'מצטערים, לא ניתן ליצור תצוגה מקדימה כרגע.'
            : 'Sorry, preview is not available right now.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 
      (isHebrew ? 'תודה על פנייתך!' : 'Thank you for your message!');

    console.log("AI Preview response:", aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("AI Preview error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Preview unavailable'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPersonalityInstructions(personality: any): string {
  if (!personality) return '';
  
  const toneMap: Record<string, string> = {
    professional: 'Use a formal, business-like tone. Be polite and respectful.',
    friendly: 'Use a warm and approachable tone. Be helpful and personable.',
    casual: 'Use a relaxed and informal tone. Be conversational and easygoing.',
    formal: 'Use a very proper and official tone. Be courteous and dignified.',
  };
  
  const styleMap: Record<string, string> = {
    concise: 'Keep responses short and to the point. No unnecessary words.',
    conversational: 'Use a natural, flowing dialogue style. Be engaging.',
    detailed: 'Provide thorough explanations when needed. Be comprehensive.',
  };
  
  const emojiMap: Record<string, string> = {
    none: 'Do NOT use any emojis at all.',
    minimal: 'Use emojis very sparingly - only 1 emoji if really appropriate.',
    moderate: 'Use emojis regularly to add warmth (2-3 per message).',
    frequent: 'Use lots of expressive emojis throughout your response (4+ per message).',
  };
  
  const lengthMap: Record<string, string> = {
    short: 'Keep responses under 80 characters. Very brief.',
    medium: 'Keep responses between 80-150 characters. Moderate length.',
    detailed: 'Responses can be 150-300 characters when helpful.',
  };
  
  return `
PERSONALITY GUIDELINES (FOLLOW EXACTLY):
- Tone: ${toneMap[personality.tone] || toneMap.friendly}
- Style: ${styleMap[personality.style] || styleMap.conversational}
- Emojis: ${emojiMap[personality.emoji_usage] || emojiMap.minimal}
- Length: ${lengthMap[personality.response_length] || lengthMap.medium}`;
}

function buildKnowledgeContext(knowledge: any): string {
  if (!knowledge) return '';
  
  let context = 'KNOWLEDGE BASE (use this info to answer questions):\n';
  let hasContent = false;
  
  if (knowledge.faqs && knowledge.faqs.length > 0) {
    hasContent = true;
    context += '\nFAQs:\n';
    knowledge.faqs.forEach((faq: { q: string; a: string }) => {
      context += `Q: ${faq.q}\nA: ${faq.a}\n`;
    });
  }
  
  if (knowledge.pricing && knowledge.pricing.length > 0) {
    hasContent = true;
    context += '\nPricing:\n';
    knowledge.pricing.forEach((item: { service: string; price: string }) => {
      context += `- ${item.service}: ${item.price}\n`;
    });
  }
  
  if (knowledge.policies && Object.keys(knowledge.policies).length > 0) {
    hasContent = true;
    context += '\nPolicies:\n';
    Object.entries(knowledge.policies).forEach(([key, value]) => {
      context += `- ${key}: ${value}\n`;
    });
  }
  
  if (knowledge.staff && knowledge.staff.length > 0) {
    hasContent = true;
    context += '\nStaff:\n';
    knowledge.staff.forEach((person: { name: string; specialty: string }) => {
      context += `- ${person.name}: ${person.specialty}\n`;
    });
  }
  
  return hasContent ? context : '';
}
