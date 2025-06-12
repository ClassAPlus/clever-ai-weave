import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AIAssessmentProps, Message } from "./ai-assessment/types";
import { ChatMessages } from "./ai-assessment/ChatMessages";
import { AssessmentSummary } from "./ai-assessment/AssessmentSummary";
import { MessageInput } from "./ai-assessment/MessageInput";

export const AIAssessment = ({ open, onOpenChange }: AIAssessmentProps) => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: isHebrew 
        ? "שלום! אני כאן כדי לעזור לך לקבל הערכת AI מותאמת אישית לעסק שלך. בואו נתחיל - איך קוראים לעסק שלך?"
        : "Hello! I'm here to help you get a personalized AI assessment for your business. Let's start - what's your business name?"
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState("");
  const [stage, setStage] = useState<'initial' | 'assessment_complete' | 'contact_collected'>('initial');

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
          // Assessment is complete, show summary
          setSummary(data.summary);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: isHebrew 
              ? "תודה! סיימנו את ההערכה. הנה המלצות מותאמות אישית עבור העסק שלך:"
              : "Thank you! We've completed the assessment. Here are your personalized recommendations:"
          }]);
        } else if (data.stage === 'contact_collected') {
          // Contact info collected
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

  const resetAssessment = () => {
    setMessages([{
      role: 'assistant',
      content: isHebrew 
        ? "שלום! אני כאן כדי לעזור לך לקבל הערכת AI מותאמת אישית לעסק שלך. בואו נתחיל - איך קוראים לעסק שלך?"
        : "Hello! I'm here to help you get a personalized AI assessment for your business. Let's start - what's your business name?"
    }]);
    setCurrentMessage("");
    setIsCompleted(false);
    setSummary("");
    setStage('initial');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-gray-50 to-purple-50/30">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
            {isHebrew ? "🤖 הערכת AI חינמית של 30 דקות" : "🤖 Free 30-Minute AI Assessment"}
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            {isHebrew ? "גלה איך AI יכול לשדרג את העסק שלך" : "Discover how AI can transform your business"}
          </p>
        </DialogHeader>

        <ScrollArea className="h-[65vh] relative">
          <div className="flex flex-col min-h-full p-1">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
            
            <div className="flex-1">
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>

            {isCompleted && summary && (
              <AssessmentSummary summary={summary} onResetAssessment={resetAssessment} />
            )}

            {!isCompleted && (
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4">
                <MessageInput
                  currentMessage={currentMessage}
                  setCurrentMessage={setCurrentMessage}
                  onSendMessage={sendMessage}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
