import { forwardRef, useCallback, useRef, useEffect, useState } from "react";
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
  const [isSending, setIsSending] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentMessage.trim() && !isLoading && !isSending) {
        handleSend();
      }
    }
  };

  const handleSend = useCallback(() => {
    if (currentMessage.trim() && !isLoading && !isSending) {
      setIsSending(true);
      onSendMessage();
      
      // Maintain focus after a brief delay to keep keyboard open
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        setIsSending(false);
      }, 100);
    }
  }, [onSendMessage, currentMessage, isLoading, isSending, textareaRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Maintain focus and prevent blur during send operations
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Prevent keyboard close during send operation
    if (isSending) {
      e.preventDefault();
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      });
    }
  }, [isSending, textareaRef]);

  // Initial focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Refocus after loading state changes to maintain keyboard
  useEffect(() => {
    if (!isLoading && textareaRef.current && document.activeElement !== textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    }
  }, [isLoading]);

  return (
    <div className="flex gap-3 items-end w-full">
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          disabled={isLoading}
          rows={2}
          inputMode="text"
          className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 mobile-input"
          style={{
            WebkitUserSelect: 'text',
            WebkitTouchCallout: 'default'
          }}
          autoFocus
        />
      </div>
      
      <Button
        onClick={handleSend}
        disabled={!currentMessage.trim() || isLoading || isSending}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 min-h-[44px] min-w-[44px] flex-shrink-0"
        size="icon"
        type="button"
      >
        {isLoading || isSending ? (
          <Sparkles size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </Button>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
