
import { useCallback, useState } from "react";
import { focusTextarea } from "./mobileUtils";

interface UseSendHandlerProps {
  currentMessage: string;
  isLoading: boolean;
  onSendMessage: () => void;
  setCurrentMessage: (message: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const useSendHandler = ({
  currentMessage,
  isLoading,
  onSendMessage,
  setCurrentMessage,
  textareaRef
}: UseSendHandlerProps) => {
  const [isSending, setIsSending] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleSend = useCallback(async (startFocusLock?: () => void, releaseFocusLock?: () => void) => {
    if (!currentMessage.trim() || isLoading || isSending) {
      return;
    }

    console.log('Starting enhanced mobile send operation');
    
    setIsSending(true);
    
    // Start focus lock for mobile
    if (isMobile && startFocusLock) {
      startFocusLock();
    }
    
    // Send the message but don't clear immediately
    onSendMessage();
    
    // Wait for the API call to settle, then clear and restore focus
    setTimeout(() => {
      console.log('Clearing message and restoring focus');
      setCurrentMessage("");
      
      // Restore focus on mobile after clearing
      if (isMobile && textareaRef.current) {
        focusTextarea(textareaRef.current, true);
      }
      
      // End the sending state
      setIsSending(false);
      
      // Release focus lock after everything is done
      if (isMobile && releaseFocusLock) {
        setTimeout(() => {
          releaseFocusLock();
        }, 100);
      }
    }, 150);
    
  }, [currentMessage, isLoading, isSending, onSendMessage, setCurrentMessage, isMobile, textareaRef]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleButtonClick = useCallback((e: React.MouseEvent, startFocusLock?: () => void, releaseFocusLock?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button clicked - executing send');
    
    if (isMobile && textareaRef.current) {
      focusTextarea(textareaRef.current);
    }
    
    handleSend(startFocusLock, releaseFocusLock);
  }, [handleSend, isMobile, textareaRef]);

  return {
    isSending,
    handleSend,
    handleKeyPress,
    handleButtonClick
  };
};
