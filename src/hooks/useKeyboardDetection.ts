
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
    availableHeight: window.innerHeight
  });

  useEffect(() => {
    const iOS = isIOS();
    
    const updateKeyboardState = () => {
      if (iOS && 'visualViewport' in window && window.visualViewport) {
        // Use Visual Viewport API for iOS
        const viewport = window.visualViewport!;
        const currentHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, currentHeight - viewport.height);
        const isKeyboardVisible = keyboardHeight > 50;
        
        console.log('iOS Viewport update:', {
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
        // Fallback for other platforms
        const currentHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, window.screen.height - currentHeight);
        const isKeyboardVisible = keyboardHeight > 50;
        
        console.log('Fallback update:', {
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
    };

    // Initial update
    updateKeyboardState();

    // iOS-specific Visual Viewport listeners
    if (iOS && 'visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', updateKeyboardState, { passive: true });
      
      return () => {
        viewport.removeEventListener('resize', updateKeyboardState);
      };
    } else {
      // Fallback resize listener for non-iOS
      window.addEventListener('resize', updateKeyboardState, { passive: true });
      
      return () => {
        window.removeEventListener('resize', updateKeyboardState);
      };
    }
  }, []);

  return keyboardState;
};
