
import React from 'react';
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

  const handleSend = async (message: string) => {
    console.log('MobileInputArea handleSend called with message:', message);
    // Pass the message directly to sendMessage instead of setting state
    await sendMessage(message);
  };

  const android = isAndroid();

  // Android-specific positioning when keyboard is visible
  const getAndroidPosition = (): React.CSSProperties => {
    if (!android) {
      return {};
    }
    
    // For Android, when keyboard is visible, position at the top of visible viewport
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const screenHeight = window.innerHeight;
    
    if (keyboardState.isVisible && keyboardState.height > 0) {
      // Position the input at the bottom of the available viewport height
      const bottomPosition = screenHeight - viewportHeight + 10; // 10px margin from bottom of visible area
      
      return {
        position: 'fixed' as const,
        bottom: `${bottomPosition}px`,
        left: '0',
        right: '0',
        zIndex: 1001,
        transform: 'translateZ(0)' // Force hardware acceleration
      };
    } else if (viewportHeight < screenHeight * 0.75) {
      // Fallback when visual viewport indicates keyboard presence
      return {
        position: 'fixed' as const,
        bottom: '10px',
        left: '0',
        right: '0',
        zIndex: 1001,
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
