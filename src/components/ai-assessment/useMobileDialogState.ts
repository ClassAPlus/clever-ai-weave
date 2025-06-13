
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
  
  // Use actual keyboard detection for positioning
  let containerHeight: string;
  let messagesHeight: string;
  let translateY: string;
  
  if (keyboardState.isVisible && keyboardState.height > 0) {
    // Position directly above keyboard using detected height
    const safeAreaBottom = isIOS ? 20 : 0; // Account for home indicator
    const bottomOffset = keyboardState.height + safeAreaBottom;
    containerHeight = '60vh';
    messagesHeight = 'calc(60vh - 140px)';
    translateY = `-${bottomOffset}px`;
  } else {
    // Fallback positioning when keyboard not detected
    containerHeight = isIOS ? '60vh' : '50vh';
    messagesHeight = isIOS ? 'calc(60vh - 140px)' : 'calc(50vh - 140px)';
    translateY = isIOS ? '-40vh' : '-50vh';
  }

  console.log('Mobile Dialog State (using keyboard detection):', {
    initialLoad,
    containerHeight,
    messagesHeight,
    translateY,
    keyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    isIOS
  });

  return {
    initialLoad,
    isIOS,
    containerHeight,
    messagesHeight,
    translateY
  };
};
