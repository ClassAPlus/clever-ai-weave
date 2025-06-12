
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Bot, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroContentProps {
  onContactClick: () => void;
  onAIAssessmentClick: () => void;
}

export const HeroContent = ({ onContactClick, onAIAssessmentClick }: HeroContentProps) => {
  const { isHebrew } = useLanguage();

  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
        <Zap className="h-4 w-4 text-yellow-400" />
        <span className="text-sm text-gray-300">
          {isHebrew ? "בינה מלאכותית לעסק שלך" : "AI for Your Business"}
        </span>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
        {isHebrew ? (
          <>
            הפוך לעסק חכם
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent" dir="rtl">
              בעזרת אינטגרצית AI
            </span>
          </>
        ) : (
          <>
            Make Your Business
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Smarter with AI
            </span>
          </>
        )}
      </h1>
      
      <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
        {isHebrew ? "שדרג את העסק שלך עם אינטגרצית בינה מלאכותית יעילה וחסכוניות. מצ'אטבוטים ועד ניתוח נתונים וביצוע משימות, אנו בונים בינה מלאכותית ידידותית, ומותאמת לצרכים שלך" : "Empower your business with cost-effective AI integrations. From chatbots to data analytics, we make AI simple, fast, and affordable."}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          size="lg" 
          onClick={onContactClick}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg group"
        >
          {isHebrew ? "התחל עכשיו" : "Get Started Now"}
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <Button 
          size="lg" 
          onClick={onAIAssessmentClick}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
        >
          {/* Animated background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Shine animation */}
          <div className="absolute inset-0 -top-0 -left-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shine"></div>
          
          <Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200 relative z-10" />
          <span className="relative z-10">
            {isHebrew ? "בוט הערכה חינמית" : "Free AI Assessment Bot"}
          </span>
        </Button>
      </div>
    </div>
  );
};
