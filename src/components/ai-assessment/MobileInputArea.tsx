
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
  setCurrentMessage: (message: string) => void;
}

export const MobileInputArea = ({
  isCompleted,
  sendMessage,
  isLoading,
  isIOS,
  setCurrentMessage
}: MobileInputAreaProps) => {
  if (isCompleted) {
    return null;
  }

  const handleSend = async (message: string) => {
    console.log('MobileInputArea handleSend called with message:', message);
    // Set the current message so AssessmentChat can use it
    setCurrentMessage(message);
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
