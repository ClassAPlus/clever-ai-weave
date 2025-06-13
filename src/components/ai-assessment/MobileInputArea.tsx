
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

  return (
    <div 
      className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t"
      style={{
        position: keyboardState.isVisible ? 'fixed' : 'relative',
        bottom: keyboardState.isVisible ? `${keyboardState.height}px` : '0',
        left: '0',
        right: '0',
        paddingBottom: keyboardState.isVisible ? '0' : (isIOS ? 'env(safe-area-inset-bottom)' : '12px'),
        paddingTop: '8px',
        zIndex: 1000
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
