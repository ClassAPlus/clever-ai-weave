
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, SYSTEM_PROMPT } from './config.ts';
import { functions } from './functions.ts';
import { callOpenAI, generateSummary } from './openai-service.ts';
import { saveAssessment, saveContactRequest } from './database-service.ts';
import { BusinessInfo, ContactInfo } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { history } = await req.json();
    console.log('Received chat history:', history);

    const completion = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
    ], functions);

    const message = completion.choices[0].message;
    console.log('OpenAI response:', message);

    // If the model called our collectBusinessInfo function
    if (message.function_call?.name === 'collectBusinessInfo') {
      const bizInfo: BusinessInfo = JSON.parse(message.function_call.arguments);
      console.log('Collected business info:', bizInfo);

      // Save bizInfo to Supabase
      await saveAssessment(bizInfo);

      // Generate LocalEdgeAI-specific recommendations
      const summaryText = await generateSummary(bizInfo);

      return new Response(JSON.stringify({
        bizInfo,
        summary: summaryText,
        completed: true,
        stage: 'assessment_complete'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If the model called our collectContactInfo function
    if (message.function_call?.name === 'collectContactInfo') {
      const contactInfo: ContactInfo = JSON.parse(message.function_call.arguments);
      console.log('Collected contact info:', contactInfo);

      // Get business name from previous messages
      const businessName = extractBusinessNameFromHistory(history);
      
      // Save contact request to Supabase
      await saveContactRequest(contactInfo, businessName);

      return new Response(JSON.stringify({
        contactInfo,
        completed: true,
        stage: 'contact_collected',
        message: `Thank you, ${contactInfo.firstName}! We've received your contact information and will reach out to you within 24 hours to discuss how LocalEdgeAI can help transform your business with AI solutions.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise, return the assistant's question or intermediate text
    return new Response(JSON.stringify({ 
      reply: message.content,
      completed: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: 'AI request failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractBusinessNameFromHistory(history: any[]): string {
  // Look for business name in the conversation history
  for (const message of history) {
    if (message.content && typeof message.content === 'string') {
      // Simple extraction - in a real implementation, this could be more sophisticated
      const businessMatch = message.content.match(/business.*?(?:name|called).*?is\s+([^.!?]+)/i);
      if (businessMatch) {
        return businessMatch[1].trim();
      }
    }
  }
  return 'Unknown Business';
}
