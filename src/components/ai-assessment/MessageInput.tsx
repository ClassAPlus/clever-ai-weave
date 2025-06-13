
import { forwardRef, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Sparkles } from "lucide-react";
import { useMobileFocus } from "./useMobileFocus";
import { useSendHandler } from "./useSendHandler";

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
  
  const mobileFocus = useMobileFocus({
    textareaRef,
    isLoading,
    isSending: false
  });

  const sendHandler = useSendHandler({
    currentMessage,
    isLoading,
    onSendMessage,
    setCurrentMessage,
    textareaRef,
    startFocusLock: mobileFocus.startFocusLock,
    releaseFocusLock: mobileFocus.releaseFocusLock,
    isMobile: mobileFocus.isMobile
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
  };

  return (
    <div className="flex gap-3 items-end w-full">
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={currentMessage}
          onChange={handleInputChange}
          onKeyPress={sendHandler.handleKeyPress}
          onBlur={mobileFocus.handleBlur}
          onFocus={mobileFocus.handleFocus}
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
        onClick={sendHandler.handleButtonClick}
        disabled={!currentMessage.trim() || isLoading || sendHandler.isSending}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 min-h-[44px] min-w-[44px] flex-shrink-0"
        size="icon"
        type="button"
      >
        {isLoading || sendHandler.isSending ? (
          <Sparkles size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </Button>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
