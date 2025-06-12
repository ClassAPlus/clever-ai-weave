
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, RotateCcw, Phone, ArrowRight, Users } from "lucide-react";

interface AssessmentSummaryProps {
  summary: string;
  onResetAssessment: () => void;
  onRequestContact?: () => void;
  stage?: 'initial' | 'assessment_complete' | 'contact_collected';
  showContactButton?: boolean;
}

export const AssessmentSummary = ({ 
  summary, 
  onResetAssessment, 
  onRequestContact,
  stage = 'assessment_complete',
  showContactButton = false
}: AssessmentSummaryProps) => {
  const { isHebrew } = useLanguage();

  if (stage === 'contact_collected') {
    return (
      <div className="mb-4 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-200/50 shadow-lg backdrop-blur-sm relative z-10 animate-fade-in">
        <div className="absolute top-4 right-4 opacity-20">
          <Phone className="w-6 h-6 text-green-600" />
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-xl bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
            {isHebrew ? "תודה על פנייתך!" : "Thank You for Your Interest!"}
          </h3>
        </div>
        
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6 bg-white/60 p-4 rounded-xl border border-white/50">
          {summary}
        </div>
        
        <Button
          onClick={onResetAssessment}
          className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        >
          <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
          {isHebrew ? "התחל הערכה חדשה" : "Start New Assessment"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-4 animate-fade-in">
      {/* Stylish Recommendations Display */}
      <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl border border-purple-200/50 shadow-lg backdrop-blur-sm relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-100/30 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-2xl bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                {isHebrew ? "המלצות מותאמות אישית" : "Your Personalized AI Recommendations"}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {isHebrew ? "מ-LocalEdgeAI במיוחד עבורך" : "Crafted by LocalEdgeAI specifically for you"}
              </p>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-6 bg-white/70 backdrop-blur-sm p-5 rounded-xl border border-white/50 shadow-inner">
            <div className="whitespace-pre-wrap font-medium text-gray-800">
              {summary}
            </div>
          </div>
        </div>
      </div>

      {/* Engaging Contact Request Button */}
      {showContactButton && (
        <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/50 shadow-lg">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h4 className="text-lg font-bold text-gray-800">
                {isHebrew ? "מוכן לשדרג את העסק שלך?" : "Ready to Transform Your Business?"}
              </h4>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              {isHebrew 
                ? "צוות המומחים של LocalEdgeAI מוכן לעזור לך להטמיע פתרונות AI מותאמים אישית. בואו נדבר!"
                : "LocalEdgeAI's expert team is ready to help you implement custom AI solutions. Let's discuss your next steps!"
              }
            </p>
            
            <Button
              onClick={onRequestContact}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group px-8 py-3 text-base font-semibold"
            >
              <Phone className="w-5 h-5 mr-2" />
              {isHebrew ? "בואו נתחיל!" : "Let's Get Started!"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <Button
          onClick={onResetAssessment}
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 group"
        >
          <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
          {isHebrew ? "התחל הערכה חדשה" : "Start New Assessment"}
        </Button>
      </div>
    </div>
  );
};
