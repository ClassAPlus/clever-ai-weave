
import { useState, useEffect, RefObject } from 'react';

interface KeyboardState {
  isVisible: boolean;
  height: number;
  availableHeight: number;
}

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const useKeyboardDetection = (inputRef: RefObject<HTMLElement>) => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    availableHeight: 350 // Fixed height for consistency
  });

  useEffect(() => {
    const iOS = isIOS();
    
    // For iOS, use completely fixed dimensions to prevent jumping
    if (iOS) {
      setKeyboardState({
        isVisible: true,
        height: 280, // Standard iOS keyboard height
        availableHeight: 350 // Fixed container height
      });
      
      return () => {}; // No event listeners needed for fixed approach
    }

    // For non-iOS devices, use simple detection without dynamic adjustments
    const initialHeight = window.innerHeight;
    
    const updateKeyboardState = () => {
      const currentHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, initialHeight - currentHeight);
      const isKeyboardVisible = keyboardHeight > 50;
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: isKeyboardVisible ? 350 : currentHeight - 60
      });
    };

    window.addEventListener('resize', updateKeyboardState);
    updateKeyboardState();

    return () => {
      window.removeEventListener('resize', updateKeyboardState);
    };
  }, []);

  return keyboardState;
};
