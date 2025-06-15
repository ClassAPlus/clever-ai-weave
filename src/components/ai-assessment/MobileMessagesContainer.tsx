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
  // Add a bottom anchor for reliable scrolling
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // Stronger auto-scroll to bottom logic
  useEffect(() => {
    const scrollToBottom = () => {
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    if (
      messages.length > 0 &&
      !initialLoad
    ) {
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
  }, [
    messages.length,
    keyboardState.isVisible,
    keyboardState.height,
    initialLoad,
    isCompleted,
    summary
  ]);

  return (
    <div 
      ref={messagesContainerRef}
      className="overflow-y-auto"
      style={{
        height: messagesHeight,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        opacity: initialLoad ? 0 : 1,
        transition: 'opacity 0.2s ease-in'
      }}
    >
      <div className="pt-4 pb-4 flex flex-col">
        <ChatMessages messages={messages} isLoading={isLoading} />
        {isCompleted && summary && (
          <div className="mt-4 flex-shrink-0 flex flex-col">
            <AssessmentSummary 
              summary={summary} 
              onResetAssessment={resetAssessment} 
              onRequestContact={handleContactRequest}
              stage={stage}
              showContactButton={showContactButton}
            />
          </div>
        )}
        {/* ANCHOR: Always keep this div at the end for smooth scroll */}
        <div ref={bottomAnchorRef} />
      </div>
    </div>
  );
};
