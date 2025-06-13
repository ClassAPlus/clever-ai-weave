
import { MessageInput } from "./MessageInput";

interface MobileInputAreaProps {
  isCompleted: boolean;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  sendMessage: () => Promise<void>; // Changed from () => void to () => Promise<void>
  isLoading: boolean;
  messageInputRef: React.RefObject<HTMLTextAreaElement>;
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
  currentMessage,
  setCurrentMessage,
  sendMessage,
  isLoading,
  messageInputRef,
  isIOS
}: MobileInputAreaProps) => {
  if (isCompleted) {
    return null;
  }

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
          ref={messageInputRef}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
