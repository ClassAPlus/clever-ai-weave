
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
  
  // Mobile-specific focus management
  const focusLockRef = useRef(false);
  const sendingRef = useRef(false);
  const focusTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Aggressive mobile focus maintenance
  const maintainMobileFocus = useCallback(() => {
    if (!isMobile || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    console.log('Maintaining mobile focus - forcing focus');
    
    // Clear any existing timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Immediate focus
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    // Continue focusing if we're in send mode
    if (sendingRef.current || focusLockRef.current) {
      focusTimeoutRef.current = setTimeout(() => {
        maintainMobileFocus();
      }, 16); // ~60fps
    }
  }, [isMobile]);

  // Enhanced blur prevention
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (sendingRef.current || focusLockRef.current) {
      console.log('Preventing blur during send operation');
      e.preventDefault();
      
      // Immediate refocus without any delay
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
      
      return false;
    }
  }, []);

  // Focus event handler to maintain focus during send
  const handleFocus = useCallback(() => {
    if (isMobile && (sendingRef.current || focusLockRef.current)) {
      console.log('Focus restored during send operation');
    }
  }, [isMobile]);

  // Enhanced send with persistent focus
  const handleSend = useCallback(() => {
    if (!currentMessage.trim() || isLoading || isSending || sendingRef.current) {
      return;
    }

    console.log('Starting enhanced mobile send operation');
    
    // Lock everything
    sendingRef.current = true;
    focusLockRef.current = true;
    setIsSending(true);
    
    // Start aggressive focus maintenance for mobile
    if (isMobile) {
      maintainMobileFocus();
    }
    
    // Execute send immediately
    onSendMessage();
    
    // Don't clear the message immediately - wait a bit for focus to stabilize
    setTimeout(() => {
      console.log('Clearing message after delay');
      setCurrentMessage("");
      
      // Continue focus maintenance after clearing
      if (isMobile) {
        maintainMobileFocus();
      }
    }, 100);
    
    // Release locks gradually
    setTimeout(() => {
      setIsSending(false);
    }, 200);
    
    setTimeout(() => {
      sendingRef.current = false;
      
      // Final focus restoration
      if (isMobile && textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
        textareaRef.current.setSelectionRange(0, 0);
      }
    }, 300);
    
    setTimeout(() => {
      focusLockRef.current = false;
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    }, 400);

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

  // Mobile-optimized button click
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button clicked - executing send');
    
    // Pre-focus for mobile before send
    if (isMobile && textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
    }
    
    handleSend();
  }, [handleSend, isMobile]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // Initial mobile focus
  useEffect(() => {
    if (isMobile && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
        }
      }, 100);
    }
  }, [isMobile]);

  // Focus restoration after loading
  useEffect(() => {
    if (!isLoading && !isSending && !sendingRef.current && isMobile) {
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
          onFocus={handleFocus}
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
