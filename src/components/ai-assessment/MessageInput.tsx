
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
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = useCallback(() => {
    onSendMessage();
  }, [onSendMessage]);

  const handleFirstTouch = useCallback(() => {
    console.log('First touch interaction');
    if (!hasInteracted && textareaRef.current) {
      setHasInteracted(true);
      // Remove readonly attribute on first touch (iOS hack)
      textareaRef.current.removeAttribute('readonly');
      textareaRef.current.focus();
    }
  }, [hasInteracted]);

  const handleFocus = useCallback(() => {
    console.log('Input focused successfully');
  }, []);

  // iOS-specific initialization
  useEffect(() => {
    if (textareaRef.current && !hasInteracted) {
      // Start with readonly to prevent iOS keyboard issues
      textareaRef.current.setAttribute('readonly', 'true');
    }
  }, [hasInteracted]);

  return (
    <div className="input-container-ios">
      <div className="input-wrapper-ios">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onTouchStart={handleFirstTouch}
          onClick={handleFirstTouch}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          className="input-textarea-ios"
          style={{
            direction: 'ltr',
            textAlign: 'left',
            fontSize: '16px',
            touchAction: 'manipulation',
            transform: 'translate3d(0,0,0)',
            WebkitTransform: 'translate3d(0,0,0)'
          }}
          dir="ltr"
          lang="en"
          inputMode={hasInteracted ? "text" : "none"}
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
        className="send-button-ios"
        style={{
          minHeight: '44px',
          minWidth: '44px',
          touchAction: 'manipulation',
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)'
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
