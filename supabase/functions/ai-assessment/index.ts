
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `
You are the LocalEdgeAI "Free 30-Minute AI Assessment" Assistant. LocalEdgeAI specializes in cost-effective AI integrations for businesses.

YOUR ROLE:
- You represent LocalEdgeAI exclusively - do NOT refer users to other AI providers
- Your goal is to assess their business needs and position LocalEdgeAI as the solution
- Collect business information to provide personalized LocalEdgeAI recommendations

CONVERSATION FLOW:
- Use function calling to collect user data systematically
- Ask for these fields ONE question at a time:
  • businessName
  • industry  
  • employees
  • revenueRange
  • painPoints (up to 3 items)
  • goals
- When you have all fields, call the function "collectBusinessInfo" with the arguments as JSON
- Stay focused: If users ask off-topic questions, reply: "I'm your LocalEdgeAI Assessment bot—let's finish your assessment first so I can provide personalized AI recommendations for your business."

TONE & POSITIONING:
- Professional yet friendly
- Position LocalEdgeAI as the expert solution provider
- Emphasize cost-effectiveness and practical AI implementations
- Show genuine interest in their business challenges
`;

const functions = [
  {
    name: 'collectBusinessInfo',
    description: 'Collects structured business assessment fields from the user for LocalEdgeAI recommendations.',
    parameters: {
      type: 'object',
      properties: {
        businessName: { type: 'string' },
        industry: { type: 'string' },
        employees: { type: 'integer' },
        revenueRange: { type: 'string' },
        painPoints: { type: 'array', items: { type: 'string' } },
        goals: { type: 'string' }
      },
      required: ['businessName', 'industry', 'employees', 'revenueRange', 'painPoints', 'goals']
    }
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { history } = await req.json();
    console.log('Received chat history:', history);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history
        ],
        functions,
        function_call: 'auto'
      }),
    });

    const completion = await response.json();
    const message = completion.choices[0].message;

    console.log('OpenAI response:', message);

    // If the model called our function, handle it
    if (message.function_call?.name === 'collectBusinessInfo') {
      const bizInfo = JSON.parse(message.function_call.arguments);
      console.log('Collected business info:', bizInfo);

      // Save bizInfo to Supabase
      const { data, error } = await supabase
        .from('assessments')
        .insert([{
          business_name: bizInfo.businessName,
          industry: bizInfo.industry,
          employees: bizInfo.employees,
          revenue_range: bizInfo.revenueRange,
          pain_points: bizInfo.painPoints,
          goals: bizInfo.goals
        }]);

      if (error) {
        console.error('Supabase insert error:', error);
      } else {
        console.log('Assessment saved successfully:', data);
      }

      // Generate LocalEdgeAI-specific recommendations
      const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a LocalEdgeAI business consultant providing personalized AI recommendations. LocalEdgeAI specializes in cost-effective AI integrations for businesses.

IMPORTANT: You represent LocalEdgeAI exclusively. Do NOT mention or recommend other AI providers.

Based on the collected business information, provide a comprehensive LocalEdgeAI proposal. 

FORMAT YOUR RESPONSE AS PLAIN TEXT WITHOUT MARKDOWN:
- Do not use markdown headers (###, ##, #)
- Do not use bold (**text**) or italic (*text*) formatting
- Use clear section breaks with line spacing
- Use bullet points with simple dashes (-) for lists
- Keep the content professional and well-structured

Structure your response with these sections:

EXECUTIVE SUMMARY
Brief overview of their business and how LocalEdgeAI can help

TAILORED LOCALEDGEAI SOLUTIONS
Specific AI recommendations that address their pain points:
- Chatbots & Customer Service Automation
- Data Analytics & Business Intelligence  
- Process Automation & Workflow Optimization
- Custom AI Integrations

IMPLEMENTATION ROADMAP
Practical 30-90 day plan with LocalEdgeAI

ROI & COST BENEFITS
How LocalEdgeAI's cost-effective approach will save them money

NEXT STEPS
Clear call-to-action to work with LocalEdgeAI

Be specific, actionable, and emphasize LocalEdgeAI's expertise in making AI simple, fast, and affordable. Position LocalEdgeAI as their ideal AI partner.`
            },
            {
              role: 'user',
              content: `Please create a LocalEdgeAI proposal for this business:

Business: ${bizInfo.businessName}
Industry: ${bizInfo.industry}
Employees: ${bizInfo.employees}
Revenue Range: ${bizInfo.revenueRange}
Pain Points: ${bizInfo.painPoints.join(', ')}
Goals: ${bizInfo.goals}`
            }
          ]
        }),
      });

      const summaryCompletion = await summaryResponse.json();
      const summaryText = summaryCompletion.choices[0].message.content;

      return new Response(JSON.stringify({
        bizInfo,
        summary: summaryText,
        completed: true
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
