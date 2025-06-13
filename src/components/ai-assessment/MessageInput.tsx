
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentMessage.trim() && !isLoading) {
        // Prevent default blur behavior
        (e.currentTarget as HTMLTextAreaElement).blur();
        onSendMessage();
        // Immediately refocus to keep keyboard open
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      }
    }
  };

  const handleSendClick = useCallback(() => {
    if (currentMessage.trim() && !isLoading) {
      onSendMessage();
      // Keep focus after click
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [onSendMessage, currentMessage, isLoading, textareaRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Maintain focus when component updates but not loading
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      // Only focus if no other element is focused or if we're not focused
      if (document.activeElement === document.body || document.activeElement === null) {
        textareaRef.current.focus();
      }
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
          placeholder={isHebrew ? "הקלד את התשובה שלך..." : "Type your response..."}
          disabled={isLoading}
          rows={2}
          className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 mobile-input"
          autoFocus
          onBlur={(e) => {
            // Prevent keyboard from closing on blur during send operation
            if (!isLoading) {
              setTimeout(() => {
                if (textareaRef.current && document.activeElement !== textareaRef.current) {
                  textareaRef.current.focus();
                }
              }, 10);
            }
          }}
        />
      </div>
      
      <Button
        onClick={handleSendClick}
        disabled={!currentMessage.trim() || isLoading}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 min-h-[44px] min-w-[44px] flex-shrink-0"
        size="icon"
        onMouseDown={(e) => {
          // Prevent focus loss when clicking button
          e.preventDefault();
        }}
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
