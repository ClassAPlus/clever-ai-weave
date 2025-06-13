
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
  const { isCompleted } = contentProps;
  
  const content = AssessmentDialogContent(contentProps);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-full h-screen max-h-screen p-0 m-0 border-0 rounded-none"
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

        <div className="flex flex-col h-full bg-gradient-to-br from-white via-gray-50 to-purple-50/30">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-100 p-4 bg-white/95">
            <div className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
              {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
            </div>
            <p className="text-center text-gray-600 mt-2 text-sm">
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </p>
          </div>

          {/* Chat Content */}
          <div className="flex-1 relative">
            <ScrollArea 
              className="h-full" 
              ref={contentProps.scrollAreaRef}
            >
              <div className="p-4 pb-20">
                <content.ChatMessages />
                <content.AssessmentSummary />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          {!isCompleted && <content.MessageInput />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
