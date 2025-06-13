
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
  const getAndroidPosition = () => {
    if (!android || !keyboardState.isVisible) {
      return {};
    }
    
    // On Android, position the input above the keyboard
    return {
      position: 'fixed' as const,
      bottom: `${keyboardState.height + 10}px`, // Add 10px margin above keyboard
      left: '0',
      right: '0',
      zIndex: 1001
    };
  };

  // iOS positioning (existing logic)
  const getIOSPosition = () => {
    if (!isIOS) return {};
    
    return {
      position: keyboardState.isVisible ? 'fixed' : 'relative',
      bottom: keyboardState.isVisible ? `${keyboardState.height}px` : '0',
      left: '0',
      right: '0',
      paddingBottom: keyboardState.isVisible ? '0' : 'env(safe-area-inset-bottom)',
      zIndex: 1000
    };
  };

  // Default positioning for desktop/other platforms
  const getDefaultPosition = () => ({
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
