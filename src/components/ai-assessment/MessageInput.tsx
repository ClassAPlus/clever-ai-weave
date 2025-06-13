
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
  const [shouldMaintainFocus, setShouldMaintainFocus] = useState(false);
  const focusTimeoutRef = useRef<NodeJS.Timeout>();

  // Force focus function that's more aggressive
  const forceFocus = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // For iOS, click to ensure keyboard stays
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        textareaRef.current.click();
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
      setIsSending(true);
      setShouldMaintainFocus(true);
      
      onSendMessage();
      
      // Immediately refocus and maintain focus aggressively
      setTimeout(() => {
        forceFocus();
        setIsSending(false);
        
        // Continue maintaining focus for a longer period
        setTimeout(() => {
          setShouldMaintainFocus(false);
        }, 2000);
      }, 50);
    }
  }, [onSendMessage, currentMessage, isLoading, isSending, forceFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  // Aggressive blur prevention
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Always prevent blur during active chat session
    e.preventDefault();
    e.stopPropagation();
    
    // Immediately refocus
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    focusTimeoutRef.current = setTimeout(() => {
      forceFocus();
    }, 10);
    
    return false;
  }, [forceFocus]);

  // Focus loss prevention - more comprehensive
  const handleFocusOut = useCallback((e: FocusEvent) => {
    // Prevent any focus loss from the textarea during chat
    if (e.target === textareaRef.current) {
      e.preventDefault();
      setTimeout(() => {
        forceFocus();
      }, 10);
    }
  }, [forceFocus]);

  // Window blur prevention
  const handleWindowBlur = useCallback((e: Event) => {
    e.preventDefault();
    setTimeout(() => {
      forceFocus();
    }, 100);
  }, [forceFocus]);

  // Set up aggressive focus maintenance
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Initial focus
      forceFocus();
      
      // Add focusout listener directly to the element
      textarea.addEventListener('focusout', handleFocusOut);
      
      return () => {
        textarea.removeEventListener('focusout', handleFocusOut);
      };
    }
  }, [handleFocusOut, forceFocus]);

  // Window event listeners
  useEffect(() => {
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [handleWindowBlur]);

  // Maintain focus during loading state changes
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        forceFocus();
      }, 100);
    }
  }, [isLoading, forceFocus]);

  // Continuous focus maintenance when needed
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (shouldMaintainFocus || isSending || isLoading) {
      intervalId = setInterval(() => {
        if (textareaRef.current && document.activeElement !== textareaRef.current) {
          forceFocus();
        }
      }, 200);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [shouldMaintainFocus, isSending, isLoading, forceFocus]);

  // Handle button clicks to maintain focus - separate handlers for different event types
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
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
