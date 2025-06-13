
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
  
  // Full-screen approach - always use full viewport
  const containerHeight = '100vh';
  
  // Messages area height calculation accounting for header and input
  let messagesHeight: string;
  
  if (keyboardState.isVisible && keyboardState.height > 0) {
    // When keyboard is visible, adjust messages height to account for it
    const headerHeight = 80; // Approximate header height
    const inputHeight = 70; // Approximate input area height
    const safeAreaTop = isIOS ? 44 : 24; // Status bar height
    const availableHeight = keyboardState.availableHeight - headerHeight - inputHeight - safeAreaTop;
    messagesHeight = `${availableHeight}px`;
  } else {
    // When keyboard is hidden, use calc to subtract header and input heights
    const safeAreaBottom = isIOS ? 34 : 0; // Home indicator height
    messagesHeight = `calc(100vh - 150px - ${safeAreaBottom}px)`;
  }

  console.log('Mobile Dialog State (full-screen):', {
    initialLoad,
    containerHeight,
    messagesHeight,
    keyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    availableHeight: keyboardState.availableHeight,
    isIOS
  });

  return {
    initialLoad,
    isIOS,
    containerHeight,
    messagesHeight
  };
};
