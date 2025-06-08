
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { ContactSheet } from "./ContactSheet";

export const HeroContent = () => {
  const { isHebrew } = useLanguage();
  const [showContactSheet, setShowContactSheet] = useState(false);

  return (
    <>
      <div className="mb-8">
        <div className={`inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6 ${isHebrew ? 'flex-row-reverse' : ''}`}>
          <Sparkles className={`h-4 w-4 ${isHebrew ? 'mr-0 ml-2' : 'mr-2'}`} />
          {isHebrew ? "בינה מלאכותית מקומית ומתקדמת" : "Advanced Local AI Solutions"}
        </div>
        
        <h1 className={`text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center`}>
          {isHebrew ? (
            <>
              הכוח של <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                LocalEdgeAI
              </span>
            </>
          ) : (
            <>
              The Power of <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                LocalEdgeAI
              </span>
            </>
          )}
        </h1>
        
        <p className={`text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed text-center`}>
          {isHebrew 
            ? "פתרונות בינה מלאכותית מתקדמים לעסקים, עם עיבוד מקומי מהיר, פרטיות מלאה ויכולות מותאמות אישית לכל ארגון"
            : "Advanced AI solutions for businesses with lightning-fast local processing, complete privacy, and custom capabilities tailored to your organization"
          }
        </p>
        
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isHebrew ? 'sm:flex-row-reverse' : ''}`}>
          <Button 
            size="lg" 
            onClick={() => setShowContactSheet(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 text-lg px-8 py-4"
          >
            {isHebrew ? "התחל עכשיו" : "Get Started"}
            <ArrowRight className={`h-5 w-5 ${isHebrew ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white text-lg px-8 py-4"
            onClick={() => {
              const element = document.getElementById('features');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {isHebrew ? "למד עוד" : "Learn More"}
          </Button>
        </div>
      </div>

      <ContactSheet 
        open={showContactSheet} 
        onOpenChange={setShowContactSheet}
      />
    </>
  );
};
