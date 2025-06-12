
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, RotateCcw, Phone } from "lucide-react";

interface AssessmentSummaryProps {
  summary: string;
  onResetAssessment: () => void;
  stage?: 'assessment_complete' | 'contact_collected';
}

export const AssessmentSummary = ({ summary, onResetAssessment, stage = 'assessment_complete' }: AssessmentSummaryProps) => {
  const { isHebrew } = useLanguage();

  return (
    <div className="mb-4 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl border border-purple-200/50 shadow-lg backdrop-blur-sm relative z-10 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="w-6 h-6 text-purple-600" />
      </div>
      
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          {stage === 'contact_collected' ? (
            <Phone className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
        <h3 className="font-bold text-xl bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
          {stage === 'contact_collected' ? (
            isHebrew ? "תודה על פנייתך!" : "Thank You for Your Interest!"
          ) : (
            isHebrew ? "המלצות מותאמות אישית" : "Your Personalized Recommendations"
          )}
        </h3>
      </div>
      
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6 bg-white/60 p-4 rounded-xl border border-white/50">
        {summary}
      </div>
      
      <Button
        onClick={onResetAssessment}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
      >
        <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
        {isHebrew ? "התחל הערכה חדשה" : "Start New Assessment"}
      </Button>
    </div>
  );
};
