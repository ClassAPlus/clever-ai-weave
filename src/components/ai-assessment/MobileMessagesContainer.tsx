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
      // Try the anchor method, which is most robust
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      // Fallback: scroll entire container if needed
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    // Scroll on new message, keyboard toggle, summary appear, or initialLoad toggling off
    if (
      messages.length > 0 &&
      !initialLoad
    ) {
      scrollToBottom();
      setTimeout(scrollToBottom, 100); // Sometimes DOM not ready
      setTimeout(scrollToBottom, 300); // Extra fallback for mobile rendering quirks
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
      className="flex-1 overflow-y-auto"
      style={{
        height: messagesHeight,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        opacity: initialLoad ? 0 : 1,
        transition: 'opacity 0.2s ease-in'
      }}
    >
      <div className="pt-4 pb-4 flex flex-col min-h-full">
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
        <div ref={bottomAnchorRef} style={{ minHeight: 1 }} />
      </div>
    </div>
  );
};
