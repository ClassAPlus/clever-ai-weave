import { MessageInput } from "./MessageInput";

interface MobileInputAreaProps {
  isCompleted: boolean;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  sendMessage: () => void;
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
  keyboardState,
  initialLoad,
  isIOS
}: MobileInputAreaProps) => {
  if (isCompleted) {
    return null;
  }

  return (
    <div 
      className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t"
      style={{
        paddingBottom: isIOS ? 'max(env(safe-area-inset-bottom), 16px)' : '16px'
      }}
    >
      <div className="p-4">
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
