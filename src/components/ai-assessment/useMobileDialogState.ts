
import { useEffect, useState } from "react";

interface UseMobileDialogStateProps {
  open: boolean;
  keyboardState: {
    isVisible: boolean;
    height: number;
    availableHeight: number;
  };
}

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

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

  // Platform detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = isAndroid();
  
  // Full-screen approach - always use full viewport
  const containerHeight = '100vh';
  
  // Messages area height calculation accounting for header and input
  let messagesHeight: string;
  
  if (keyboardState.isVisible && keyboardState.height > 0) {
    if (android) {
      // Android: Use full available height minus header and input, keyboard is handled differently
      const headerHeight = 80;
      const inputHeight = 70;
      const safeAreaTop = 24;
      const availableHeight = window.innerHeight - headerHeight - inputHeight - safeAreaTop;
      messagesHeight = `${availableHeight}px`;
    } else if (isIOS) {
      // iOS: Account for visual viewport changes
      const headerHeight = 80;
      const inputHeight = 70;
      const safeAreaTop = 44;
      const availableHeight = keyboardState.availableHeight - headerHeight - inputHeight - safeAreaTop;
      messagesHeight = `${availableHeight}px`;
    } else {
      // Desktop/other: fallback
      messagesHeight = `calc(100vh - 150px)`;
    }
  } else {
    // When keyboard is hidden, use calc to subtract header and input heights
    if (android) {
      messagesHeight = `calc(100vh - 150px)`;
    } else if (isIOS) {
      const safeAreaBottom = 34; // Home indicator height
      messagesHeight = `calc(100vh - 150px - ${safeAreaBottom}px)`;
    } else {
      messagesHeight = `calc(100vh - 150px)`;
    }
  }

  console.log('Mobile Dialog State:', {
    initialLoad,
    containerHeight,
    messagesHeight,
    keyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    availableHeight: keyboardState.availableHeight,
    isIOS,
    android,
    platform: android ? 'Android' : isIOS ? 'iOS' : 'Other'
  });

  return {
    initialLoad,
    isIOS,
    containerHeight,
    messagesHeight
  };
};
