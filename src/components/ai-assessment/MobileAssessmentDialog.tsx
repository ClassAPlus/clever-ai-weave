
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
  
  // Calculate available height for chat content
  const inputHeight = isCompleted ? 0 : 80; // Approximate input container height
  const headerHeight = 120; // Approximate header height
  const availableHeight = keyboardState.availableHeight - headerHeight - inputHeight;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="mobile-dialog-content-ios"
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
          margin: 0,
          padding: 0,
          border: 0,
          borderRadius: 0,
          background: 'linear-gradient(to bottom right, white, rgb(249, 250, 251), rgba(147, 51, 234, 0.05))',
          transform: 'none',
          overflow: 'hidden',
          /* Hardware acceleration */
          WebkitTransform: 'translate3d(0,0,0)',
          /* Remove transitions */
          transition: 'none !important'
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

        <div 
          className="mobile-layout-ios"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100%',
            position: 'relative'
          }}
        >
          {/* Header - Fixed height */}
          <div 
            className="dialog-header-ios"
            style={{
              flexShrink: 0,
              borderBottom: '1px solid rgb(229, 231, 235)',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              zIndex: 100
            }}
          >
            <div 
              className="header-title"
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, rgb(147, 51, 234), rgb(219, 39, 119), rgb(37, 99, 235))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
            </div>
            <p 
              style={{
                textAlign: 'center',
                color: 'rgb(107, 114, 128)',
                marginTop: '4px',
                fontSize: '14px'
              }}
            >
              {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
            </p>
          </div>

          {/* Chat Content - Takes remaining space */}
          <div 
            className="chat-container-ios"
            style={{
              position: 'relative',
              height: `${availableHeight}px`,
              overflow: 'hidden',
              flex: '0 0 auto'
            }}
          >
            <ScrollArea 
              className="h-full w-full ios-scroll" 
              ref={contentProps.scrollAreaRef}
              tabIndex={-1}
              style={{ 
                outline: 'none',
                height: '100%'
              }}
            >
              <div style={{ 
                padding: '16px', 
                paddingBottom: '24px',
                minHeight: '100%'
              }}>
                <content.ChatMessages />
                <content.AssessmentSummary />
              </div>
            </ScrollArea>
          </div>

          {/* Input - Positioned absolutely at bottom */}
          {!isCompleted && <content.MessageInput />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
