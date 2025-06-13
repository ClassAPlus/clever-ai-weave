
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AssessmentChat } from "./AssessmentChat";
import { MobileSheetHeader } from "./MobileSheetHeader";
import { MobileMessagesContainer } from "./MobileMessagesContainer";
import { MobileInputArea } from "./MobileInputArea";
import { useMobileDialogState } from "./useMobileDialogState";

interface MobileAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentProps: {
    messages: any[];
    setMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
    currentMessage: string;
    setCurrentMessage: (message: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    isCompleted: boolean;
    setIsCompleted: (completed: boolean) => void;
    summary: string;
    setSummary: (summary: string) => void;
    stage: 'initial' | 'assessment_complete' | 'contact_collected';
    setStage: (stage: 'initial' | 'assessment_complete' | 'contact_collected') => void;
    showContactButton: boolean;
    setShowContactButton: (show: boolean) => void;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    messageInputRef: React.RefObject<HTMLTextAreaElement>;
    resetAssessment: () => void;
    keyboardState: {
      isVisible: boolean;
      height: number;
      availableHeight: number;
    };
  };
}

export const MobileAssessmentDialog = ({ open, onOpenChange, contentProps }: MobileAssessmentDialogProps) => {
  const {
    messages,
    setMessages,
    currentMessage,
    setCurrentMessage,
    isLoading,
    setIsLoading,
    isCompleted,
    setIsCompleted,
    setSummary,
    setStage,
    setShowContactButton,
    scrollAreaRef,
    messageInputRef,
    resetAssessment,
    keyboardState,
    summary,
    stage,
    showContactButton
  } = contentProps;

  const { sendMessage, handleContactRequest } = AssessmentChat({
    messages,
    setMessages,
    currentMessage,
    setCurrentMessage,
    isLoading,
    setIsLoading,
    isCompleted,
    setIsCompleted,
    setSummary,
    setStage,
    setShowContactButton,
    scrollAreaRef,
    messageInputRef
  });

  const { initialLoad, isIOS, containerHeight, messagesHeight } = useMobileDialogState({
    open,
    keyboardState
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom"
        className="w-full border-0 p-0 overflow-hidden"
        style={{ 
          height: containerHeight,
          maxHeight: containerHeight,
          transform: initialLoad && isIOS 
            ? 'translateY(-100px)' 
            : keyboardState.isVisible && isIOS 
              ? 'translateY(0)' 
              : undefined,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <div 
          className="flex flex-col bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
          style={{ 
            height: containerHeight,
            maxHeight: containerHeight
          }}
        >
          <MobileSheetHeader />

          <MobileMessagesContainer
            messages={messages}
            isLoading={isLoading}
            isCompleted={isCompleted}
            summary={summary}
            stage={stage}
            showContactButton={showContactButton}
            resetAssessment={resetAssessment}
            handleContactRequest={handleContactRequest}
            messagesHeight={messagesHeight}
            initialLoad={initialLoad}
            keyboardState={keyboardState}
          />

          <MobileInputArea
            isCompleted={isCompleted}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            sendMessage={sendMessage}
            isLoading={isLoading}
            messageInputRef={messageInputRef}
            keyboardState={keyboardState}
            initialLoad={initialLoad}
            isIOS={isIOS}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
