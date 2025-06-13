
import { useCallback, useState } from "react";
import { focusTextarea } from "./mobileUtils";

interface UseSendHandlerProps {
  currentMessage: string;
  isLoading: boolean;
  onSendMessage: () => void;
  setCurrentMessage: (message: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  startFocusLock: () => void;
  releaseFocusLock: () => void;
  isMobile: boolean;
}

export const useSendHandler = ({
  currentMessage,
  isLoading,
  onSendMessage,
  setCurrentMessage,
  textareaRef,
  startFocusLock,
  releaseFocusLock,
  isMobile
}: UseSendHandlerProps) => {
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(() => {
    if (!currentMessage.trim() || isLoading || isSending) {
      return;
    }

    console.log('Starting enhanced mobile send operation');
    
    setIsSending(true);
    startFocusLock();
    
    onSendMessage();
    
    setTimeout(() => {
      console.log('Clearing message after delay');
      setCurrentMessage("");
      
      if (isMobile && textareaRef.current) {
        focusTextarea(textareaRef.current, true);
      }
    }, 100);
    
    setTimeout(() => {
      setIsSending(false);
    }, 200);
    
    releaseFocusLock();
  }, [currentMessage, isLoading, isSending, onSendMessage, setCurrentMessage, startFocusLock, releaseFocusLock, isMobile, textareaRef]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button clicked - executing send');
    
    if (isMobile && textareaRef.current) {
      focusTextarea(textareaRef.current);
    }
    
    handleSend();
  }, [handleSend, isMobile, textareaRef]);

  return {
    isSending,
    handleSend,
    handleKeyPress,
    handleButtonClick
  };
};
