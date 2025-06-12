import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { AIAssessmentProps } from "./ai-assessment/types";
import { ChatMessages } from "./ai-assessment/ChatMessages";
import { AssessmentSummary } from "./ai-assessment/AssessmentSummary";
import { MessageInput } from "./ai-assessment/MessageInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAssessmentState } from "@/hooks/useAssessmentState";
import { AssessmentChat } from "./ai-assessment/AssessmentChat";
import { useEffect } from "react";

export const AIAssessment = ({ open, onOpenChange }: AIAssessmentProps) => {
  const { isHebrew } = useLanguage();
  const isMobile = useIsMobile();
  
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
    resetAssessment
  } = useAssessmentState();

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
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length]);

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 m-0 rounded-none border-0 flex flex-col overflow-hidden shadow-2xl bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
          style={{ 
            height: '100dvh',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
          aria-describedby="ai-assessment-description"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {isHebrew ? "הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "Free LocalEdgeAI Assessment"}
            </DialogTitle>
            <DialogDescription id="ai-assessment-description">
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </DialogDescription>
          </DialogHeader>

          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3 bg-white/95 backdrop-blur-sm">
            <div className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
              {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
            </div>
            <p className="text-center text-gray-600 mt-1 text-sm">
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </p>
          </div>

          {/* Chat Content - fills remaining space above input */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0" style={{ paddingBottom: isCompleted ? '0' : '100px' }}>
            <ScrollArea 
              className="flex-1" 
              ref={scrollAreaRef}
            >
              <div className="flex flex-col min-h-full px-4 py-2">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
                
                <div className="flex-1">
                  <ChatMessages messages={messages} isLoading={isLoading} />
                </div>

                {isCompleted && summary && (
                  <AssessmentSummary 
                    summary={summary} 
                    onResetAssessment={resetAssessment} 
                    onRequestContact={handleContactRequest}
                    stage={stage}
                    showContactButton={showContactButton}
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input - fixed at bottom when not completed */}
          {!isCompleted && (
            <div 
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50"
              style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)'
              }}
            >
              <MessageInput
                ref={messageInputRef}
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                onSendMessage={sendMessage}
                isLoading={isLoading}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop layout remains the same
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[80vh] max-h-[80vh] p-6 overflow-hidden shadow-2xl bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
        aria-describedby="ai-assessment-description"
      >
        <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
            {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
          </DialogTitle>
          <DialogDescription id="ai-assessment-description" className="text-center text-gray-600 mt-2">
            {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea 
            className="flex-1 relative" 
            ref={scrollAreaRef}
          >
            <div className="flex flex-col min-h-full p-1">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
              
              <div className="flex-1">
                <ChatMessages messages={messages} isLoading={isLoading} />
              </div>

              {isCompleted && summary && (
                <AssessmentSummary 
                  summary={summary} 
                  onResetAssessment={resetAssessment} 
                  onRequestContact={handleContactRequest}
                  stage={stage}
                  showContactButton={showContactButton}
                />
              )}
            </div>
          </ScrollArea>

          {!isCompleted && (
            <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-100 pt-4">
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
      </DialogContent>
    </Dialog>
  );
};
