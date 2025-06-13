
import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChatMessages } from "./ChatMessages";
import { AssessmentSummary } from "./AssessmentSummary";
import { MessageInput } from "./MessageInput";
import { AssessmentChat } from "./AssessmentChat";

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
  const { isHebrew } = useLanguage();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const {
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

  // Auto-scroll to bottom when new messages arrive or keyboard state changes
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      };
      
      // Immediate scroll
      scrollToBottom();
      
      // Delayed scroll for keyboard transitions
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
  }, [messages.length, keyboardState.isVisible, keyboardState.height]);

  // Calculate dynamic heights with more aggressive iOS keyboard handling
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  let containerHeight: string;
  let messagesHeight: string;
  
  if (keyboardState.isVisible) {
    // When keyboard is visible, use the available viewport height
    containerHeight = `${keyboardState.availableHeight}px`;
    messagesHeight = `${keyboardState.availableHeight - 160}px`; // More space for input
  } else {
    // When keyboard is hidden, use full viewport with safe area
    containerHeight = isIOS ? 'calc(100vh - env(safe-area-inset-bottom))' : '100vh';
    messagesHeight = isIOS ? 'calc(100vh - 200px - env(safe-area-inset-bottom))' : 'calc(100vh - 200px)';
  }

  console.log('Mobile Dialog Heights:', {
    keyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    availableHeight: keyboardState.availableHeight,
    containerHeight,
    messagesHeight,
    isIOS
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom"
        className="w-full border-0 p-0 overflow-hidden"
        style={{ 
          height: containerHeight,
          maxHeight: containerHeight,
          transform: keyboardState.isVisible && isIOS ? 'translateY(0)' : undefined
        }}
      >
        <div 
          className="flex flex-col bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
          style={{ 
            height: containerHeight,
            maxHeight: containerHeight
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b">
            <div className="p-4 pb-2 pt-6">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
                </SheetTitle>
                <SheetDescription className="text-gray-600 text-sm">
                  {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
                </SheetDescription>
              </SheetHeader>
            </div>
          </div>

          {/* Messages Container with dynamic height and better iOS handling */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto"
            style={{
              height: messagesHeight,
              maxHeight: messagesHeight,
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehavior: 'contain'
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

          {/* Input Area with better iOS keyboard positioning */}
          {!isCompleted && (
            <div 
              className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t"
              style={{
                paddingBottom: keyboardState.isVisible 
                  ? '8px' 
                  : isIOS 
                    ? 'max(env(safe-area-inset-bottom), 16px)'
                    : '16px',
                position: keyboardState.isVisible && isIOS ? 'fixed' : 'relative',
                bottom: keyboardState.isVisible && isIOS ? '0' : 'auto',
                left: keyboardState.isVisible && isIOS ? '0' : 'auto',
                right: keyboardState.isVisible && isIOS ? '0' : 'auto',
                zIndex: keyboardState.isVisible && isIOS ? 100 : 'auto'
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
