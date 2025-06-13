
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
  const preventBlurRef = useRef(false);

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
      preventBlurRef.current = true;
      
      // Keep focus during send operation
      if (textareaRef.current) {
        textareaRef.current.style.caretColor = 'transparent';
      }
      
      onSendMessage();
      
      // Restore focus and keyboard after message is sent
      setTimeout(() => {
        preventBlurRef.current = false;
        if (textareaRef.current) {
          textareaRef.current.style.caretColor = '';
          textareaRef.current.focus();
          // Force keyboard to stay open on iOS
          textareaRef.current.click();
        }
        setIsSending(false);
      }, 50);
    }
  }, [onSendMessage, currentMessage, isLoading, isSending, textareaRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Prevent blur that would close keyboard
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Always prevent blur during send operations or loading
    if (preventBlurRef.current || isSending || isLoading) {
      e.preventDefault();
      e.stopPropagation();
      // Immediately refocus
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 10);
      return false;
    }
  }, [isSending, isLoading, textareaRef]);

  // Maintain focus throughout the session
  useEffect(() => {
    const handleWindowBlur = (e: Event) => {
      // Prevent window blur from affecting our input
      if (preventBlurRef.current || isSending || isLoading) {
        e.preventDefault();
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isSending, isLoading, textareaRef]);

  // Initial focus and maintain focus after loading changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Refocus after loading state changes
    if (!isLoading && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isLoading]);

  // Handle button clicks to maintain focus - separate handlers for different event types
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSend();
  }, [handleSend]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSend();
  }, [handleSend]);

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
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 mobile-input"
          style={{
            WebkitUserSelect: 'text',
            WebkitTouchCallout: 'default',
            touchAction: 'manipulation'
          }}
          autoFocus
        />
      </div>
      
      <Button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
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
