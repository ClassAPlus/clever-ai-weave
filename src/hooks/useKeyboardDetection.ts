
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
      
      // iOS-specific adjustments: more conservative minimum heights to prevent over-jumping
      const minVisibleHeight = iOS ? 250 : 400; // Much smaller minimum for iOS
      
      let availableHeight;
      
      if (iOS && isKeyboardVisible) {
        // iOS-specific calculation: use visual viewport with conservative adjustments
        const iOSOffset = window.visualViewport?.offsetTop || 0;
        availableHeight = Math.max(
          visualViewportHeight - toolbarHeight - iOSOffset, 
          minVisibleHeight
        );
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

    const handleFocus = () => {
      // iOS needs more time for viewport adjustments
      const delay = iOS ? 250 : 150;
      setTimeout(updateKeyboardState, delay);
      setTimeout(updateKeyboardState, delay + 150); // Double check
    };

    const handleBlur = () => {
      // Reset when input loses focus
      const delay = iOS ? 200 : 150;
      setTimeout(() => {
        setKeyboardState({
          isVisible: false,
          height: 0,
          availableHeight: window.innerHeight - 60 // Account for toolbar
        });
      }, delay);
    };

    const handleResize = () => {
      // iOS needs debounced updates to prevent excessive recalculations
      if (iOS) {
        setTimeout(updateKeyboardState, 100);
      } else {
        updateKeyboardState();
      }
    };

    const handleVisualViewportChange = () => {
      // iOS-specific handling for visual viewport changes
      if (iOS) {
        setTimeout(updateKeyboardState, 150);
      } else {
        updateKeyboardState();
      }
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
