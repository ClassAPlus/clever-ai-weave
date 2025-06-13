import { forwardRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardPersistent, setKeyboardPersistent] = useState(false);

  // Auto-focus and maintain focus for persistent keyboard
  useEffect(() => {
    if (isMobile && ref && 'current' in ref && ref.current) {
      // Initial focus
      setTimeout(() => {
        ref.current?.focus();
        setKeyboardPersistent(true);
      }, 300);
    }
  }, [isMobile, ref]);

  // Refocus after sending message to keep keyboard open
  useEffect(() => {
    if (!isLoading && keyboardPersistent && ref && 'current' in ref && ref.current) {
      setTimeout(() => {
        ref.current?.focus();
      }, 100);
    }
  }, [isLoading, keyboardPersistent, ref]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setKeyboardPersistent(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Prevent accidental blur - refocus if not intentional
    if (keyboardPersistent && !isLoading) {
      setTimeout(() => {
        if (ref && 'current' in ref && ref.current && document.activeElement !== ref.current) {
          ref.current.focus();
        }
      }, 100);
    }
    setIsFocused(false);
  }, [keyboardPersistent, isLoading, ref]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent iOS from dismissing keyboard on touch
    if (isMobile && keyboardPersistent) {
      e.preventDefault();
      if (ref && 'current' in ref && ref.current) {
        ref.current.focus();
      }
    }
  }, [isMobile, keyboardPersistent, ref]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = () => {
    onSendMessage();
  };

  const handleContainerClick = useCallback(() => {
    // Focus input when clicking anywhere in the input area
    if (ref && 'current' in ref && ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  return (
    <div 
      className="w-full flex gap-2 p-2 bg-white border-t border-gray-100"
      onClick={handleContainerClick}
      onTouchStart={handleTouchStart}
      data-keyboard-persistent={keyboardPersistent}
    >
      <div className="flex-1">
        <Textarea
          ref={ref}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          className="w-full min-h-[50px] max-h-[80px] border-2 border-purple-200 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:ring-purple-400/20 rounded-xl resize-none shadow-lg transition-all duration-200"
          style={{
            direction: 'ltr',
            textAlign: 'left'
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
          readOnly={isLoading}
          rows={2}
        />
      </div>
      
      <Button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isLoading}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-4 py-2 h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden flex-shrink-0"
        onTouchStart={(e) => e.stopPropagation()}
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
