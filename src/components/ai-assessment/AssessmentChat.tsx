
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "./types";

interface AssessmentChatProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  setSummary: (summary: string) => void;
  setStage: (stage: 'initial' | 'assessment_complete' | 'contact_collected') => void;
  setShowContactButton: (show: boolean) => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  messageInputRef: React.RefObject<HTMLTextAreaElement>;
}

export const AssessmentChat = ({
  messages,
  setMessages,
  currentMessage,
  setCurrentMessage,
  isLoading,
  setIsLoading,
  isCompleted,
  setIsCompleted,
  setSummary,
  setStage,
  setShowContactButton,
  scrollAreaRef,
  messageInputRef
}: AssessmentChatProps) => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change, but not when showing recommendations
  useEffect(() => {
    // Don't auto-scroll if we're showing recommendations (assessment completed with summary)
    if (isCompleted && setStage) {
      return;
    }

    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading, isCompleted, setStage, scrollAreaRef]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) {
      console.log('SendMessage called but conditions not met:', { currentMessage: currentMessage.trim(), isLoading });
      return;
    }

    console.log('SendMessage proceeding with message:', currentMessage);
    const userMessage = currentMessage;
    setIsLoading(true);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    // Clear the current message after adding it to the chat
    setCurrentMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-assessment', {
        body: {
          history: newMessages,
          language: isHebrew ? 'hebrew' : 'english'
        }
      });

      if (error) throw error;

      console.log('Edge function response:', data);

      if (data.completed) {
        setIsCompleted(true);
        setStage(data.stage);
        
        if (data.stage === 'assessment_complete') {
          // Assessment is complete, show summary with contact button
          setSummary(data.summary);
          setShowContactButton(true);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: isHebrew 
              ? "תודה! סיימנו את ההערכה. הנה המלצות לוקל אדג׳ מותאמות אישית עבור העסק שלך:"
              : "Thank you! We've completed the assessment. Here are your personalized LocalEdgeAI recommendations:"
          }]);
        } else if (data.stage === 'contact_collected') {
          // Contact info collected
          setShowContactButton(false);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: data.message
          }]);
        }
      } else if (data.reply) {
        // Continue conversation
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: isHebrew 
          ? "אירעה שגיאה בשליחת ההודעה. אנא נסה שוב."
          : "An error occurred sending the message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactRequest = () => {
    // Add a message to start collecting contact information
    const contactMessage = isHebrew 
      ? "נהדר! אשמח לעזור לך עם פתרונות בינה מלאכותית מותאמים אישית. כדי שהצוות שלנו יוכל ליצור איתך קשר, אני צריך כמה פרטים. מה השם הפרטי והמשפחה שלך?"
      : "Great! I'd love to help you with custom AI solutions. So our team can contact you, I need a few details. What's your first and last name?";
    
    setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: contactMessage }]);
    setShowContactButton(false);
    setIsCompleted(false); // Allow continuing the conversation
  };

  return {
    sendMessage,
    handleContactRequest
  };
};
