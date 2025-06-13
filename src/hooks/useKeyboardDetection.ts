
import { useState, useEffect, RefObject, useCallback } from 'react';

interface KeyboardState {
  isVisible: boolean;
  height: number;
  availableHeight: number;
}

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
         /Safari/.test(navigator.userAgent);
};

export const useKeyboardDetection = (inputRef: RefObject<HTMLElement>) => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>(() => {
    // Initialize with immediate detection
    const iOS = isIOS();
    if (iOS && 'visualViewport' in window && window.visualViewport) {
      const viewport = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      const isKeyboardVisible = keyboardHeight > 50;
      
      return {
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        availableHeight: viewportHeight
      };
    }
    
    return {
      isVisible: false,
      height: 0,
      availableHeight: window.innerHeight
    };
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
      const keyboardHeight = Math.max(0, originalHeight - currentHeight - 100);
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

  useEffect(() => {
    const iOS = isIOS();
    
    // Immediate update
    updateKeyboardState();

    if (iOS && 'visualViewport' in window && window.visualViewport) {
      // Use Visual Viewport API for iOS with immediate detection
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', updateKeyboardState, { passive: true });
      viewport.addEventListener('scroll', updateKeyboardState, { passive: true });
      
      return () => {
        viewport.removeEventListener('resize', updateKeyboardState);
        viewport.removeEventListener('scroll', updateKeyboardState);
      };
    } else {
      // Fallback for non-iOS
      const handleResize = () => {
        updateKeyboardState();
        setTimeout(updateKeyboardState, 50);
      };
      window.addEventListener('resize', handleResize, { passive: true });
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [updateKeyboardState]);

  // Focus/blur detection with immediate updates
  useEffect(() => {
    const handleFocus = () => {
      // Immediate update, then delayed updates for iOS
      updateKeyboardState();
      setTimeout(updateKeyboardState, 100);
      setTimeout(updateKeyboardState, 300);
    };
    
    const handleBlur = () => {
      updateKeyboardState();
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
