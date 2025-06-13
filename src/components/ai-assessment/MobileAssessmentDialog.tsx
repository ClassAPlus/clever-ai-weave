
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] max-h-[90vh] p-0 bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            {isHebrew ? "הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "Free LocalEdgeAI Assessment"}
          </SheetTitle>
          <SheetDescription>
            {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
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
          <div className="flex-1 relative min-h-0">
            <ScrollArea 
              className="h-full" 
              ref={contentProps.scrollAreaRef}
            >
              <div className="p-4 pb-24">
                <content.ChatMessages />
                <content.AssessmentSummary />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          {!isCompleted && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
              <content.MessageInput />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
