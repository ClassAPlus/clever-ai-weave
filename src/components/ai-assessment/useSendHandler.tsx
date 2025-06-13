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
  const [pendingClear, setPendingClear] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleSend = useCallback(async (startFocusLock?: () => void, releaseFocusLock?: () => void) => {
    if (!currentMessage.trim() || isLoading || isSending) {
      return;
    }

    console.log('Starting mobile-optimized send operation');
    
    setIsSending(true);
    setPendingClear(true);
    
    // Start focus lock immediately before any changes
    if (isMobile && startFocusLock) {
      startFocusLock();
      console.log('Focus lock started for mobile send');
    }
    
    // Select all text instead of clearing (keeps keyboard open)
    if (isMobile && textareaRef.current) {
      textareaRef.current.select();
      console.log('Text selected for mobile keyboard retention');
    }
    
    // Send the message
    onSendMessage();
    
    // Wait for API response and UI to settle before clearing
    setTimeout(() => {
      console.log('Clearing message after API response');
      
      // Now we can safely clear the message
      setCurrentMessage("");
      setPendingClear(false);
      
      // Restore focus on mobile
      if (isMobile && textareaRef.current) {
        // Multiple focus attempts with different timings
        focusTextarea(textareaRef.current, true);
        
        setTimeout(() => {
          if (textareaRef.current) {
            focusTextarea(textareaRef.current, true);
          }
        }, 50);
        
        setTimeout(() => {
          if (textareaRef.current) {
            focusTextarea(textareaRef.current, false);
          }
        }, 150);
      }
      
      // End the sending state
      setIsSending(false);
      
      // Release focus lock after everything is complete
      if (isMobile && releaseFocusLock) {
        setTimeout(() => {
          console.log('Releasing focus lock after complete operation');
          releaseFocusLock();
        }, 200);
      }
    }, 500); // Increased delay to allow API response
    
  }, [currentMessage, isLoading, isSending, onSendMessage, setCurrentMessage, isMobile, textareaRef]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // For mobile, we need to maintain focus through the key event
      if (isMobile && textareaRef.current) {
        textareaRef.current.focus();
      }
      
      handleSend();
    }
  }, [handleSend, isMobile, textareaRef]);

  const handleButtonClick = useCallback((e: React.MouseEvent, startFocusLock?: () => void, releaseFocusLock?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Button clicked - maintaining focus for mobile');
    
    // Ensure focus before sending
    if (isMobile && textareaRef.current) {
      textareaRef.current.focus();
    }
    
    handleSend(startFocusLock, releaseFocusLock);
  }, [handleSend, isMobile, textareaRef]);

  return {
    isSending,
    pendingClear,
    handleSend,
    handleKeyPress,
    handleButtonClick
  };
};
