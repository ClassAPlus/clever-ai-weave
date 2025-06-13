
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
    availableHeight: window.innerHeight - 60
  });

  useEffect(() => {
    let initialHeight = window.innerHeight;
    let initialVisualViewportHeight = window.visualViewport?.height || window.innerHeight;
    const iOS = isIOS();
    let updateTimeout: NodeJS.Timeout;

    const updateKeyboardState = () => {
      const currentHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || currentHeight;
      
      // Simple keyboard detection
      const keyboardHeight = window.visualViewport 
        ? Math.max(0, initialVisualViewportHeight - visualViewportHeight)
        : Math.max(0, initialHeight - currentHeight);
      
      const isKeyboardVisible = keyboardHeight > 50;
      
      let availableHeight;
      
      if (iOS && isKeyboardVisible) {
        // Much simpler iOS calculation - just use 60% of visual viewport
        availableHeight = Math.max(Math.floor(visualViewportHeight * 0.6), 120);
        // Cap the height to prevent over-jumping
        availableHeight = Math.min(availableHeight, 400);
      } else {
        // Standard calculation for Android or no keyboard
        availableHeight = isKeyboardVisible 
          ? Math.max(visualViewportHeight - 60, 200)
          : currentHeight - 60;
      }

      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: Math.max(0, keyboardHeight),
        availableHeight
      });
    };

    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      // Shorter timeout for faster response
      updateTimeout = setTimeout(updateKeyboardState, iOS ? 50 : 30);
    };

    const handleFocus = () => {
      // Much shorter delay for iOS
      const delay = iOS ? 50 : 30;
      setTimeout(updateKeyboardState, delay);
    };

    const handleBlur = () => {
      const delay = iOS ? 50 : 30;
      setTimeout(() => {
        setKeyboardState({
          isVisible: false,
          height: 0,
          availableHeight: window.innerHeight - 60
        });
      }, delay);
    };

    // Event listeners
    window.addEventListener('resize', debouncedUpdate);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedUpdate);
    }

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
      inputElement.addEventListener('blur', handleBlur);
    }

    updateKeyboardState();

    return () => {
      clearTimeout(updateTimeout);
      window.removeEventListener('resize', debouncedUpdate);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdate);
      }
      
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
        inputElement.removeEventListener('blur', handleBlur);
      }
    };
  }, [inputRef]);

  return keyboardState;
};
