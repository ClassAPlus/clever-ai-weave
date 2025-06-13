
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
  const { isCompleted, keyboardState } = contentProps;
  
  const content = AssessmentDialogContent(contentProps);
  
  // Calculate dynamic height based on keyboard state
  const containerHeight = keyboardState.isVisible 
    ? keyboardState.availableHeight
    : '100vh';
  
  // Calculate bottom padding for iOS safe area
  const bottomPadding = keyboardState.isVisible 
    ? `${Math.max(0, keyboardState.height)}px`
    : 'env(safe-area-inset-bottom, 0px)';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed inset-0 max-w-none max-h-none p-0 m-0 rounded-none border-0 bg-gradient-to-br from-white via-gray-50 to-purple-50/30 overflow-hidden"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: containerHeight,
          maxWidth: '100vw',
          maxHeight: containerHeight,
          transform: 'none',
          paddingBottom: bottomPadding
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

        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-100 py-3 bg-white/95 backdrop-blur-sm" style={{ height: '60px' }}>
            <div className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center px-4">
              {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
            </div>
            <p className="text-center text-gray-600 mt-1 text-sm px-4">
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </p>
          </div>

          {/* Chat Content */}
          <div 
            className="flex-1 min-h-0 overflow-hidden"
            style={{
              height: isCompleted 
                ? `calc(${containerHeight} - 60px)` 
                : `calc(${containerHeight} - 120px)` // 60px header + 60px input
            }}
          >
            <ScrollArea 
              className="h-full w-full" 
              ref={contentProps.scrollAreaRef}
            >
              <div className="p-2 pb-4">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
                
                <content.ChatMessages />
                <content.AssessmentSummary />
              </div>
            </ScrollArea>
          </div>

          {/* Input - Fixed at bottom when keyboard is visible */}
          {!isCompleted && (
            <div 
              className="flex-shrink-0"
              style={{ 
                height: '60px',
                position: keyboardState.isVisible ? 'absolute' : 'relative',
                bottom: keyboardState.isVisible ? '0' : 'auto',
                left: keyboardState.isVisible ? '0' : 'auto',
                right: keyboardState.isVisible ? '0' : 'auto',
                zIndex: 50
              }}
            >
              <content.MessageInput />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
