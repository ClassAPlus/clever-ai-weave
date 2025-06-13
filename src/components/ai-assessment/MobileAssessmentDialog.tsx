
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

  // Handle initial positioning to avoid bottom toolbar overlap
  useEffect(() => {
    if (open && messagesContainerRef.current) {
      // Delay to ensure DOM is ready and safe areas are calculated
      setTimeout(() => {
        if (messagesContainerRef.current) {
          // Scroll up slightly to ensure content is visible above bottom toolbar
          messagesContainerRef.current.scrollTop = 40;
        }
      }, 150);
    }
  }, [open]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages.length]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom"
        className="w-full border-0 p-0 h-screen max-h-screen overflow-hidden"
      >
        <div className="flex flex-col h-full bg-gradient-to-br from-white via-gray-50 to-purple-50/30">
          {/* Header */}
          <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b pt-4">
            <div className="p-4 pb-2">
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

          {/* Messages Container with proper bottom spacing */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pb-6"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              paddingBottom: 'max(env(safe-area-inset-bottom), 24px)'
            }}
          >
            <div className="pt-4">
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

          {/* Input Area with proper bottom safe area */}
          {!isCompleted && (
            <div 
              className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t"
              style={{
                paddingBottom: `max(env(safe-area-inset-bottom), 16px)`
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
