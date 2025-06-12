
import { useState, useEffect, RefObject } from 'react';

interface KeyboardState {
  isVisible: boolean;
  height: number;
  availableHeight: number;
}

export const useKeyboardDetection = (inputRef: RefObject<HTMLElement>) => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    availableHeight: window.innerHeight - 60 // Account for mobile toolbar/navbar
  });

  useEffect(() => {
    let initialHeight = window.innerHeight;
    let initialVisualViewportHeight = window.visualViewport?.height || window.innerHeight;

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
      const minVisibleHeight = 400; // Minimum height to keep UI usable
      
      const availableHeight = isKeyboardVisible 
        ? Math.max(visualViewportHeight - toolbarHeight, minVisibleHeight) // Ensure minimum usable height
        : currentHeight - toolbarHeight;

      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: Math.max(0, keyboardHeight),
        availableHeight
      });
    };

    const handleFocus = () => {
      // Small delay to allow the keyboard to appear
      setTimeout(updateKeyboardState, 150);
      setTimeout(updateKeyboardState, 300); // Double check
    };

    const handleBlur = () => {
      // Reset when input loses focus
      setTimeout(() => {
        setKeyboardState({
          isVisible: false,
          height: 0,
          availableHeight: window.innerHeight - 60 // Account for toolbar
        });
      }, 150);
    };

    const handleResize = () => {
      updateKeyboardState();
    };

    const handleVisualViewportChange = () => {
      updateKeyboardState();
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
