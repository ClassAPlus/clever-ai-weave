
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContactSheet = ({ open, onOpenChange }: ContactSheetProps) => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submissionData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        company: formData.company || null,
        message: formData.message,
      };

      const { error } = await supabase
        .from('contact_submissions')
        .insert([submissionData]);

      if (error) throw error;

      toast({
        title: isHebrew ? "ההודעה נשלחה בהצלחה!" : "Message sent successfully!",
        description: isHebrew 
          ? "תודה על פנייתך. נחזור אליך בהקדם האפשרי." 
          : "Thank you for contacting us. We'll get back to you soon.",
      });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isHebrew ? "שגיאה בשליחת ההודעה" : "Error sending message",
        description: isHebrew 
          ? "אירעה שגיאה בשליחת ההודעה. אנא נסה שוב." 
          : "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-slate-900/95 border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white">
            {isHebrew ? "צור קשר" : "Contact Us"}
          </SheetTitle>
          <SheetDescription className="text-gray-300">
            {isHebrew 
              ? "ספר לנו על העסק שלך ואיך נוכל לעזור"
              : "Tell us about your business and how we can help"
            }
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-gray-300">
                {isHebrew ? "שם פרטי" : "First Name"}
              </Label>
              <Input 
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder={isHebrew ? "השם הפרטי שלך" : "Your first name"}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-gray-300">
                {isHebrew ? "שם משפחה" : "Last Name"}
              </Label>
              <Input 
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                placeholder={isHebrew ? "שם המשפחה שלך" : "Your last name"}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className="text-gray-300">
              {isHebrew ? "אימייל" : "Email"}
            </Label>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              placeholder={isHebrew ? "האימייל שלך" : "Your email address"}
            />
          </div>
          
          <div>
            <Label htmlFor="company" className="text-gray-300">
              {isHebrew ? "חברה" : "Company"}
            </Label>
            <Input 
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              placeholder={isHebrew ? "שם החברה שלך" : "Your company name"}
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-gray-300">
              {isHebrew ? "הודעה" : "Message"}
            </Label>
            <Textarea 
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              placeholder={isHebrew ? "ספר לנו על העסק שלך ואיך נוכל לעזור" : "Tell us about your business and how we can help"}
            />
          </div>
          
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting 
              ? (isHebrew ? "שולח..." : "Sending...") 
              : (isHebrew ? "שלח הודעה" : "Send Message")
            }
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
