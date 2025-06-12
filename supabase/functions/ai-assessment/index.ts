
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, SYSTEM_PROMPT, HEBREW_SYSTEM_PROMPT } from './config.ts';
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
    const { history, language } = await req.json();
    console.log('Received chat history:', history);
    console.log('Language:', language);

    const isHebrew = language === 'hebrew';
    const systemPrompt = isHebrew ? HEBREW_SYSTEM_PROMPT : SYSTEM_PROMPT;

    // Check if we have enough information to extract business info manually
    const hasEnoughInfo = checkForCompleteBusinessInfo(history);
    
    if (hasEnoughInfo && !hasAlreadyCollectedInfo(history)) {
      console.log('Detected complete business info, extracting manually...');
      const bizInfo = extractBusinessInfoFromHistory(history);
      
      if (bizInfo) {
        console.log('Extracted business info:', bizInfo);
        
        // Save bizInfo to Supabase
        await saveAssessment(bizInfo);

        // Generate LocalEdgeAI-focused recommendations with correct language
        const summaryText = await generateSummary(bizInfo, isHebrew);

        return new Response(JSON.stringify({
          bizInfo,
          summary: summaryText,
          completed: true,
          stage: 'assessment_complete',
          message: isHebrew 
            ? `תודה, ${bizInfo.userName.split(' ')[0]}! הנה המלצות לוקל אדג׳ מותאמות אישית עבורך.`
            : `Thank you, ${bizInfo.userName.split(' ')[0]}! Here are your personalized LocalEdgeAI recommendations.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const completion = await callOpenAI([
      { role: 'system', content: systemPrompt },
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

      // Generate LocalEdgeAI-focused recommendations with correct language
      const summaryText = await generateSummary(bizInfo, isHebrew);

      return new Response(JSON.stringify({
        bizInfo,
        summary: summaryText,
        completed: true,
        stage: 'assessment_complete',
        message: isHebrew 
          ? `תודה, ${bizInfo.userName.split(' ')[0]}! הנה המלצות לוקל אדג׳ מותאמות אישית עבורך.`
          : `Thank you, ${bizInfo.userName.split(' ')[0]}! Here are your personalized LocalEdgeAI recommendations.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If the model called our collectContactInfo function
    if (message.function_call?.name === 'collectContactInfo') {
      const contactInfo: ContactInfo = JSON.parse(message.function_call.arguments);
      console.log('Collected contact info:', contactInfo);

      // Get business name and user name from previous messages
      const { businessName, userName } = extractBusinessAndUserInfo(history);
      
      // Save contact request to Supabase
      await saveContactRequest(contactInfo, businessName, userName);

      return new Response(JSON.stringify({
        contactInfo,
        completed: true,
        stage: 'contact_collected',
        message: isHebrew
          ? `תודה, ${contactInfo.firstName}! קיבלנו את פרטי הקשר שלך ולוקל אדג׳ ייצור איתך קשר תוך 24 שעות כדי לדון איך אנחנו יכולים לעזור לשנות את העסק שלך עם פתרונות הבינה המלאכותית שלנו.`
          : `Thank you, ${contactInfo.firstName}! We've received your contact information and LocalEdgeAI will reach out to you within 24 hours to discuss how we can help transform your business with our AI solutions.`
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

function checkForCompleteBusinessInfo(history: any[]): boolean {
  const conversation = history.map(msg => msg.content.toLowerCase()).join(' ');
  
  // Check if we have collected all required information
  const hasName = history.some(msg => 
    msg.role === 'assistant' && 
    (msg.content.toLowerCase().includes('name') && !msg.content.toLowerCase().includes('business'))
  );
  
  const hasBusinessName = history.some(msg => 
    msg.role === 'assistant' && 
    msg.content.toLowerCase().includes('business') && 
    msg.content.toLowerCase().includes('name')
  );
  
  const hasIndustry = history.some(msg => 
    msg.role === 'assistant' && 
    msg.content.toLowerCase().includes('industry')
  );
  
  const hasEmployees = history.some(msg => 
    msg.role === 'assistant' && 
    msg.content.toLowerCase().includes('employees')
  );
  
  const hasPainPoints = history.some(msg => 
    msg.role === 'assistant' && 
    msg.content.toLowerCase().includes('pain points')
  );
  
  const hasGoals = history.some(msg => 
    msg.role === 'assistant' && 
    msg.content.toLowerCase().includes('goals')
  );
  
  return hasName && hasBusinessName && hasIndustry && hasEmployees && hasPainPoints && hasGoals;
}

function hasAlreadyCollectedInfo(history: any[]): boolean {
  return history.some(msg => 
    msg.role === 'assistant' && 
    msg.content.includes('personalized LocalEdgeAI recommendations')
  );
}

function extractBusinessInfoFromHistory(history: any[]): BusinessInfo | null {
  let userName = 'Unknown User';
  let businessName = 'Unknown Business';
  let industry = 'Unknown Industry';
  let employees = '1';
  let painPoints: string[] = ['Unknown'];
  let goals = 'Unknown Goals';
  
  console.log('Extracting business info from history:', history);
  
  // Look through conversation history to extract information
  for (let i = 0; i < history.length; i++) {
    const message = history[i];
    if (message.role === 'user' && message.content) {
      const content = message.content.trim();
      
      // Check previous assistant message for context
      if (i > 0) {
        const prevMessage = history[i - 1];
        if (prevMessage.role === 'assistant' && prevMessage.content) {
          const prevContent = prevMessage.content.toLowerCase();
          
          // Look for different types of questions
          if (prevContent.includes('name') && !prevContent.includes('business')) {
            userName = content;
            console.log('Found user name:', userName);
          }
          else if (prevContent.includes('business') && prevContent.includes('name')) {
            businessName = content;
            console.log('Found business name:', businessName);
          }
          else if (prevContent.includes('industry')) {
            industry = content;
            console.log('Found industry:', industry);
          }
          else if (prevContent.includes('employees')) {
            employees = content;
            console.log('Found employees:', employees);
          }
          else if (prevContent.includes('pain points')) {
            painPoints = [content];
            console.log('Found pain points:', painPoints);
          }
          else if (prevContent.includes('goals')) {
            goals = content;
            console.log('Found goals:', goals);
          }
        }
      }
    }
  }
  
  // Only return if we have meaningful data
  if (userName !== 'Unknown User' && businessName !== 'Unknown Business') {
    const bizInfo: BusinessInfo = {
      userName,
      businessName,
      industry,
      employees,
      painPoints,
      goals
    };
    
    console.log('Extracted complete business info:', bizInfo);
    return bizInfo;
  }
  
  return null;
}

function extractBusinessAndUserInfo(history: any[]): { businessName: string, userName: string } {
  let businessName = 'Unknown Business';
  let userName = 'Unknown User';
  
  console.log('Extracting business and user info from history:', history);
  
  // Look through conversation history to extract business and user names
  for (let i = 0; i < history.length; i++) {
    const message = history[i];
    if (message.role === 'user' && message.content) {
      const content = message.content.trim();
      
      // Check previous assistant message for context
      if (i > 0) {
        const prevMessage = history[i - 1];
        if (prevMessage.role === 'assistant' && prevMessage.content) {
          const prevContent = prevMessage.content.toLowerCase();
          
          // Look for business name question patterns
          if (prevContent.includes('business') && prevContent.includes('name')) {
            businessName = content;
            console.log('Found business name:', businessName);
          }
          // Look for user name question patterns (but not business name)
          else if (prevContent.includes('name') && !prevContent.includes('business')) {
            userName = content;
            console.log('Found user name:', userName);
          }
        }
      }
    }
  }
  
  console.log('Extracted info:', { businessName, userName });
  return { businessName, userName };
}
