
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { ContactSheet } from "./ContactSheet";

export const CTASection = () => {
  const { isHebrew } = useLanguage();
  const [showContactSheet, setShowContactSheet] = useState(false);

  return (
    <section id="contact" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl p-12 border border-white/20 backdrop-blur-sm text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            {isHebrew ? (
              <>
                הפוך את העסק שלך לחכם יותר
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  היום
                </span>
              </>
            ) : (
              <>
                Make Your Business Smarter
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Today
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            {isHebrew 
              ? ".קבל הערכה חינמית ומותאמת אישית לעסק שלך. ללא התחייבות, ללא תשלום"
              : "Get a free, personalized assessment for your business. No commitment, no payment required."
            }
          </p>
          
          <Button 
            onClick={() => setShowContactSheet(true)}
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group mb-8"
          >
            {isHebrew ? "התחל עכשיו" : "Get Started"}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-sm text-gray-400 mb-8">
            {isHebrew 
              ? "ניצור קשר עם המלצות מותאמות אישית לסוג העסק שלך"
              : "We'll contact you with personalized recommendations for your business type"
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
                {isHebrew ? "התקנה מהירה" : "Fast Implementation"}
              </div>
              <div className="text-gray-300 text-center">
                {isHebrew ? "הטמעה מהירה ופשוטה" : "Quick and simple deployment"}
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

      <ContactSheet 
        open={showContactSheet} 
        onOpenChange={setShowContactSheet}
      />
    </section>
  );
};
