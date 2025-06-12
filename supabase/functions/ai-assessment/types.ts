
export interface BusinessInfo {
  userName: string;
  businessName: string;
  industry: string;
  employees: number;
  painPoints: string[];
  goals: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}
