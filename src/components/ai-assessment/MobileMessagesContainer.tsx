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
  const summaryRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll-to-bottom with better mobile handling
  useEffect(() => {
    const scrollToBottom = (force = false) => {
      try {
        // If we have completed assessment with summary, scroll to top of recommendations
        if (isCompleted && summary && summaryRef.current) {
          summaryRef.current.scrollIntoView({ 
            behavior: force ? "auto" : "smooth", 
            block: "start",
            inline: "nearest"
          });
          return;
        }
        
        // Otherwise, scroll the bottom anchor into view
        if (bottomAnchorRef.current) {
          bottomAnchorRef.current.scrollIntoView({ 
            behavior: force ? "auto" : "smooth", 
            block: "end",
            inline: "nearest"
          });
        }
        
        // Also ensure the container is scrolled to bottom for regular chat
        if (messagesContainerRef.current && !isCompleted) {
          const container = messagesContainerRef.current;
          const targetScrollTop = container.scrollHeight - container.clientHeight;
          
          if (force) {
            container.scrollTop = targetScrollTop;
          } else {
            container.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }
      } catch (error) {
        console.log('Scroll error (non-critical):', error);
      }
    };

    // Initial scroll immediately for new messages
    scrollToBottom(true);
    
    // Follow-up smooth scrolls with delays for different scenarios
    const timeouts = [100, 300];
    
    // Add extra delays for iOS due to potential keyboard transitions
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      timeouts.push(500, 700, 1000);
    }
    
    // Add extra delay when summary is being rendered
    if (isCompleted && summary) {
      timeouts.push(1200, 1500);
    }

    const timeoutIds = timeouts.map(delay => 
      setTimeout(() => scrollToBottom(), delay)
    );

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [
    messages.length,
    keyboardState.isVisible,
    keyboardState.height,
    initialLoad,
    isCompleted,
    summary,
    stage
  ]);

  // Additional effect to handle stage transitions - scroll to top of recommendations
  useEffect(() => {
    if (stage === 'assessment_complete' && summary && summaryRef.current) {
      console.log('Assessment summary rendered - scrolling to top of recommendations');
      setTimeout(() => {
        if (summaryRef.current) {
          summaryRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }
      }, 800);
    }
  }, [stage, summary]);

  // Detect iOS with better accuracy
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Enhanced bottom padding calculation
  const getBottomPadding = () => {
    if (isCompleted && (stage === 'assessment_complete' || stage === 'contact_collected')) {
      // Extra padding when showing summary/results
      return isIOS ? 120 : 80;
    }
    
    if (keyboardState.isVisible && keyboardState.height > 0) {
      // Less padding when keyboard is visible (input is above keyboard)
      return isIOS ? 24 : 16;
    }
    
    // Default padding for normal chat
    return isIOS ? 90 : 60;
  };

  return (
    <div 
      ref={messagesContainerRef}
      className="overflow-y-auto transition-all duration-300 ease-in-out"
      style={{
        height: messagesHeight,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        opacity: initialLoad ? 0 : 1,
        transition: 'opacity 0.2s ease-in, height 0.3s ease-in-out'
      }}
    >
      <div 
        className="pt-4 pb-4 flex flex-col transition-all duration-300 ease-in-out" 
        style={{ 
          paddingBottom: `${getBottomPadding()}px`,
          minHeight: '100%'
        }}
      >
        <ChatMessages messages={messages} isLoading={isLoading} />
        
        {isCompleted && summary && (
          <div 
            ref={summaryRef}
            className="mt-4 flex-shrink-0 flex flex-col transition-all duration-500 ease-in-out"
          >
            <AssessmentSummary 
              summary={summary} 
              onResetAssessment={resetAssessment} 
              onRequestContact={handleContactRequest}
              stage={stage}
              showContactButton={showContactButton}
            />
          </div>
        )}
        
        {/* Enhanced anchor with better positioning - only for non-completed states */}
        {!isCompleted && (
          <div 
            ref={bottomAnchorRef} 
            className="h-1 w-full flex-shrink-0"
            style={{ marginTop: '8px' }}
          />
        )}
      </div>
    </div>
  );
};
