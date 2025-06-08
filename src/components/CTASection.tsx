
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
                הפוך את העסק שלך לחכם יותר
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  תוך 15 דקות
                </span>
              </>
            ) : (
              <>
                Make Your Business Smarter
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  in 15 Minutes
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            {isHebrew 
              ? "קבל הערכה חינמית ומותאמת אישית לעסק שלך. ללא התחייבות, ללא תשלום."
              : "Get a free, personalized assessment for your business. No commitment, no payment required."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder={isHebrew ? "האימייל שלך" : "Your email address"} 
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              {isHebrew ? "התחל עכשיו" : "Get Started"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-400 mb-8">
            {isHebrew 
              ? "נקבל קשר תוך שעה עם המלצות מותאמות אישית לסוג העסק שלך"
              : "We'll contact you within an hour with personalized recommendations for your business type"
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {isHebrew ? "פתרונות מותאמים" : "Custom Solutions"}
              </div>
              <div className="text-gray-300 text-center">
                {isHebrew ? "מותאמים לעסק שלך" : "Tailored to your business"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {isHebrew ? "התקנה מהירה" : "Quick Setup"}
              </div>
              <div className="text-gray-300 text-center">
                {isHebrew ? "תוך 15 דקות" : "Within 15 minutes"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {isHebrew ? "תמיכה מקומית" : "Local Support"}
              </div>
              <div className="text-gray-300 text-center">
                {isHebrew ? "צוות ישראלי מנוסה" : "Experienced team"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
