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
      // Android: Use window.visualViewport.height when keyboard is visible,
      // minus header, but don't subtract input/footer since input is out of view.
      const headerHeight = 80;
      const safeAreaTop = 24;
      // Let messagesHeight fill visible area except for the header.
      const availableHeight = (window.visualViewport?.height || window.innerHeight) - headerHeight - safeAreaTop;
      messagesHeight = `${availableHeight}px`;
    } else if (isIOS) {
      // iOS: add extra padding to avoid cutoff by input, especially summary/footer
      // This helps when the keyboard is transitioning or about to close/open
      const headerHeight = 80;
      const safeAreaTop = 44;
      const safeAreaBottom = 34; // typical iOS bottom inset
      const inputArea = 84; // estimate for input+extra buffer
      // use maximum between keyboardState.availableHeight and visualViewport, in case of transition/jump
      const viewportHeight = Math.max(
        keyboardState.availableHeight,
        window.visualViewport?.height || 0
      );
      const buffer = 24;
      // When keyboard is visible, remove header/top/bottom, keep input floating above keyboard
      const availableHeight = viewportHeight - headerHeight - safeAreaTop - buffer;
      messagesHeight = `${availableHeight}px`;
    } else {
      // Desktop/other: fallback
      messagesHeight = `calc(100vh - 150px)`;
    }
  } else {
    // When keyboard is hidden, ensure there's enough space for possible summary and input
    // Add good buffer for iOS summary to never be cut off (esp. with safe area bottom)
    if (isIOS) {
      messagesHeight = "calc(100vh - 180px)";
    } else {
      messagesHeight = "calc(100vh - 120px)";
    }
  }

  // Make sure messagesHeight is never negative/silly
  try {
    const px = Number(messagesHeight.replace("px", ""));
    if (!isNaN(px) && px < 120) {
      messagesHeight = "120px";
    }
  } catch {}

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
