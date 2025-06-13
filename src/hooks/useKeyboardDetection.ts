
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
    
    if (iOS) {
      // Use Visual Viewport API for better iOS keyboard detection
      if ('visualViewport' in window && window.visualViewport) {
        const handleViewportChange = () => {
          const viewport = window.visualViewport!;
          const keyboardHeight = window.innerHeight - viewport.height;
          const isKeyboardVisible = keyboardHeight > 50;
          
          setKeyboardState({
            isVisible: isKeyboardVisible,
            height: keyboardHeight,
            availableHeight: viewport.height
          });
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        handleViewportChange();

        return () => {
          window.visualViewport?.removeEventListener('resize', handleViewportChange);
        };
      } else {
        // Fallback for older iOS versions
        const initialHeight = window.innerHeight;
        
        const handleResize = () => {
          const currentHeight = window.innerHeight;
          const keyboardHeight = Math.max(0, initialHeight - currentHeight);
          const isKeyboardVisible = keyboardHeight > 50;
          
          setKeyboardState({
            isVisible: isKeyboardVisible,
            height: keyboardHeight,
            availableHeight: currentHeight
          });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    } else {
      // Non-iOS handling
      const initialHeight = window.innerHeight;
      
      const updateKeyboardState = () => {
        const currentHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, initialHeight - currentHeight);
        const isKeyboardVisible = keyboardHeight > 50;
        
        setKeyboardState({
          isVisible: isKeyboardVisible,
          height: keyboardHeight,
          availableHeight: currentHeight
        });
      };

      window.addEventListener('resize', updateKeyboardState);
      updateKeyboardState();

      return () => {
        window.removeEventListener('resize', updateKeyboardState);
      };
    }
  }, []);

  return keyboardState;
};
