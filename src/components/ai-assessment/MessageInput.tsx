
import { forwardRef, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Sparkles } from "lucide-react";

interface MessageInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(({ 
  currentMessage, 
  setCurrentMessage, 
  onSendMessage, 
  isLoading 
}, ref) => {
  const { isHebrew } = useLanguage();
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = useCallback(() => {
    onSendMessage();
  }, [onSendMessage]);

  return (
    <div className="absolute bottom-0 left-0 right-0 flex gap-3 p-4 bg-white border-t border-gray-200 z-50" 
         style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          disabled={isLoading}
          rows={2}
          className="resize-none"
        />
      </div>
      
      <Button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isLoading}
        className="self-end bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700"
        size="icon"
      >
        {isLoading ? (
          <Sparkles size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </Button>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
