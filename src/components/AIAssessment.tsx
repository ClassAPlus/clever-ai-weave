
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AIAssessmentProps, Message } from "./ai-assessment/types";
import { ChatMessages } from "./ai-assessment/ChatMessages";
import { AssessmentSummary } from "./ai-assessment/AssessmentSummary";
import { MessageInput } from "./ai-assessment/MessageInput";
import { useIsMobile } from "@/hooks/use-mobile";

export const AIAssessment = ({ open, onOpenChange }: AIAssessmentProps) => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: isHebrew 
        ? "שלום! אני טרוויס, מומחה הערכות AI מ-LocalEdgeAI. אני כאן כדי לעזור לך לקבל הערכת AI מותאמת אישית. בואו נתחיל - איך קוראים לך?"
        : "Hello! I'm Travis, an AI assessment specialist from LocalEdgeAI. I'm here to help you get a personalized AI assessment. Let's start - what's your name?"
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState("");
  const [stage, setStage] = useState<'initial' | 'assessment_complete' | 'contact_collected'>('initial');
  const [showContactButton, setShowContactButton] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Focus input field after bot responses and when dialog opens
  useEffect(() => {
    if (!isLoading && !isCompleted && messageInputRef.current) {
      // Small delay to ensure the message has been rendered
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [messages, isLoading, isCompleted, open]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage;
    setCurrentMessage("");
    setIsLoading(true);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assessment', {
        body: {
          history: newMessages
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
              ? "תודה! סיימנו את ההערכה. הנה המלצות LocalEdgeAI מותאמות אישית עבור העסק שלך:"
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
      ? "נהדר! אשמח לעזור לך עם פתרונות AI מותאמים אישית. כדי שהצוות שלנו יוכל ליצור איתך קשר, אני צריך כמה פרטים. מה השם הפרטי והמשפחה שלך?"
      : "Great! I'd love to help you with custom AI solutions. So our team can contact you, I need a few details. What's your first and last name?";
    
    setMessages(prev => [...prev, { role: 'assistant', content: contactMessage }]);
    setShowContactButton(false);
    setIsCompleted(false); // Allow continuing the conversation
  };

  const resetAssessment = () => {
    setMessages([{
      role: 'assistant',
      content: isHebrew 
        ? "שלום! אני טרוויס, מומחה הערכות AI מ-LocalEdgeAI. אני כאן כדי לעזור לך לקבל הערכת AI מותאמת אישית. בואו נתחיל - איך קוראים לך?"
        : "Hello! I'm Travis, an AI assessment specialist from LocalEdgeAI. I'm here to help you get a personalized AI assessment. Let's start - what's your name?"
    }]);
    setCurrentMessage("");
    setIsCompleted(false);
    setSummary("");
    setStage('initial');
    setShowContactButton(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`
        ${isMobile 
          ? 'max-w-[95vw] h-[90vh] max-h-[90vh] p-4' 
          : 'max-w-4xl h-[80vh] max-h-[80vh] p-6'
        } 
        overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-gray-50 to-purple-50/30 flex flex-col
      `}>
        <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
          <DialogTitle className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center`}>
            {isHebrew ? "🤖 הערכת AI חינמית של LocalEdgeAI" : "🤖 Free LocalEdgeAI Assessment"}
          </DialogTitle>
          <p className={`text-center text-gray-600 mt-2 ${isMobile ? 'text-sm' : ''}`}>
            {isHebrew ? "גלה איך LocalEdgeAI יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1 relative" ref={scrollAreaRef}>
            <div className="flex flex-col min-h-full p-1">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
              
              <div className="flex-1">
                <ChatMessages messages={messages} isLoading={isLoading} />
              </div>

              {isCompleted && summary && (
                <AssessmentSummary 
                  summary={summary} 
                  onResetAssessment={resetAssessment} 
                  onRequestContact={handleContactRequest}
                  stage={stage}
                  showContactButton={showContactButton}
                />
              )}
            </div>
          </ScrollArea>

          {!isCompleted && (
            <div className={`flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent ${isMobile ? 'pt-2' : 'pt-4'}`}>
              <MessageInput
                ref={messageInputRef}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                onSendMessage={sendMessage}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
