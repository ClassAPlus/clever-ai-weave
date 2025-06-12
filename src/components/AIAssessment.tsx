import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { AIAssessmentProps } from "./ai-assessment/types";
import { ChatMessages } from "./ai-assessment/ChatMessages";
import { AssessmentSummary } from "./ai-assessment/AssessmentSummary";
import { MessageInput } from "./ai-assessment/MessageInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAssessmentState } from "@/hooks/useAssessmentState";
import { AssessmentChat } from "./ai-assessment/AssessmentChat";
import { useEffect, useState } from "react";

export const AIAssessment = ({ open, onOpenChange }: AIAssessmentProps) => {
  const { isHebrew } = useLanguage();
  const isMobile = useIsMobile();
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

  // Enhanced mobile viewport handling
  useEffect(() => {
    if (!isMobile) return;

    const handleViewportChange = () => {
      // Use visual viewport API if available
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    const handleFocus = () => {
      // Prevent zoom on input focus
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }

      // Small delay to handle keyboard appearance
      setTimeout(() => {
        handleViewportChange();
        
        // Scroll to bottom when keyboard appears
        if (scrollAreaRef.current) {
          const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }, 150);
    };

    const handleBlur = () => {
      // Reset viewport meta
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
      
      setTimeout(() => {
        setViewportHeight(window.innerHeight);
      }, 150);
    };

    // Add event listeners
    const inputElement = messageInputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
      inputElement.addEventListener('blur', handleBlur);
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    window.addEventListener('resize', handleViewportChange);

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
        inputElement.removeEventListener('blur', handleBlur);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [isMobile, messageInputRef, scrollAreaRef]);

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
          className="fixed inset-0 w-full max-w-none p-0 m-0 rounded-none border-0 flex flex-col overflow-hidden shadow-2xl bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
          style={{ 
            height: `${viewportHeight}px`,
            maxHeight: `${viewportHeight}px`
          }}
        >
          <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0 px-4 pt-4">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
              {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
            </DialogTitle>
            <p className="text-center text-gray-600 mt-2 text-sm">
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ScrollArea 
              className="flex-1 relative" 
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

            {!isCompleted && (
              <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-100 px-4 py-3">
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
  }

  // Desktop layout remains the same
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[80vh] max-h-[80vh] p-6 overflow-hidden shadow-2xl bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
      >
        <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
            {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
          </p>
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
