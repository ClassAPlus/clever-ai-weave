
import { forwardRef, useEffect } from "react";
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

  // Auto-focus and maintain focus for persistent keyboard on mobile
  useEffect(() => {
    if (isMobile && ref && 'current' in ref && ref.current) {
      // Focus the input to show keyboard initially
      ref.current.focus();
      
      // Prevent blur to maintain keyboard visibility
      const handleBlur = (e: FocusEvent) => {
        // Only allow blur if user is actually navigating away
        setTimeout(() => {
          if (ref.current && !isLoading) {
            ref.current.focus();
          }
        }, 100);
      };
      
      const inputElement = ref.current;
      inputElement.addEventListener('blur', handleBlur);
      
      return () => {
        inputElement.removeEventListener('blur', handleBlur);
      };
    }
  }, [isMobile, ref, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
      
      // Re-focus after sending message on mobile
      if (isMobile && ref && 'current' in ref && ref.current) {
        setTimeout(() => {
          ref.current?.focus();
        }, 100);
      }
    }
  };

  const handleSendClick = () => {
    onSendMessage();
    
    // Re-focus after sending message on mobile
    if (isMobile && ref && 'current' in ref && ref.current) {
      setTimeout(() => {
        ref.current?.focus();
      }, 100);
    }
  };

  return (
    <div className={`w-full flex ${isMobile ? 'gap-1' : 'gap-2'}`} style={{ boxSizing: 'border-box' }}>
      <div className="flex-1">
        <Textarea
          ref={ref}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          className={`w-full ${
            isMobile ? 'min-h-[50px] max-h-[120px]' : 'min-h-[70px] max-h-[140px]'
          } border-2 border-purple-200 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:ring-purple-400/20 rounded-xl resize-none shadow-lg transition-all duration-200`}
          style={{
            direction: 'ltr',
            textAlign: 'left',
            writingMode: 'horizontal-tb',
            unicodeBidi: 'isolate',
            boxSizing: 'border-box'
          }}
          dir="ltr"
          lang="en"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={isLoading}
          autoFocus={isMobile}
          rows={isMobile ? 2 : 3}
        />
      </div>
      
      <Button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isLoading}
        className={`bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white ${
          isMobile ? 'px-3 py-2' : 'px-6 py-3'
        } h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden flex-shrink-0`}
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
