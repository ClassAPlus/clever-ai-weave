
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Prevent multiple rapid events
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Input pointer down - focusing');
    
    // Direct focus without complex state management
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleFocus = useCallback(() => {
    console.log('Input focused successfully');
  }, []);

  return (
    <div className="input-container-ios">
      <div className="input-wrapper-ios">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onPointerDown={handlePointerDown}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          className="input-textarea-ios"
          style={{
            direction: 'ltr',
            textAlign: 'left',
            fontSize: '16px',
            touchAction: 'manipulation',
            transform: 'translate3d(0,0,0)',
            WebkitTransform: 'translate3d(0,0,0)',
            WebkitUserSelect: 'text'
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
