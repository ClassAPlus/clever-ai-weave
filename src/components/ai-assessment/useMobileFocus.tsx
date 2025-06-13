
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
  const focusTimeoutRef = useRef<NodeJS.Timeout>();

  const maintainMobileFocus = useCallback(() => {
    if (!isMobile || !textareaRef.current || !focusLockRef.current) return;
    
    console.log('Maintaining mobile focus - forcing focus');
    
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    focusTextarea(textareaRef.current, true);
    
    // Continue maintaining focus while locked
    if (focusLockRef.current) {
      focusTimeoutRef.current = setTimeout(() => {
        maintainMobileFocus();
      }, 16);
    }
  }, [isMobile, textareaRef]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (isSending || focusLockRef.current) {
      console.log('Preventing blur during send operation');
      e.preventDefault();
      
      if (textareaRef.current) {
        setTimeout(() => {
          focusTextarea(textareaRef.current);
        }, 10);
      }
      
      return false;
    }
  }, [textareaRef, isSending]);

  const handleFocus = useCallback(() => {
    if (isMobile && (isSending || focusLockRef.current)) {
      console.log('Focus restored during send operation');
    }
  }, [isMobile, isSending]);

  const startFocusLock = useCallback(() => {
    console.log('Starting focus lock');
    focusLockRef.current = true;
    
    if (isMobile) {
      maintainMobileFocus();
    }
  }, [isMobile, maintainMobileFocus]);

  const releaseFocusLock = useCallback(() => {
    console.log('Releasing focus lock');
    focusLockRef.current = false;
    
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Final focus restoration
    if (isMobile && textareaRef.current) {
      setTimeout(() => {
        focusTextarea(textareaRef.current);
      }, 50);
    }
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
    if (!isLoading && !isSending && !focusLockRef.current && isMobile) {
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
