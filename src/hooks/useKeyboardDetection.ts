
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

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

export const useKeyboardDetection = (inputRef: RefObject<HTMLElement>) => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    availableHeight: window.innerHeight
  });

  const updateKeyboardState = useCallback(() => {
    const iOS = isIOS();
    const android = isAndroid();
    
    if (iOS && 'visualViewport' in window && window.visualViewport) {
      // Use Visual Viewport API for iOS
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      const isKeyboardVisible = keyboardHeight > 50;
      
      console.log('iOS Keyboard Detection:', {
        windowHeight,
        viewportHeight,
        keyboardHeight,
        isKeyboardVisible
      });
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: viewportHeight
      });
    } else if (android) {
      // Android-specific detection using window height changes
      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      // Android keyboard detection: significant height reduction
      const heightDifference = screenHeight - currentHeight;
      const keyboardHeight = Math.max(0, heightDifference - 100); // Account for browser UI
      const isKeyboardVisible = keyboardHeight > 100; // More conservative threshold for Android
      
      console.log('Android Keyboard Detection:', {
        screenHeight,
        currentHeight,
        heightDifference,
        keyboardHeight,
        isKeyboardVisible
      });
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: currentHeight
      });
    } else {
      // Fallback for other platforms
      const currentHeight = window.innerHeight;
      const originalHeight = window.screen.height;
      const keyboardHeight = Math.max(0, originalHeight - currentHeight - 100);
      const isKeyboardVisible = keyboardHeight > 50;
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: currentHeight
      });
    }
  }, []);

  useEffect(() => {
    const iOS = isIOS();
    const android = isAndroid();
    
    if (iOS && 'visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', updateKeyboardState);
      
      return () => {
        viewport.removeEventListener('resize', updateKeyboardState);
      };
    } else {
      // For Android and other platforms, use window resize
      window.addEventListener('resize', updateKeyboardState);
      
      return () => {
        window.removeEventListener('resize', updateKeyboardState);
      };
    }
  }, [updateKeyboardState]);

  // Focus/blur detection with platform-specific handling
  useEffect(() => {
    const android = isAndroid();
    
    const handleFocus = () => {
      // Android may need more time to adjust layout
      const delay = android ? 300 : 100;
      setTimeout(updateKeyboardState, delay);
      setTimeout(updateKeyboardState, delay + 200);
    };
    
    const handleBlur = () => {
      setTimeout(updateKeyboardState, 100);
    };

    const currentInput = inputRef.current;
    if (currentInput) {
      currentInput.addEventListener('focus', handleFocus);
      currentInput.addEventListener('blur', handleBlur);
      
      return () => {
        currentInput.removeEventListener('focus', handleFocus);
        currentInput.removeEventListener('blur', handleBlur);
      };
    }
  }, [inputRef, updateKeyboardState]);

  return keyboardState;
};
