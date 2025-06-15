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
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // Adjusted: ensure reliable scroll-to-bottom even during iOS keyboard transitions and summary rendering
  useEffect(() => {
    const scrollToBottom = () => {
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    // Extra: for iOS, often need a further delay after keyboard close
    scrollToBottom();
    setTimeout(scrollToBottom, 100);
    setTimeout(scrollToBottom, 300);
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setTimeout(scrollToBottom, 500);
      setTimeout(scrollToBottom, 700);
    }
  }, [
    messages.length,
    keyboardState.isVisible,
    keyboardState.height,
    initialLoad,
    isCompleted,
    summary
  ]);

  // Add extra bottom padding if input or summary is present (to prevent last message cut-off by input or summary on iOS)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const extraBottomPadding = isIOS
    ? (keyboardState.isVisible && keyboardState.height > 0 ? 24 : 90)
    : 24;

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
      <div className="pt-4 pb-4 flex flex-col" style={{ paddingBottom: `${extraBottomPadding}px` }}>
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
