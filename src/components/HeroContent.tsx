
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Zap, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeroContentProps {
  onContactClick: () => void;
}

export const HeroContent = ({ onContactClick }: HeroContentProps) => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmittingEmail(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            first_name: "Quick",
            last_name: "Assessment",
            email: email,
            message: isHebrew 
              ? "בקשה לקבלת הערכה חינמית ומותאמת אישית של 30 דקות" 
              : "Request for free 30-minute personalized assessment",
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
      setShowEmailInput(false);
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
      setIsSubmittingEmail(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailSubmit(e as any);
    }
  };

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
              AI בעזרת אינטגרציית
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
        
        {!showEmailInput ? (
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => setShowEmailInput(true)}
            className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
          >
            {isHebrew ? "הערכה חינמית של 30 דקות" : "Free 30-Minute AI Assessment"}
          </Button>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                autoFocus
                placeholder={isHebrew ? "האימייל שלך" : "Your email address"} 
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 w-64"
              />
            </div>
            <Button 
              type="submit"
              disabled={isSubmittingEmail}
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isSubmittingEmail 
                ? (isHebrew ? "...שולח" : "Sending...")
                : (isHebrew ? "שלח" : "Send")
              }
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
