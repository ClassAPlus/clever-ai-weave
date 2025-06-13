
import { useCallback, useRef, useEffect } from "react";
import { isMobileDevice, focusTextarea } from "./mobileUtils";

interface UseMobileFocusProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isLoading: boolean;
  isSending: boolean;
}

export const useMobileFocus = ({ textareaRef, isLoading, isSending }: UseMobileFocusProps) => {
  const isMobile = isMobileDevice();
  const focusLockRef = useRef(false);
  const sendingRef = useRef(false);
  const focusTimeoutRef = useRef<NodeJS.Timeout>();

  const maintainMobileFocus = useCallback(() => {
    if (!isMobile || !textareaRef.current) return;
    
    console.log('Maintaining mobile focus - forcing focus');
    
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    focusTextarea(textareaRef.current, true);
    
    if (sendingRef.current || focusLockRef.current) {
      focusTimeoutRef.current = setTimeout(() => {
        maintainMobileFocus();
      }, 16);
    }
  }, [isMobile, textareaRef]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (sendingRef.current || focusLockRef.current) {
      console.log('Preventing blur during send operation');
      e.preventDefault();
      
      if (textareaRef.current) {
        focusTextarea(textareaRef.current);
      }
      
      return false;
    }
  }, [textareaRef]);

  const handleFocus = useCallback(() => {
    if (isMobile && (sendingRef.current || focusLockRef.current)) {
      console.log('Focus restored during send operation');
    }
  }, [isMobile]);

  const startFocusLock = useCallback(() => {
    sendingRef.current = true;
    focusLockRef.current = true;
    
    if (isMobile) {
      maintainMobileFocus();
    }
  }, [isMobile, maintainMobileFocus]);

  const releaseFocusLock = useCallback(() => {
    setTimeout(() => {
      sendingRef.current = false;
      
      if (isMobile && textareaRef.current) {
        focusTextarea(textareaRef.current);
      }
    }, 300);
    
    setTimeout(() => {
      focusLockRef.current = false;
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    }, 400);
  }, [isMobile, textareaRef]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobile && textareaRef.current) {
      setTimeout(() => {
        focusTextarea(textareaRef.current);
      }, 100);
    }
  }, [isMobile, textareaRef]);

  useEffect(() => {
    if (!isLoading && !isSending && !sendingRef.current && isMobile) {
      setTimeout(() => {
        focusTextarea(textareaRef.current);
      }, 50);
    }
  }, [isLoading, isSending, isMobile, textareaRef]);

  return {
    handleBlur,
    handleFocus,
    startFocusLock,
    releaseFocusLock,
    isMobile
  };
};
