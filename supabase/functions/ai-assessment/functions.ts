
import { OpenAIFunction } from './types.ts';

export const functions: OpenAIFunction[] = [
  {
    name: 'collectBusinessInfo',
    description: 'Collects structured business assessment fields from the user for LocalEdgeAI recommendations.',
    parameters: {
      type: 'object',
      properties: {
        businessName: { type: 'string' },
        industry: { type: 'string' },
        employees: { type: 'integer' },
        painPoints: { type: 'array', items: { type: 'string' } },
        goals: { type: 'string' }
      },
      required: ['businessName', 'industry', 'employees', 'painPoints', 'goals']
    }
  },
  {
    name: 'collectContactInfo',
    description: 'Collects contact information when user wants to be contacted for additional assistance or a quote.',
    parameters: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' }
      },
      required: ['firstName', 'lastName', 'email']
    }
  }
];
