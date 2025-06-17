
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AssessmentChat } from "./AssessmentChat";
import { MobileSheetHeader } from "./MobileSheetHeader";
import { MobileMessagesContainer } from "./MobileMessagesContainer";
import { MobileInputArea } from "./MobileInputArea";
import { useMobileDialogState } from "./useMobileDialogState";
import { useEffect } from "react";

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

  // Enhanced state monitoring for mobile
  useEffect(() => {
    console.log('Mobile Dialog State Change:', {
      open,
      isCompleted,
      stage,
      showContactButton,
      messagesCount: messages.length,
      isLoading,
      keyboardVisible: keyboardState.isVisible,
      keyboardHeight: keyboardState.height
    });
  }, [open, isCompleted, stage, showContactButton, messages.length, isLoading, keyboardState]);

  // Handle stage transitions with proper mobile layout adjustments
  useEffect(() => {
    if (stage === 'assessment_complete' && summary) {
      console.log('Assessment completed - adjusting mobile layout');
      // Small delay to ensure proper layout adjustment
      setTimeout(() => {
        if (window.scrollTo) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [stage, summary]);

  const enhancedHandleContactRequest = () => {
    console.log('Enhanced contact request handler called');
    handleContactRequest();
    
    // Additional mobile-specific handling
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 300);
  };

  const enhancedResetAssessment = () => {
    console.log('Enhanced reset assessment called');
    resetAssessment();
    
    // Additional mobile-specific reset handling
    setTimeout(() => {
      if (window.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-full h-full max-w-none max-h-none border-0 p-0 overflow-hidden"
        style={{ 
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          transform: 'none',
          borderRadius: '0',
          margin: '0',
          height: '100vh',
          width: '100vw'
        }}
      >
        <div 
          className="flex flex-col bg-gradient-to-br from-white via-gray-50 to-purple-50/30 h-full transition-all duration-300 ease-in-out"
          style={{ 
            height: '100vh',
            maxHeight: '100vh',
            opacity: initialLoad ? 0 : 1,
            transition: 'opacity 0.2s ease-in, height 0.3s ease-in-out',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            paddingTop: isIOS ? 'env(safe-area-inset-top)' : '0',
            paddingBottom: keyboardState.isVisible ? '0' : (isIOS ? 'env(safe-area-inset-bottom)' : '0'),
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)'
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
            resetAssessment={enhancedResetAssessment}
            handleContactRequest={enhancedHandleContactRequest}
            messagesHeight={messagesHeight}
            initialLoad={initialLoad}
            keyboardState={keyboardState}
          />

          <MobileInputArea
            isCompleted={isCompleted}
            sendMessage={sendMessage}
            isLoading={isLoading}
            keyboardState={keyboardState}
            initialLoad={initialLoad}
            isIOS={isIOS}
            setCurrentMessage={setCurrentMessage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
