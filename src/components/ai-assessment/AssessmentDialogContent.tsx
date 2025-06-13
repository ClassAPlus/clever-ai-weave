
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessages } from "./ChatMessages";
import { AssessmentSummary } from "./AssessmentSummary";
import MessageInput from "./MessageInput";
import { AssessmentChat } from "./AssessmentChat";

interface AssessmentDialogContentProps {
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
}

export const AssessmentDialogContent = ({
  messages,
  setMessages,
  currentMessage,
  setCurrentMessage,
  isLoading,
  setIsLoading,
  isCompleted,
  setIsCompleted,
  summary,
  setSummary,
  stage,
  setStage,
  showContactButton,
  setShowContactButton,
  scrollAreaRef,
  messageInputRef,
  resetAssessment,
  keyboardState
}: AssessmentDialogContentProps) => {
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

  // Auto-scroll to bottom when new messages arrive or keyboard appears
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length, keyboardState.isVisible]);

  const handleSend = async (message: string) => {
    console.log('AssessmentDialogContent handleSend called with message:', message);
    // Pass the message directly to sendMessage instead of setting state
    await sendMessage(message);
  };

  return {
    sendMessage,
    handleContactRequest,
    ChatMessages: () => <ChatMessages messages={messages} isLoading={isLoading} />,
    AssessmentSummary: () => isCompleted && summary ? (
      <AssessmentSummary 
        summary={summary} 
        onResetAssessment={resetAssessment} 
        onRequestContact={handleContactRequest}
        stage={stage}
        showContactButton={showContactButton}
      />
    ) : null,
    MessageInput: () => !isCompleted ? (
      <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-100 pt-4">
        <MessageInput
          onSend={handleSend}
          isSending={isLoading}
        />
      </div>
    ) : null
  };
};
