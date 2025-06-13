
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { AssessmentDialogContent } from "./AssessmentDialogContent";

interface MobileAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentProps: Parameters<typeof AssessmentDialogContent>[0];
}

export const MobileAssessmentDialog = ({ open, onOpenChange, contentProps }: MobileAssessmentDialogProps) => {
  const { isHebrew } = useLanguage();
  const { keyboardState, isCompleted } = contentProps;
  
  const content = AssessmentDialogContent(contentProps);
  
  // iOS detection for specific styling
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const mobileHeight = keyboardState.isVisible ? keyboardState.availableHeight : window.innerHeight;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`fixed inset-0 w-screen max-w-none max-h-none p-0 m-0 rounded-none border-0 bg-gradient-to-br from-white via-gray-50 to-purple-50/30 transform-none translate-x-0 translate-y-0 left-0 ${
          isIOS && keyboardState.isVisible ? 'top-0' : 'top-0'
        }`}
        style={{ 
          height: `${mobileHeight}px`,
          ...(isIOS && keyboardState.isVisible && {
            position: 'fixed',
            top: '0px',
            transform: 'none'
          })
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

        <div className="flex flex-col w-screen" style={{ height: `${mobileHeight}px` }}>
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3 bg-white/95 backdrop-blur-sm w-full">
            <div className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
              {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
            </div>
            <p className="text-center text-gray-600 mt-1 text-sm">
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </p>
          </div>

          {/* Chat Content */}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <ScrollArea 
              className="h-full w-full" 
              ref={contentProps.scrollAreaRef}
            >
              <div className="w-full">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
                
                <content.ChatMessages />
                <content.AssessmentSummary />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          {!isCompleted && (
            <div className={`flex-shrink-0 bg-white border-t border-gray-100 w-full ${
              isIOS && keyboardState.isVisible ? 'pb-2' : 'pb-4'
            }`}>
              <div className="w-full px-4 py-3">
                <content.MessageInput />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
