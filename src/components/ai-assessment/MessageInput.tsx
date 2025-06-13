
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
  const sendInProgressRef = useRef(false);

  // Mobile-optimized focus function
  const maintainFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && document.activeElement !== textarea) {
      console.log('Restoring focus to textarea');
      
      // For mobile devices, use a more aggressive approach
      textarea.focus({ preventScroll: true });
      
      // Force cursor to end and ensure keyboard visibility
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
      
      // Trigger input event to ensure keyboard stays visible
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
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
    if (currentMessage.trim() && !isLoading && !isSending && !sendInProgressRef.current) {
      console.log('Starting send operation, maintaining focus');
      setIsSending(true);
      sendInProgressRef.current = true;
      
      // Store the current focus state
      const textarea = textareaRef.current;
      const hadFocus = document.activeElement === textarea;
      
      // Clear the message first to give immediate feedback
      const messageToSend = currentMessage;
      setCurrentMessage("");
      
      // Call the send function
      onSendMessage();
      
      // For mobile, immediately refocus and maintain keyboard
      if (hadFocus && textarea) {
        // Multiple immediate attempts to maintain focus
        requestAnimationFrame(() => {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(0, 0);
        });
        
        setTimeout(() => {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(0, 0);
        }, 10);
        
        setTimeout(() => {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(0, 0);
        }, 50);
        
        setTimeout(() => {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(0, 0);
        }, 100);
      }
      
      // Reset sending state
      setTimeout(() => {
        setIsSending(false);
        sendInProgressRef.current = false;
        maintainFocus();
      }, 200);
    }
  }, [onSendMessage, currentMessage, isLoading, isSending, maintainFocus, setCurrentMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Prevent blur only during send operations
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (sendInProgressRef.current || isSending) {
      console.log('Preventing blur during send operation');
      e.preventDefault();
      e.stopPropagation();
      
      // Immediately refocus
      requestAnimationFrame(() => {
        maintainFocus();
      });
      
      return false;
    }
  }, [maintainFocus, isSending]);

  // Initial focus setup
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Initial focus with delay to ensure rendering is complete
      setTimeout(() => {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(0, 0);
      }, 100);
    }
  }, []);

  // Maintain focus after loading state changes
  useEffect(() => {
    if (!isLoading && !isSending && !sendInProgressRef.current) {
      setTimeout(() => maintainFocus(), 50);
    }
  }, [isLoading, isSending, maintainFocus]);

  // Optimized button handlers for mobile
  const handleButtonInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure textarea stays focused during button interaction
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus({ preventScroll: true });
    }
    
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
          className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          style={{
            WebkitUserSelect: 'text',
            WebkitTouchCallout: 'default',
            touchAction: 'manipulation'
          }}
        />
      </div>
      
      <Button
        onMouseDown={handleButtonInteraction}
        onTouchStart={handleButtonInteraction}
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
