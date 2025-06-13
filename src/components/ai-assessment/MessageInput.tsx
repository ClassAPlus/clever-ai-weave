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

  // Auto-focus on mount for mobile
  useEffect(() => {
    if (isMobile && ref && 'current' in ref && ref.current) {
      setTimeout(() => {
        ref.current?.focus();
      }, 300);
    }
  }, [isMobile, ref]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent any default touch behavior that might interfere with focus
    if (ref && 'current' in ref && ref.current) {
      e.preventDefault();
      ref.current.focus();
    }
  }, [ref]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = () => {
    onSendMessage();
    // Keep focus on input after sending
    if (ref && 'current' in ref && ref.current) {
      setTimeout(() => {
        ref.current?.focus();
      }, 50);
    }
  };

  return (
    <div 
      className="w-full flex gap-3 p-4 bg-white"
      onTouchStart={handleTouchStart}
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
          className="w-full min-h-[48px] max-h-[80px] border-2 border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-400/20 rounded-xl resize-none shadow-sm transition-all duration-200"
          style={{
            direction: 'ltr',
            textAlign: 'left',
            fontSize: '16px', // Prevent zoom on iOS
            minHeight: '44px' // iOS touch target minimum
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
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-4 py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden flex-shrink-0 self-end"
        style={{
          minHeight: '44px', // iOS touch target minimum
          minWidth: '44px'
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
