
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

  // Handle initial load delay for iOS - shorter delay and better detection
  useEffect(() => {
    if (open) {
      setInitialLoad(true);
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 100); // Reduced from 200ms to 100ms
      return () => clearTimeout(timer);
    }
  }, [open]);

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Calculate dynamic heights with immediate keyboard consideration
  let containerHeight: string;
  let messagesHeight: string;
  
  // If keyboard is visible from the start, use keyboard-aware positioning immediately
  if (keyboardState.isVisible) {
    containerHeight = `${keyboardState.availableHeight}px`;
    messagesHeight = `${keyboardState.availableHeight - 160}px`;
  } else if (initialLoad && isIOS) {
    // For initial load without keyboard, use conservative positioning
    containerHeight = 'calc(100vh - 150px)';
    messagesHeight = 'calc(100vh - 350px)';
  } else {
    containerHeight = isIOS ? 'calc(100vh - env(safe-area-inset-bottom))' : '100vh';
    messagesHeight = isIOS ? 'calc(100vh - 200px - env(safe-area-inset-bottom))' : 'calc(100vh - 200px)';
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
