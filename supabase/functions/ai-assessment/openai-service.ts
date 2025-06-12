
import { openAIApiKey, SUMMARY_SYSTEM_PROMPT } from './config.ts';
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

export async function generateSummary(bizInfo: BusinessInfo): Promise<string> {
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
          content: SUMMARY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Please create a LocalEdgeAI proposal for this business:

Business: ${bizInfo.businessName}
Industry: ${bizInfo.industry}
Employees: ${bizInfo.employees}
Pain Points: ${bizInfo.painPoints.join(', ')}
Goals: ${bizInfo.goals}`
        }
      ]
    }),
  });

  const summaryCompletion = await summaryResponse.json();
  return summaryCompletion.choices[0].message.content;
}
