
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
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      const isKeyboardVisible = keyboardHeight > 50;
      
      console.log('iOS Keyboard Detection:', {
        windowHeight,
        viewportHeight,
        keyboardHeight,
        isKeyboardVisible,
        scale: viewport.scale
      });
      
      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: viewportHeight
      });
    } else {
      // Fallback for other platforms
      const currentHeight = window.innerHeight;
      const originalHeight = window.screen.height;
      const keyboardHeight = Math.max(0, originalHeight - currentHeight - 100); // Account for browser chrome
      const isKeyboardVisible = keyboardHeight > 50;
      
      console.log('Fallback Keyboard Detection:', {
        originalHeight,
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

  // Debounced update function with faster response
  const debouncedUpdate = useCallback(() => {
    setTimeout(updateKeyboardState, 20);
  }, [updateKeyboardState]);

  useEffect(() => {
    const iOS = isIOS();
    
    // Initial update
    updateKeyboardState();

    if (iOS && 'visualViewport' in window && window.visualViewport) {
      // Use Visual Viewport API for iOS with immediate updates
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', updateKeyboardState, { passive: true });
      viewport.addEventListener('scroll', updateKeyboardState, { passive: true });
      
      return () => {
        viewport.removeEventListener('resize', updateKeyboardState);
        viewport.removeEventListener('scroll', updateKeyboardState);
      };
    } else {
      // Fallback for non-iOS
      window.addEventListener('resize', debouncedUpdate, { passive: true });
      
      return () => {
        window.removeEventListener('resize', debouncedUpdate);
      };
    }
  }, [debouncedUpdate, updateKeyboardState]);

  // Additional focus/blur detection for better keyboard tracking
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(updateKeyboardState, 300); // Give time for keyboard to appear
    };
    
    const handleBlur = () => {
      setTimeout(updateKeyboardState, 300); // Give time for keyboard to disappear
    };

    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleFocus);
      inputRef.current.addEventListener('blur', handleBlur);
      
      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('focus', handleFocus);
          inputRef.current.removeEventListener('blur', handleBlur);
        }
      };
    }
  }, [inputRef, updateKeyboardState]);

  return keyboardState;
};
