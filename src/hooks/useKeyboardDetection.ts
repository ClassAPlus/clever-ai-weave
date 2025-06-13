
import { useState, useEffect, RefObject, useCallback } from 'react';

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
    availableHeight: window.innerHeight
  });

  const updateKeyboardState = useCallback(() => {
    const iOS = isIOS();
    
    if (iOS && 'visualViewport' in window && window.visualViewport) {
      // Use Visual Viewport API for iOS
      const viewport = window.visualViewport!;
      const currentHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, currentHeight - viewport.height);
      const isKeyboardVisible = keyboardHeight > 50;
      
      console.log('iOS Keyboard Detection:', {
        windowHeight: currentHeight,
        viewportHeight: viewport.height,
        keyboardHeight,
        isKeyboardVisible
      });
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: viewport.height
      });
    } else {
      // Fallback for other platforms or older iOS
      const currentHeight = window.innerHeight;
      const isKeyboardVisible = currentHeight < window.screen.height * 0.85;
      const keyboardHeight = isKeyboardVisible ? window.screen.height - currentHeight : 0;
      
      console.log('Fallback Keyboard Detection:', {
        screenHeight: window.screen.height,
        currentHeight,
        keyboardHeight,
        isKeyboardVisible
      });
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: currentHeight
      });
    }
  }, []);

  // Debounced update function
  const debouncedUpdate = useCallback(() => {
    setTimeout(updateKeyboardState, 50);
  }, [updateKeyboardState]);

  useEffect(() => {
    const iOS = isIOS();
    
    // Initial update
    updateKeyboardState();

    if (iOS && 'visualViewport' in window && window.visualViewport) {
      // Use Visual Viewport API for iOS
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', debouncedUpdate, { passive: true });
      
      return () => {
        viewport.removeEventListener('resize', debouncedUpdate);
      };
    } else {
      // Fallback for non-iOS or older iOS
      window.addEventListener('resize', debouncedUpdate, { passive: true });
      
      return () => {
        window.removeEventListener('resize', debouncedUpdate);
      };
    }
  }, [debouncedUpdate, updateKeyboardState]);

  return keyboardState;
};
