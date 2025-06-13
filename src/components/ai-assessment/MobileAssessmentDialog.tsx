
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Calculate safe area height for mobile keyboards
  const safeHeight = keyboardState.isVisible 
    ? `${keyboardState.availableHeight}px` 
    : '100vh';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom"
        className="w-full border-0 p-0 h-full max-h-screen"
        style={{ height: safeHeight, maxHeight: safeHeight }}
      >
        <div 
          className="flex flex-col w-full bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
          style={{ height: safeHeight }}
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 p-4 border-b bg-white/95 backdrop-blur-sm">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
              </SheetTitle>
              <SheetDescription className="text-gray-600 text-sm">
                {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable Messages Area */}
          <div 
            className="flex-1 overflow-y-auto touch-pan-y"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
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
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Fixed Input Area */}
          {!isCompleted && (
            <div className="flex-shrink-0 p-4 border-t bg-white/95 backdrop-blur-sm safe-area-bottom">
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
