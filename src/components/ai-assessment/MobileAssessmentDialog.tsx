
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
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          transform: 'none'
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

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-100 py-3 bg-white/95 backdrop-blur-sm" style={{ height: '70px' }}>
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
                ? 'calc(100vh - 70px)' 
                : 'calc(100vh - 150px)' // 70px header + 80px input area
            }}
          >
            <ScrollArea 
              className="h-full w-full" 
              ref={contentProps.scrollAreaRef}
            >
              <div className="p-4 pb-6">
                <content.ChatMessages />
                <content.AssessmentSummary />
              </div>
            </ScrollArea>
          </div>

          {/* Input - Always visible at bottom */}
          {!isCompleted && (
            <div 
              className="flex-shrink-0 bg-white border-t border-gray-100"
              style={{ 
                height: '80px',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
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
