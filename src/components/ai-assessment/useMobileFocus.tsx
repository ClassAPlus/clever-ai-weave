
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
  const focusIntervalRef = useRef<NodeJS.Timeout>();
  const activeFocusTimeoutRef = useRef<NodeJS.Timeout>();

  const maintainMobileFocus = useCallback(() => {
    if (!isMobile || !textareaRef.current || !focusLockRef.current) return;
    
    console.log('Aggressively maintaining mobile focus during send');
    
    // Clear any existing timeout
    if (activeFocusTimeoutRef.current) {
      clearTimeout(activeFocusTimeoutRef.current);
    }
    
    // Force focus with different strategies
    const textarea = textareaRef.current;
    
    // Strategy 1: Direct focus
    textarea.focus({ preventScroll: true });
    
    // Strategy 2: Focus with selection
    if (textarea.value) {
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
    
    // Continue maintaining focus while locked (more frequent checks)
    if (focusLockRef.current) {
      activeFocusTimeoutRef.current = setTimeout(() => {
        maintainMobileFocus();
      }, 10); // Very frequent focus maintenance
    }
  }, [isMobile, textareaRef]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Prevent blur during any send operation or loading
    if (isSending || isLoading || focusLockRef.current) {
      console.log('Preventing blur during operation - restoring focus immediately');
      e.preventDefault();
      
      // Immediate focus restoration
      if (textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus({ preventScroll: true });
          }
        }, 1);
      }
      
      return false;
    }
  }, [textareaRef, isSending, isLoading]);

  const handleFocus = useCallback(() => {
    if (isMobile && (isSending || focusLockRef.current)) {
      console.log('Focus confirmed during send operation');
    }
  }, [isMobile, isSending]);

  const startFocusLock = useCallback(() => {
    console.log('Starting aggressive focus lock for mobile send');
    focusLockRef.current = true;
    
    if (isMobile) {
      // Start immediate and continuous focus maintenance
      maintainMobileFocus();
      
      // Also set up interval-based focus maintenance as backup
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
      
      focusIntervalRef.current = setInterval(() => {
        if (focusLockRef.current && textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
        }
      }, 50); // Backup focus every 50ms
    }
  }, [isMobile, maintainMobileFocus, textareaRef]);

  const releaseFocusLock = useCallback(() => {
    console.log('Releasing focus lock - performing final focus restoration');
    focusLockRef.current = false;
    
    // Clear all focus maintenance timers
    if (activeFocusTimeoutRef.current) {
      clearTimeout(activeFocusTimeoutRef.current);
    }
    
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
    }
    
    // Final focus restoration with multiple attempts
    if (isMobile && textareaRef.current) {
      const performFinalFocus = () => {
        if (textareaRef.current) {
          textareaRef.current.focus({ preventScroll: true });
          textareaRef.current.setSelectionRange(0, 0);
        }
      };
      
      performFinalFocus();
      setTimeout(performFinalFocus, 25);
      setTimeout(performFinalFocus, 100);
      setTimeout(performFinalFocus, 250);
    }
  }, [isMobile, textareaRef]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (activeFocusTimeoutRef.current) {
        clearTimeout(activeFocusTimeoutRef.current);
      }
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
    };
  }, []);

  // Initial focus on mount for mobile
  useEffect(() => {
    if (isMobile && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          focusTextarea(textareaRef.current);
        }
      }, 200);
    }
  }, [isMobile, textareaRef]);

  // Focus restoration when not loading/sending
  useEffect(() => {
    if (!isLoading && !isSending && !focusLockRef.current && isMobile) {
      setTimeout(() => {
        if (textareaRef.current) {
          focusTextarea(textareaRef.current);
        }
      }, 100);
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
