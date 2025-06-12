
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send } from "lucide-react";

interface MessageInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export const MessageInput = ({ 
  currentMessage, 
  setCurrentMessage, 
  onSendMessage, 
  isLoading 
}: MessageInputProps) => {
  const { isHebrew } = useLanguage();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
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
        onClick={onSendMessage}
        disabled={!currentMessage.trim() || isLoading}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6"
      >
        <Send size={16} />
      </Button>
    </div>
  );
};
