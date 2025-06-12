
import { useState, useRef } from "react";
import { Message } from "@/components/ai-assessment/types";
import { useLanguage } from "@/contexts/LanguageContext";

export const useAssessmentState = () => {
  const { isHebrew } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: isHebrew 
        ? "שלום! אני טרוויס, מומחה הערכות בינה מלאכותית מלוקל אדג׳. אני כאן כדי לעזור לך לקבל הערכת בינה מלאכותית מותאמת אישית. בואו נתחיל - איך קוראים לך?"
        : "Hello! I'm Travis, an AI assessment specialist from LocalEdgeAI. I'm here to help you get a personalized AI assessment. Let's start - what's your name?"
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState("");
  const [stage, setStage] = useState<'initial' | 'assessment_complete' | 'contact_collected'>('initial');
  const [showContactButton, setShowContactButton] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const resetAssessment = () => {
    setMessages([{
      role: 'assistant',
      content: isHebrew 
        ? "שלום! אני טרוויס, מומחה הערכות בינה מלאכותית מלוקל אדג׳. אני כאן כדי לעזור לך לקבל הערכת בינה מלאכותית מותאמת אישית. בואו נתחיל - איך קוראים לך?"
        : "Hello! I'm Travis, an AI assessment specialist from LocalEdgeAI. I'm here to help you get a personalized AI assessment. Let's start - what's your name?"
    }]);
    setCurrentMessage("");
    setIsCompleted(false);
    setSummary("");
    setStage('initial');
    setShowContactButton(false);
  };

  return {
    messages,
    setMessages,
    currentMessage,
    setCurrentMessage,
    isLoading,
    setIsLoading,
    isCompleted,
    setIsCompleted,
    summary,
    setSummary,
    stage,
    setStage,
    showContactButton,
    setShowContactButton,
    scrollAreaRef,
    messageInputRef,
    resetAssessment
  };
};
