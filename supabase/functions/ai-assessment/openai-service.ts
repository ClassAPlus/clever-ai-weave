
import { openAIApiKey, SUMMARY_SYSTEM_PROMPT, HEBREW_SUMMARY_SYSTEM_PROMPT } from './config.ts';
import { ChatMessage, BusinessInfo } from './types.ts';

export async function callOpenAI(messages: ChatMessage[], functions: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      functions,
      function_call: 'auto'
    }),
  });

  return await response.json();
}

export async function generateSummary(bizInfo: BusinessInfo, isHebrew: boolean = false): Promise<string> {
  const systemPrompt = isHebrew ? HEBREW_SUMMARY_SYSTEM_PROMPT : SUMMARY_SYSTEM_PROMPT;
  
  const userContent = isHebrew 
    ? `אנא צור הצעת לוקל אדג׳ עבור העסק הזה:

עסק: ${bizInfo.businessName}
תחום: ${bizInfo.industry}
עובדים: ${bizInfo.employees}
נקודות כאב: ${bizInfo.painPoints.join(', ')}
מטרות: ${bizInfo.goals}`
    : `Please create a LocalEdgeAI proposal for this business:

Business: ${bizInfo.businessName}
Industry: ${bizInfo.industry}
Employees: ${bizInfo.employees}
Pain Points: ${bizInfo.painPoints.join(', ')}
Goals: ${bizInfo.goals}`;

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
          content: systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ]
    }),
  });

  const summaryCompletion = await summaryResponse.json();
  return summaryCompletion.choices[0].message.content;
}
