
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIAssessmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
