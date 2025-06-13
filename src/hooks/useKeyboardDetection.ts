
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
    let timeoutId: NodeJS.Timeout;
    
    const updateKeyboardState = () => {
      // Clear any pending updates
      clearTimeout(timeoutId);
      
      // Debounce the update to prevent rapid changes
      timeoutId = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const initialHeight = window.screen.height;
        
        if (iOS && 'visualViewport' in window && window.visualViewport) {
          // Use Visual Viewport API for iOS
          const viewport = window.visualViewport!;
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
          const keyboardHeight = Math.max(0, initialHeight - currentHeight);
          const isKeyboardVisible = keyboardHeight > 50;
          
          console.log('Fallback update:', {
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
        }
      }, 100);
    };

    // Use ResizeObserver for more reliable detection
    const resizeObserver = new ResizeObserver(() => {
      updateKeyboardState();
    });

    // Observe body element for size changes
    resizeObserver.observe(document.body);

    // Initial update
    updateKeyboardState();

    // iOS-specific Visual Viewport listeners
    if (iOS && 'visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardState, { passive: true });
    }

    // Fallback resize listener
    window.addEventListener('resize', updateKeyboardState, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      
      if (iOS && 'visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardState);
      }
      
      window.removeEventListener('resize', updateKeyboardState);
    };
  }, []);

  return keyboardState;
};
