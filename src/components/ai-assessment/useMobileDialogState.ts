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

  // Handle initial load delay
  useEffect(() => {
    if (open) {
      setInitialLoad(true);
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Simple iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Calculate heights - keep it simple
  let containerHeight: string;
  let messagesHeight: string;
  
  if (keyboardState.isVisible) {
    // When keyboard is visible, use available height
    containerHeight = `${keyboardState.availableHeight}px`;
    messagesHeight = `${keyboardState.availableHeight - 120}px`;
  } else {
    // When keyboard is not visible
    if (isIOS) {
      containerHeight = 'calc(100vh - env(safe-area-inset-bottom))';
      messagesHeight = 'calc(100vh - env(safe-area-inset-bottom) - 160px)';
    } else {
      containerHeight = '100vh';
      messagesHeight = 'calc(100vh - 160px)';
    }
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
