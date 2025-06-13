
import { useEffect, useState } from "react";

interface UseMobileDialogStateProps {
  open: boolean;
  keyboardState: {
    isVisible: boolean;
    height: number;
    availableHeight: number;
  };
}

export const useMobileDialogState = ({ open, keyboardState }: UseMobileDialogStateProps) => {
  const [initialLoad, setInitialLoad] = useState(true);

  // Handle initial load delay for iOS - very short delay
  useEffect(() => {
    if (open) {
      setInitialLoad(true);
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 50); // Very short delay to allow keyboard detection
      return () => clearTimeout(timer);
    }
  }, [open]);

  // iOS detection with better coverage
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
               /Safari/.test(navigator.userAgent);
  
  // Calculate dynamic heights - prioritize keyboard state
  let containerHeight: string;
  let messagesHeight: string;
  
  if (keyboardState.isVisible) {
    // Keyboard is visible - use available height immediately
    const safeHeight = Math.max(300, keyboardState.availableHeight);
    containerHeight = `${safeHeight}px`;
    messagesHeight = `${safeHeight - 140}px`; // Account for header and input
  } else if (isIOS) {
    // iOS without keyboard - use safe positioning
    containerHeight = 'calc(100vh - env(safe-area-inset-bottom) - 100px)';
    messagesHeight = 'calc(100vh - env(safe-area-inset-bottom) - 280px)';
  } else {
    // Non-iOS
    containerHeight = '100vh';
    messagesHeight = 'calc(100vh - 200px)';
  }

  console.log('Mobile Dialog State:', {
    initialLoad,
    keyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    availableHeight: keyboardState.availableHeight,
    containerHeight,
    messagesHeight,
    isIOS
  });

  return {
    initialLoad,
    isIOS,
    containerHeight,
    messagesHeight
  };
};
