
import { Brain, Code, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const HeroFeatures = () => {
  const { isHebrew } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
        <Brain className="h-12 w-12 text-purple-400 mb-4" />
        <h3 className={`text-xl font-semibold text-white mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
          {isHebrew ? "חכם ופשוט" : "Smart & Simple"}
        </h3>
        <p className={`text-gray-300 ${isHebrew ? 'text-right' : 'text-left'}`}>
          {isHebrew ? "AI שמבין את העסק שלך ופועל בלי להסבך" : "AI that understands your business and works without complication"}
        </p>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.2s' }}>
        <Code className="h-12 w-12 text-blue-400 mb-4" />
        <h3 className={`text-xl font-semibold text-white mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
          {isHebrew ? "התקנה מהירה" : "Fast Setup"}
        </h3>
        <p className={`text-gray-300 ${isHebrew ? 'text-right' : 'text-left'}`}>
          {isHebrew ? "ללא צורך במומחה טכני או השקעה גדולה" : "No tech expert or major investment required"}
        </p>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.4s' }}>
        <Zap className="h-12 w-12 text-yellow-400 mb-4" />
        <h3 className={`text-xl font-semibold text-white mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
          {isHebrew ? "תמיכה מקומית" : "Local Support"}
        </h3>
        <p className={`text-gray-300 ${isHebrew ? 'text-right' : 'text-left'}`}>
          {isHebrew ? "צוות ישראלי שזמין בכל שעה לעזור לך" : "Always available to help when you need it"}
        </p>
      </div>
    </div>
  );
};
