
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CTASection = () => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            first_name: "Newsletter",
            last_name: "Subscriber",
            email: email,
            message: isHebrew 
              ? "בקשה לקבלת הערכה חינמית ומותאמת אישית" 
              : "Request for free personalized assessment",
          }
        ]);

      if (error) throw error;

      toast({
        title: isHebrew ? "!נרשמת בהצלחה" : "Successfully registered!",
        description: isHebrew 
          ? "נקבל קשר תוך שעה עם המלצות מותאמות אישית" 
          : "We'll contact you within an hour with personalized recommendations",
      });

      setEmail("");
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: isHebrew ? "שגיאה ברישום" : "Registration error",
        description: isHebrew 
          ? "אירעה שגיאה. אנא נסה שוב או צור קשר ישירות" 
          : "An error occurred. Please try again or contact us directly",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={isHebrew ? "האימייל שלך" : "Your email address"} 
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            <Button 
              type="submit"
              disabled={isSubmitting}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              {isSubmitting 
                ? (isHebrew ? "...שולח" : "Sending...")
                : (isHebrew ? "התחל עכשיו" : "Get Started")
              }
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
          
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
                {isHebrew ? "התקנה מהירה" : "Quick Setup"}
              </div>
              <div className="text-gray-300 text-center">
                {isHebrew ? "הטמעה ובניה מהירה עם מינימום עבודה" : "Within 15 minutes"}
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
