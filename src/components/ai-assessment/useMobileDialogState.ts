
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
  
  // Always assume keyboard is open on mobile - position UI in the top portion
  let containerHeight: string;
  let messagesHeight: string;
  
  if (isIOS) {
    // On iOS, assume keyboard takes bottom ~40% of screen, use top 60%
    containerHeight = '60vh';
    messagesHeight = 'calc(60vh - 140px)';
  } else {
    // On Android, assume keyboard takes bottom ~50% of screen, use top 50%
    containerHeight = '50vh';
    messagesHeight = 'calc(50vh - 140px)';
  }

  console.log('Mobile Dialog State (keyboard assumed open):', {
    initialLoad,
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
