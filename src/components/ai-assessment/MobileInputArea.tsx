
import React, { useRef, useEffect } from 'react';
import MessageInput from "./MessageInput";

interface MobileInputAreaProps {
  isCompleted: boolean;
  sendMessage: (messageToSend?: string) => Promise<void>;
  isLoading: boolean;
  keyboardState: {
    isVisible: boolean;
    height: number;
    availableHeight: number;
  };
  initialLoad: boolean;
  isIOS: boolean;
  setCurrentMessage: (message: string) => void;
}

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

export const MobileInputArea = ({
  isCompleted,
  sendMessage,
  isLoading,
  isIOS,
  setCurrentMessage,
  keyboardState
}: MobileInputAreaProps) => {
  if (isCompleted) {
    return null;
  }

  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const android = isAndroid();

  // Android-specific logic: always scroll input into view when keyboard opens
  useEffect(() => {
    if (android && keyboardState.isVisible && inputWrapperRef.current) {
      // Timeout allows visualViewport and layout to update before attempting scroll
      setTimeout(() => {
        try {
          inputWrapperRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        } catch (err) {
          // Fail very gracefully for unsupported browsers
        }
      }, 180);
    }
  }, [android, keyboardState.isVisible]);

  const handleSend = async (message: string) => {
    console.log('MobileInputArea handleSend called with message:', message);
    await sendMessage(message);
  };

  // Android-specific positioning when keyboard is visible
  const getAndroidPosition = (): React.CSSProperties => {
    if (!android) {
      return {};
    }
    // Calculate the margin from the bottom of the viewport to ensure the full input (with send button) is visible.
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const screenHeight = window.innerHeight;

    if (keyboardState.isVisible && keyboardState.height > 0) {
      // Estimate input height, add larger safety margin (e.g., 70px for input + 24px buffer)
      const inputHeight = 70;
      const safePadding = 24;
      const bottomPosition = screenHeight - viewportHeight + safePadding + inputHeight;

      return {
        position: 'fixed' as const,
        left: 0,
        right: 0,
        bottom: `${bottomPosition}px`,
        zIndex: 1001,
        minHeight: `${inputHeight + safePadding}px`,
        transform: 'translateZ(0)',
        willChange: 'transform'
      };
    } else if (viewportHeight < screenHeight * 0.75) {
      // Fallback logic
      return {
        position: 'fixed' as const,
        bottom: '84px', // 70px input + 14px safety margin
        left: '0',
        right: '0',
        zIndex: 1001,
        minHeight: '84px',
        transform: 'translateZ(0)'
      };
    }

    return {
      position: 'relative' as const,
      bottom: '0'
    };
  };

  // iOS positioning (existing logic)
  const getIOSPosition = (): React.CSSProperties => {
    if (!isIOS) return {};

    return {
      position: keyboardState.isVisible ? 'fixed' as const : 'relative' as const,
      bottom: keyboardState.isVisible ? `${keyboardState.height}px` : '0',
      left: '0',
      right: '0',
      paddingBottom: keyboardState.isVisible ? '0' : 'env(safe-area-inset-bottom)',
      zIndex: 1000
    };
  };

  // Default positioning for desktop/other platforms
  const getDefaultPosition = (): React.CSSProperties => ({
    position: 'relative' as const,
    bottom: '0',
    paddingBottom: '12px'
  });

  const positionStyle = android ? getAndroidPosition() : (isIOS ? getIOSPosition() : getDefaultPosition());

  return (
    <div
      ref={inputWrapperRef}
      className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t"
      style={{
        ...positionStyle,
        paddingTop: '8px'
      }}
    >
      <div className="px-4 pb-2">
        <MessageInput
          onSend={handleSend}
          isSending={isLoading}
        />
      </div>
    </div>
  );
};
