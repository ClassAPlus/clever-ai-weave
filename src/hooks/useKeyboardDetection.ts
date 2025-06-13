
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
    availableHeight: window.innerHeight * 0.6 // Fixed 60% of screen height
  });

  useEffect(() => {
    const iOS = isIOS();
    
    // For iOS, use a fixed height approach to prevent jumping
    if (iOS) {
      // Set a fixed container height that works well with keyboard
      const fixedHeight = Math.min(window.innerHeight * 0.6, 400);
      
      setKeyboardState({
        isVisible: true, // Always consider keyboard "visible" on iOS mobile
        height: window.innerHeight * 0.4, // Assume standard keyboard height
        availableHeight: fixedHeight
      });
      
      return () => {}; // No cleanup needed for fixed approach
    }

    // For non-iOS devices, use simpler detection
    let initialHeight = window.innerHeight;
    
    const updateKeyboardState = () => {
      const currentHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, initialHeight - currentHeight);
      const isKeyboardVisible = keyboardHeight > 50;
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: isKeyboardVisible 
          ? Math.max(currentHeight - 60, 200)
          : currentHeight - 60
      });
    };

    const handleFocus = () => {
      setTimeout(updateKeyboardState, 100);
    };

    const handleBlur = () => {
      setTimeout(() => {
        setKeyboardState({
          isVisible: false,
          height: 0,
          availableHeight: window.innerHeight - 60
        });
      }, 100);
    };

    // Event listeners for non-iOS devices
    window.addEventListener('resize', updateKeyboardState);
    
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
      inputElement.addEventListener('blur', handleBlur);
    }

    updateKeyboardState();

    return () => {
      window.removeEventListener('resize', updateKeyboardState);
      
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
        inputElement.removeEventListener('blur', handleBlur);
      }
    };
  }, [inputRef]);

  return keyboardState;
};
