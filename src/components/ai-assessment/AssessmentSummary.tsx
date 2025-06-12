
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface AssessmentSummaryProps {
  summary: string;
  onResetAssessment: () => void;
}

export const AssessmentSummary = ({ summary, onResetAssessment }: AssessmentSummaryProps) => {
  const { isHebrew } = useLanguage();

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
      <h3 className="font-semibold text-lg mb-2 text-purple-800">
        {isHebrew ? "המלצות מותאמות אישית" : "Your Personalized Recommendations"}
      </h3>
      <div className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</div>
      <Button
        onClick={onResetAssessment}
        className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isHebrew ? "התחל הערכה חדשה" : "Start New Assessment"}
      </Button>
    </div>
  );
};
