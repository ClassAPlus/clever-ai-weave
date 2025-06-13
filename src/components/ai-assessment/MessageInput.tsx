
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

  // Simple initial focus for mobile, then let iOS handle keyboard naturally
  useEffect(() => {
    if (isMobile && ref && 'current' in ref && ref.current) {
      // Only focus initially, then let user control keyboard
      setTimeout(() => {
        ref.current?.focus();
      }, 300);
    }
  }, [isMobile, ref]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleSendClick = () => {
    onSendMessage();
  };

  return (
    <div className="w-full flex gap-2 p-2">
      <div className="flex-1">
        <Textarea
          ref={ref}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          className="w-full min-h-[50px] max-h-[80px] border-2 border-purple-200 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:ring-purple-400/20 rounded-xl resize-none shadow-lg transition-all duration-200"
          style={{
            direction: 'ltr',
            textAlign: 'left'
          }}
          dir="ltr"
          lang="en"
          inputMode="text"
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
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-4 py-2 h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden flex-shrink-0"
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
