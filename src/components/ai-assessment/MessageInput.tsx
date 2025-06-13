
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
  const focusTimeoutRef = useRef<NodeJS.Timeout>();
  const focusIntervalRef = useRef<NodeJS.Timeout>();

  // Aggressive focus function that handles all mobile scenarios
  const maintainFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && document.activeElement !== textarea) {
      console.log('Restoring focus to textarea');
      textarea.focus();
      
      // For iOS Safari, ensure the keyboard stays visible
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        textarea.click();
        // Force cursor to end of text
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }
  }, [textareaRef]);

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
      console.log('Starting send operation, maintaining focus');
      setIsSending(true);
      
      // Store focus before sending
      const hadFocus = document.activeElement === textareaRef.current;
      
      // Call the send function
      onSendMessage();
      
      // Immediately start aggressive focus maintenance
      if (hadFocus) {
        // Multiple attempts at different intervals to ensure focus is maintained
        setTimeout(() => maintainFocus(), 10);
        setTimeout(() => maintainFocus(), 50);
        setTimeout(() => maintainFocus(), 100);
        setTimeout(() => maintainFocus(), 200);
        setTimeout(() => maintainFocus(), 500);
        
        // Start continuous focus checking
        focusIntervalRef.current = setInterval(() => {
          maintainFocus();
        }, 100);
        
        // Stop continuous checking after message is sent
        setTimeout(() => {
          if (focusIntervalRef.current) {
            clearInterval(focusIntervalRef.current);
          }
          setIsSending(false);
          console.log('Send operation complete, focus maintained');
        }, 1000);
      }
    }
  }, [onSendMessage, currentMessage, isLoading, isSending, maintainFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Prevent blur during critical operations
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    console.log('Blur event detected, preventing...');
    e.preventDefault();
    e.stopPropagation();
    
    // Immediately refocus
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    focusTimeoutRef.current = setTimeout(() => {
      maintainFocus();
    }, 10);
    
    return false;
  }, [maintainFocus]);

  // Enhanced focus maintenance on component mount and updates
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Initial focus
      maintainFocus();
      
      // Prevent any focus loss
      const handleFocusOut = (e: FocusEvent) => {
        if (e.target === textarea) {
          console.log('Focus out detected, preventing...');
          e.preventDefault();
          setTimeout(() => maintainFocus(), 10);
        }
      };
      
      textarea.addEventListener('focusout', handleFocusOut, true);
      
      return () => {
        textarea.removeEventListener('focusout', handleFocusOut, true);
      };
    }
  }, [maintainFocus]);

  // Maintain focus after loading state changes
  useEffect(() => {
    if (!isLoading && !isSending) {
      setTimeout(() => maintainFocus(), 100);
    }
  }, [isLoading, isSending, maintainFocus]);

  // Button handlers that prevent focus loss
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

  // Cleanup timeouts and intervals on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
    };
  }, []);

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
