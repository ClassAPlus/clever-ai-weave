
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
          const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
          const isKeyboardVisible = keyboardHeight > 50;
          
          console.log('iOS Viewport change:', {
            windowHeight: window.innerHeight,
            viewportHeight: viewport.height,
            keyboardHeight,
            isKeyboardVisible
          });
          
          setKeyboardState({
            isVisible: isKeyboardVisible,
            height: keyboardHeight,
            availableHeight: viewport.height
          });
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
        handleViewportChange();

        return () => {
          window.visualViewport?.removeEventListener('resize', handleViewportChange);
          window.visualViewport?.removeEventListener('scroll', handleViewportChange);
        };
      } else {
        // Fallback for older iOS versions
        const initialHeight = window.innerHeight;
        
        const handleResize = () => {
          const currentHeight = window.innerHeight;
          const keyboardHeight = Math.max(0, initialHeight - currentHeight);
          const isKeyboardVisible = keyboardHeight > 50;
          
          console.log('iOS Fallback resize:', {
            initialHeight,
            currentHeight,
            keyboardHeight,
            isKeyboardVisible
          });
          
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
      // Non-iOS handling (Android, etc.)
      const initialHeight = window.innerHeight;
      
      const updateKeyboardState = () => {
        const currentHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, initialHeight - currentHeight);
        const isKeyboardVisible = keyboardHeight > 50;
        
        console.log('Non-iOS resize:', {
          initialHeight,
          currentHeight,
          keyboardHeight,
          isKeyboardVisible
        });
        
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
