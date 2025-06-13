
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { AssessmentDialogContent } from "./AssessmentDialogContent";

interface MobileAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentProps: Parameters<typeof AssessmentDialogContent>[0];
}

export const MobileAssessmentDialog = ({ open, onOpenChange, contentProps }: MobileAssessmentDialogProps) => {
  const { isHebrew } = useLanguage();
  const { isCompleted, messages } = contentProps;
  
  const content = AssessmentDialogContent(contentProps);
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right"
        className="w-full bg-gradient-to-br from-white via-gray-50 to-purple-50/30"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
          </SheetTitle>
          <SheetDescription className="text-gray-600">
            {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <content.ChatMessages />
          <content.AssessmentSummary />
          
          {!isCompleted && (
            <div className="border-t pt-4">
              <content.MessageInput />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
