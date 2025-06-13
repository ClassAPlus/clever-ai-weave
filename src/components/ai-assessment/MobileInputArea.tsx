
import MessageInput from "./MessageInput";

interface MobileInputAreaProps {
  isCompleted: boolean;
  sendMessage: () => Promise<void>;
  isLoading: boolean;
  keyboardState: {
    isVisible: boolean;
    height: number;
    availableHeight: number;
  };
  initialLoad: boolean;
  isIOS: boolean;
}

export const MobileInputArea = ({
  isCompleted,
  sendMessage,
  isLoading,
  isIOS
}: MobileInputAreaProps) => {
  if (isCompleted) {
    return null;
  }

  const handleSend = async (message: string) => {
    // We need to create a wrapper that handles the message internally
    // since the simplified MessageInput manages its own text state
    await sendMessage();
  };

  return (
    <div 
      className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t"
      style={{
        paddingBottom: isIOS ? '16px' : '12px',
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
