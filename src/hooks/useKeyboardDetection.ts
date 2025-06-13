
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
    availableHeight: window.innerHeight - 60 // Account for mobile toolbar/navbar
  });

  useEffect(() => {
    let initialHeight = window.innerHeight;
    let initialVisualViewportHeight = window.visualViewport?.height || window.innerHeight;
    const iOS = isIOS();
    let updateTimeout: NodeJS.Timeout;

    const updateKeyboardState = () => {
      const currentHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || currentHeight;
      
      // Calculate keyboard height using multiple methods for better accuracy
      const methodA = initialHeight - currentHeight; // Window resize method
      const methodB = initialVisualViewportHeight - visualViewportHeight; // Visual viewport method
      const methodC = currentHeight - visualViewportHeight; // Current difference method
      
      // Use the most reliable method (usually visual viewport when available)
      const keyboardHeight = window.visualViewport ? Math.max(methodB, methodC) : methodA;
      const isKeyboardVisible = keyboardHeight > 50; // Threshold to avoid false positives
      
      // Account for mobile toolbar/navbar and ensure reasonable minimum height
      const toolbarHeight = 60;
      
      // More conservative minimum heights to prevent over-jumping, especially on iOS
      const minVisibleHeight = iOS ? 200 : 350; // Much smaller minimum for iOS
      
      let availableHeight;
      
      if (iOS && isKeyboardVisible) {
        // iOS-specific calculation: simpler approach without offset adjustments
        availableHeight = Math.max(visualViewportHeight - toolbarHeight, minVisibleHeight);
      } else {
        // Android or keyboard not visible
        availableHeight = isKeyboardVisible 
          ? Math.max(visualViewportHeight - toolbarHeight, minVisibleHeight)
          : currentHeight - toolbarHeight;
      }

      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: Math.max(0, keyboardHeight),
        availableHeight
      });
    };

    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateKeyboardState, iOS ? 150 : 100);
    };

    const handleFocus = () => {
      // iOS needs time for viewport adjustments, but not too much to prevent jumping
      const delay = iOS ? 200 : 100;
      setTimeout(updateKeyboardState, delay);
    };

    const handleBlur = () => {
      // Reset when input loses focus
      const delay = iOS ? 150 : 100;
      setTimeout(() => {
        setKeyboardState({
          isVisible: false,
          height: 0,
          availableHeight: window.innerHeight - 60 // Account for toolbar
        });
      }, delay);
    };

    const handleResize = () => {
      debouncedUpdate();
    };

    const handleVisualViewportChange = () => {
      debouncedUpdate();
    };

    // Set up event listeners
    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    // Input focus/blur events
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
      inputElement.addEventListener('blur', handleBlur);
    }

    // Initial calculation
    updateKeyboardState();

    // Cleanup
    return () => {
      clearTimeout(updateTimeout);
      window.removeEventListener('resize', handleResize);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
      
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
        inputElement.removeEventListener('blur', handleBlur);
      }
    };
  }, [inputRef]);

  return keyboardState;
};
