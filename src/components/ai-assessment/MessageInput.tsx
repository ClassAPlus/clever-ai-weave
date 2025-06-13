
import { forwardRef, useCallback, useRef, useEffect } from "react";
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

  // Prevent zoom on iOS when focusing input
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Set font-size to prevent zoom on iOS
      textarea.style.fontSize = '16px';
      textarea.style.webkitAppearance = 'none';
    }
  }, [textareaRef]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentMessage.trim() && !isLoading) {
        onSendMessage();
      }
    }
  };

  const handleSendClick = useCallback(() => {
    if (currentMessage.trim() && !isLoading) {
      onSendMessage();
    }
  }, [onSendMessage, currentMessage, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Scroll into view on focus for mobile
    setTimeout(() => {
      e.target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 300); // Wait for keyboard animation
  };

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          disabled={isLoading}
          rows={2}
          className="resize-none text-base min-h-[44px] border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          style={{
            fontSize: '16px', // Prevent zoom on iOS
            WebkitAppearance: 'none',
            borderRadius: '8px'
          }}
        />
      </div>
      
      <Button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isLoading}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 min-h-[44px] min-w-[44px]"
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
