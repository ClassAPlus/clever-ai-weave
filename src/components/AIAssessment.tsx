
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssessmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'flex-row-reverse space-x-reverse'
                      : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border shadow-sm p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Section */}
          {isCompleted && summary && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
              <h3 className="font-semibold text-lg mb-2 text-purple-800">
                {isHebrew ? "המלצות מותאמות אישית" : "Your Personalized Recommendations"}
              </h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</div>
              <Button
                onClick={resetAssessment}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isHebrew ? "התחל הערכה חדשה" : "Start New Assessment"}
              </Button>
            </div>
          )}

          {/* Input Section */}
          {!isCompleted && (
            <div className="flex space-x-2">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
                className="flex-1 min-h-[60px] max-h-[120px]"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6"
              >
                <Send size={16} />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
