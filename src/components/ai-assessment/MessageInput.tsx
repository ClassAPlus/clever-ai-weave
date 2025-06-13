
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
  const sendOperationRef = useRef(false);
  const focusLockRef = useRef(false);
  const messageToSendRef = useRef<string>("");

  // Detect mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Aggressive focus maintenance for mobile
  const maintainMobileFocus = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isMobile) return;

    console.log('Maintaining mobile focus');
    
    // Use requestAnimationFrame for better timing
    const focusAttempt = () => {
      if (textarea && (sendOperationRef.current || focusLockRef.current)) {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(0, 0);
        
        // Continue monitoring during send operation
        if (sendOperationRef.current) {
          requestAnimationFrame(focusAttempt);
        }
      }
    };
    
    focusAttempt();
  }, [isMobile]);

  // Comprehensive blur prevention during send
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (sendOperationRef.current || focusLockRef.current) {
      console.log('Preventing blur during send operation');
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // Immediate refocus
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
        }
      }, 0);
      
      return false;
    }
  }, []);

  // Enhanced send function with focus preservation
  const handleSend = useCallback(() => {
    if (!currentMessage.trim() || isLoading || isSending || sendOperationRef.current) {
      return;
    }

    console.log('Starting enhanced send operation');
    
    // Lock the send operation and focus
    sendOperationRef.current = true;
    focusLockRef.current = true;
    setIsSending(true);
    
    // Store message before clearing
    messageToSendRef.current = currentMessage;
    
    // For mobile: start aggressive focus maintenance immediately
    if (isMobile) {
      maintainMobileFocus();
    }
    
    // Execute the actual send - but delay clearing input
    onSendMessage();
    
    // Clear input after a short delay to allow focus to stabilize
    setTimeout(() => {
      setCurrentMessage("");
      
      // Continue focus maintenance after clearing
      if (isMobile) {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(0, 0);
        }
      }
    }, 50);
    
    // Reset states with staggered timing
    setTimeout(() => {
      setIsSending(false);
    }, 100);
    
    setTimeout(() => {
      sendOperationRef.current = false;
      
      // Final focus restoration
      if (isMobile && textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
        textareaRef.current.setSelectionRange(0, 0);
      }
    }, 150);
    
    setTimeout(() => {
      focusLockRef.current = false;
    }, 200);

  }, [currentMessage, isLoading, isSending, onSendMessage, setCurrentMessage, isMobile, maintainMobileFocus]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Enhanced button click handler
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button clicked - maintaining focus');
    
    // Ensure textarea maintains focus during button interaction
    if (isMobile && textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
    }
    
    handleSend();
  }, [handleSend, isMobile]);

  // Initial focus setup
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && isMobile) {
      setTimeout(() => {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(0, 0);
      }, 100);
    }
  }, [isMobile]);

  // Focus restoration after loading changes
  useEffect(() => {
    if (!isLoading && !isSending && !sendOperationRef.current && isMobile) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
        }
      }, 50);
    }
  }, [isLoading, isSending, isMobile]);

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
        onClick={handleButtonClick}
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
