
import { useLanguage } from "@/contexts/LanguageContext";
import { AIAssessmentProps } from "./ai-assessment/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAssessmentState } from "@/hooks/useAssessmentState";
import { useKeyboardDetection } from "@/hooks/useKeyboardDetection";
import { MobileAssessmentDialog } from "./ai-assessment/MobileAssessmentDialog";
import { DesktopAssessmentDialog } from "./ai-assessment/DesktopAssessmentDialog";

export const AIAssessment = ({ open, onOpenChange }: AIAssessmentProps) => {
  const isMobile = useIsMobile();
  
  const assessmentState = useAssessmentState();
  const keyboardState = useKeyboardDetection(assessmentState.messageInputRef);

  const contentProps = {
    ...assessmentState,
    keyboardState
  };

  if (isMobile) {
    return (
      <MobileAssessmentDialog 
        open={open} 
        onOpenChange={onOpenChange} 
        contentProps={contentProps} 
      />
    );
  }

  return (
    <DesktopAssessmentDialog 
      open={open} 
      onOpenChange={onOpenChange} 
      contentProps={contentProps} 
    />
  );
};
