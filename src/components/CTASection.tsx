
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const CTASection = () => {
  const { isHebrew } = useLanguage();

  return (
    <section id="contact" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl p-12 border border-white/20 backdrop-blur-sm text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            {isHebrew ? (
              <>
                התחילו את המסע של
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  העסק המקומי שלכם עם AI היום
                </span>
              </>
            ) : (
              <>
                Start Your Local Business
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Journey Today
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            {isHebrew 
              ? "קבלו פתרונות בינה מלאכותית המיועדים במיוחד לצרכי העסק המקומי שלכם, במחירים שמתאימים לתקציב שלכם."
              : "Get AI solutions specifically designed for your local business needs, at prices that make sense for your budget."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder={isHebrew ? "הכניסו את המייל שלכם" : "Enter your email"} 
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              {isHebrew ? "הערכת AI מקומית חינם" : "Free Local AI Assessment"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-400 mb-8">
            {isHebrew 
              ? "ההערכה החינמית כוללת המלצות בינה מלאכותית מותאמות אישית לסוג העסק הספציפי שלכם"
              : "Free assessment includes personalized AI recommendations for your specific business type"
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {isHebrew ? "תמחור מקומי" : "Local Pricing"}
              </div>
              <div className="text-gray-300">
                {isHebrew ? "תוכניות חודשיות בהישג יד" : "Affordable monthly plans"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {isHebrew ? "הקמה מהירה" : "Quick Setup"}
              </div>
              <div className="text-gray-300">
                {isHebrew ? "שילוב של 15 דקות" : "15-minute integration"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {isHebrew ? "תמיכה מקומית" : "Local Support"}
              </div>
              <div className="text-gray-300">
                {isHebrew ? "מאנשים שמבינים את האזור שלכם" : "From people who understand your area"}
              </div>
            </div>
          </div>
        </div>
        
        <footer className="mt-20 text-center text-gray-400">
          <p>
            {isHebrew 
              ? "© 2024 LocalEdgeAI. מביאים פתרונות בינה מלאכותית מתקדמים לעסקים מקומיים בכל מקום."
              : "© 2024 LocalEdgeAI. Bringing advanced AI solutions to local businesses everywhere."
            }
          </p>
        </footer>
      </div>
    </section>
  );
};
