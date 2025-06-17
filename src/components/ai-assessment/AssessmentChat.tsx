
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

  const sendMessage = async (messageToSend?: string) => {
    const userMessage = messageToSend || currentMessage;
    
    if (!userMessage.trim() || isLoading) {
      console.log('SendMessage called but conditions not met:', { 
        messageToSend, 
        currentMessage: currentMessage.trim(), 
        isLoading 
      });
      return;
    }

    console.log('SendMessage proceeding with message:', userMessage);
    
    // Clear the current message immediately
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    // Add timeout for API calls
    const timeoutId = setTimeout(() => {
      console.error('API call timeout');
      setIsLoading(false);
      toast({
        title: isHebrew ? "תם הזמן" : "Timeout",
        description: isHebrew 
          ? "הבקשה ארכה יותר מדי זמן. אנא נסה שוב."
          : "The request took too long. Please try again.",
        variant: "destructive",
      });
    }, 30000); // 30 second timeout

    try {
      console.log('Calling edge function with messages:', newMessages);
      
      const { data, error } = await supabase.functions.invoke('ai-assessment', {
        body: {
          history: newMessages,
          language: isHebrew ? 'hebrew' : 'english'
        }
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Unknown error occurred');
      }

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
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error sending message:', error);
      
      // Enhanced error handling with specific error messages
      let errorMessage = isHebrew 
        ? "אירעה שגיאה בשליחת ההודעה. אנא נסה שוב."
        : "An error occurred sending the message. Please try again.";

      if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        errorMessage = isHebrew 
          ? "בעיית חיבור לשרת. אנא בדוק את החיבור לאינטרנט ונסה שוב."
          : "Connection issue. Please check your internet connection and try again.";
      } else if (error.message?.includes('failed')) {
        errorMessage = isHebrew 
          ? "השרת אינו זמין כרגע. אנא נסה שוב בעוד כמה רגעים."
          : "Server is currently unavailable. Please try again in a few moments.";
      }

      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Add error message to chat to maintain context
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: isHebrew 
          ? "מצטער, נתקלתי בבעיה טכנית. אנא נסה לשלוח את ההודעה שוב."
          : "Sorry, I encountered a technical issue. Please try sending your message again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactRequest = () => {
    console.log('Contact request initiated');
    
    // Add a message to start collecting contact information
    const contactMessage = isHebrew 
      ? "נהדר! אשמח לעזור לך עם פתרונות בינה מלאכותית מותאמים אישית. כדי שהצוות שלנו יוכל ליצור איתך קשר, אני צריך כמה פרטים. מה השם הפרטי והמשפחה שלך?"
      : "Great! I'd love to help you with custom AI solutions. So our team can contact you, I need a few details. What's your first and last name?";
    
    setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: contactMessage }]);
    setShowContactButton(false);
    setIsCompleted(false); // Allow continuing the conversation
    setStage('initial'); // Reset stage to allow message input
    
    console.log('Contact request setup complete');
  };

  return {
    sendMessage,
    handleContactRequest
  };
};
