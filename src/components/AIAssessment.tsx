
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        // Assessment is complete, show summary
        setIsCompleted(true);
        setSummary(data.summary);
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: isHebrew 
            ? "תודה! סיימנו את ההערכה. הנה המלצות מותאמות אישית עבור העסק שלך:"
            : "Thank you! We've completed the assessment. Here are your personalized recommendations:"
        }]);
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {isHebrew ? "הערכת AI חינמית של 30 דקות" : "Free 30-Minute AI Assessment"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[60vh]">
          <ChatMessages messages={messages} isLoading={isLoading} />

          {isCompleted && summary && (
            <AssessmentSummary summary={summary} onResetAssessment={resetAssessment} />
          )}

          {!isCompleted && (
            <MessageInput
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
