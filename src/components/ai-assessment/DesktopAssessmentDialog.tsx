
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { AssessmentDialogContent } from "./AssessmentDialogContent";
import MessageInput from "./MessageInput";

interface DesktopAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentProps: Parameters<typeof AssessmentDialogContent>[0];
}

export const DesktopAssessmentDialog = ({ open, onOpenChange, contentProps }: DesktopAssessmentDialogProps) => {
  const { isHebrew } = useLanguage();
  const { isCompleted, summary, setCurrentMessage } = contentProps;
  
  const content = AssessmentDialogContent(contentProps);

  const handleSend = async (message: string) => {
    console.log('DesktopAssessmentDialog handleSend called with message:', message);
    // Set the current message so AssessmentChat can use it
    setCurrentMessage(message);
    await content.sendMessage();
  };

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
            ref={contentProps.scrollAreaRef}
          >
            <div className="flex flex-col min-h-full p-1">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-pink-100/20 pointer-events-none rounded-lg"></div>
              
              <div className="flex-1">
                <content.ChatMessages />
              </div>

              <content.AssessmentSummary />
            </div>
          </ScrollArea>

          {!isCompleted && (
            <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-100 pt-4">
              <MessageInput
                onSend={handleSend}
                isSending={contentProps.isLoading}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
