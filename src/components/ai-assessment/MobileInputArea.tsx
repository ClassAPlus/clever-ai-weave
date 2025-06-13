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
        paddingBottom: keyboardState.isVisible 
          ? '8px' 
          : isIOS 
            ? 'max(env(safe-area-inset-bottom), 16px)'
            : '16px',
        position: keyboardState.isVisible && isIOS ? 'absolute' : 'relative',
        bottom: keyboardState.isVisible && isIOS ? '0' : 'auto',
        left: keyboardState.isVisible && isIOS ? '0' : 'auto',
        right: keyboardState.isVisible && isIOS ? '0' : 'auto',
        zIndex: keyboardState.isVisible && isIOS ? 100 : 'auto',
        opacity: keyboardState.isVisible ? 1 : (initialLoad ? 0 : 1),
        transition: keyboardState.isVisible ? 'none' : 'opacity 0.2s ease-in'
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
