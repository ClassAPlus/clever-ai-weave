
import { useEffect, useState } from "react";
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
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
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

  // Handle viewport height changes for mobile keyboards
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages.length, scrollAreaRef]);

  const dynamicHeight = keyboardState.isVisible 
    ? `${keyboardState.availableHeight}px` 
    : `${viewportHeight}px`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom"
        className="w-full border-0 p-0"
        style={{ height: dynamicHeight }}
      >
        <div 
          className="flex flex-col h-full bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
          style={{ height: dynamicHeight }}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b bg-white/90 backdrop-blur-sm">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
              </SheetTitle>
              <SheetDescription className="text-gray-600 text-sm">
                {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto overscroll-behavior-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
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

          {/* Input Area */}
          {!isCompleted && (
            <div className="flex-shrink-0 p-4 border-t bg-white/95 backdrop-blur-sm">
              <MessageInput
                ref={messageInputRef}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                onSendMessage={sendMessage}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
