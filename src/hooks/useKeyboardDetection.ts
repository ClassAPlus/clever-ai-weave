
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
      // Improved Android detection using visual viewport when available
      const viewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      
      if (viewport) {
        // Use visual viewport if available (modern Android browsers)
        const viewportHeight = viewport.height;
        const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
        const isKeyboardVisible = keyboardHeight > 150; // More reliable threshold
        
        console.log('Android Keyboard Detection (Visual Viewport):', {
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
      } else {
        // Fallback for older Android browsers
        const screenHeight = window.screen.height;
        const heightDifference = screenHeight - windowHeight;
        const keyboardHeight = Math.max(0, heightDifference - 150); // Account for browser UI
        const isKeyboardVisible = keyboardHeight > 200;
        
        console.log('Android Keyboard Detection (Fallback):', {
          screenHeight,
          windowHeight,
          heightDifference,
          keyboardHeight,
          isKeyboardVisible
        });
        
        setKeyboardState({
          isVisible: isKeyboardVisible,
          height: keyboardHeight,
          availableHeight: windowHeight
        });
      }
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
    
    if ((iOS || android) && 'visualViewport' in window && window.visualViewport) {
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
      const delay = android ? 400 : 100;
      setTimeout(updateKeyboardState, delay);
      setTimeout(updateKeyboardState, delay + 300);
    };
    
    const handleBlur = () => {
      setTimeout(updateKeyboardState, 200);
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
