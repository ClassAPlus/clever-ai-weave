
import { useEffect, useRef } from "react";
import { ChatMessages } from "./ChatMessages";
import { AssessmentSummary } from "./AssessmentSummary";

interface MobileMessagesContainerProps {
  messages: any[];
  isLoading: boolean;
  isCompleted: boolean;
  summary: string;
  stage: 'initial' | 'assessment_complete' | 'contact_collected';
  showContactButton: boolean;
  resetAssessment: () => void;
  handleContactRequest: () => void;
  messagesHeight: string;
  initialLoad: boolean;
  keyboardState: {
    isVisible: boolean;
    height: number;
    availableHeight: number;
  };
}

export const MobileMessagesContainer = ({
  messages,
  isLoading,
  isCompleted,
  summary,
  stage,
  showContactButton,
  resetAssessment,
  handleContactRequest,
  messagesHeight,
  initialLoad,
  keyboardState
}: MobileMessagesContainerProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or keyboard state changes
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0 && !initialLoad) {
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      };
      
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
  }, [messages.length, keyboardState.isVisible, keyboardState.height, initialLoad]);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto"
      style={{
        height: messagesHeight,
        maxHeight: messagesHeight,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        opacity: initialLoad ? 0 : 1,
        transition: 'opacity 0.2s ease-in'
      }}
    >
      <div className="pt-4 pb-4">
        <ChatMessages messages={messages} isLoading={isLoading} />
        
        {isCompleted && summary && (
          <div className="p-4">
            <AssessmentSummary 
              summary={summary} 
              onResetAssessment={resetAssessment} 
              onRequestContact={handleContactRequest}
              stage={stage}
              showContactButton={showContactButton}
            />
          </div>
        )}
      </div>
    </div>
  );
};
