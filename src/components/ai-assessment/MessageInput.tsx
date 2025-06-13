
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
  const focusTimeoutRef = useRef<NodeJS.Timeout>();
  const isFocusedRef = useRef(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = useCallback(() => {
    onSendMessage();
  }, [onSendMessage]);

  const handleFocus = useCallback(() => {
    console.log('Input focused');
    isFocusedRef.current = true;
    clearTimeout(focusTimeoutRef.current);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    console.log('Input blur event');
    // Prevent blur if it's just a layout shift
    focusTimeoutRef.current = setTimeout(() => {
      isFocusedRef.current = false;
    }, 100);
  }, []);

  const handleTouchStart = useCallback(() => {
    console.log('Input touched');
    // Ensure focus on touch for iOS
    if (textareaRef.current && !isFocusedRef.current) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onTouchStart={handleTouchStart}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          className="input-textarea"
          style={{
            direction: 'ltr',
            textAlign: 'left',
            fontSize: '16px',
            touchAction: 'manipulation'
          }}
          dir="ltr"
          lang="en"
          inputMode="text"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={isLoading}
          rows={2}
        />
      </div>
      
      <Button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isLoading}
        className="send-button"
        style={{
          minHeight: '44px',
          minWidth: '44px',
          touchAction: 'manipulation'
        }}
      >
        {isLoading ? (
          <Sparkles size={18} className="animate-spin" />
        ) : (
          <Send size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        )}
      </Button>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
