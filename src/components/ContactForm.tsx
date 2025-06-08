
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ContactForm = () => {
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

    console.log('=== CONTACT FORM SUBMISSION START ===');
    console.log('Form data:', formData);

    try {
      const submissionData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        company: formData.company || null,
        message: formData.message,
      };

      console.log('Submitting to Supabase:', submissionData);

      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([submissionData])
        .select();

      console.log('Supabase response data:', data);
      console.log('Supabase response error:', error);

      if (error) {
        console.error('=== SUPABASE ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        throw error;
      }

      console.log('=== SUBMISSION SUCCESS ===');
      console.log('Inserted data:', data);

      toast({
        title: isHebrew ? "ההודעה נשלחה בהצלחה!" : "Message sent successfully!",
        description: isHebrew 
          ? "תודה על פנייתך. נחזור אליך בהקדם האפשרי." 
          : "Thank you for contacting us. We'll get back to you soon.",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: "",
      });
    } catch (error) {
      console.error('=== CATCH BLOCK ERROR ===');
      console.error('Full error object:', error);
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
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">
        {isHebrew ? "שלח לנו הודעה" : "Send us a message"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
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
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
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
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
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
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
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
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
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
            rows={5}
            value={formData.message}
            onChange={handleChange}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
            placeholder={isHebrew ? "ספר לנו על העסק שלך ואיך נוכל לעזור" : "Tell us about your business and how we can help"}
          />
        </div>
        
        <Button 
          type="submit"
          disabled={isSubmitting}
          size="lg" 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Send className="mr-2 h-5 w-5" />
          {isSubmitting 
            ? (isHebrew ? "שולח..." : "Sending...") 
            : (isHebrew ? "שלח הודעה" : "Send Message")
          }
        </Button>
      </form>
    </div>
  );
};
