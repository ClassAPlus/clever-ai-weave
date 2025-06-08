
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const Contact = () => {
  const { isHebrew } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {isHebrew ? "צור קשר" : "Contact Us"}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {isHebrew 
                ? "מוכנים להפוך את העסק שלכם לחכם יותר? בואו נתחיל בשיחה"
                : "Ready to make your business smarter? Let's start the conversation"
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
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
                    type="email"
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
                    rows={5}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                    placeholder={isHebrew ? "ספר לנו על העסק שלך ואיך נוכל לעזור" : "Tell us about your business and how we can help"}
                  />
                </div>
                
                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Send className="mr-2 h-5 w-5" />
                  {isHebrew ? "שלח הודעה" : "Send Message"}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  {isHebrew ? "פרטי קשר" : "Contact Information"}
                </h3>
                
                <div className="space-y-6">
                  <div className={`flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                    <div className="p-3 rounded-lg bg-purple-500/20 mr-4">
                      <Mail className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className={isHebrew ? 'text-right' : ''}>
                      <h4 className="text-white font-semibold">
                        {isHebrew ? "אימייל" : "Email"}
                      </h4>
                      <p className="text-gray-300">info@localedgeai.com</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                    <div className="p-3 rounded-lg bg-purple-500/20 mr-4">
                      <Phone className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className={isHebrew ? 'text-right' : ''}>
                      <h4 className="text-white font-semibold">
                        {isHebrew ? "טלפון" : "Phone"}
                      </h4>
                      <p className="text-gray-300">+972-50-123-4567</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                    <div className="p-3 rounded-lg bg-purple-500/20 mr-4">
                      <MapPin className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className={isHebrew ? 'text-right' : ''}>
                      <h4 className="text-white font-semibold">
                        {isHebrew ? "כתובת" : "Address"}
                      </h4>
                      <p className="text-gray-300">
                        {isHebrew ? "תל אביב, ישראל" : "Tel Aviv, Israel"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">
                  {isHebrew ? "למה לבחור בנו?" : "Why Choose Us?"}
                </h3>
                <ul className="space-y-3">
                  <li className="text-gray-300">
                    {isHebrew ? "פתרונות בינה מלאכותית מותאמים אישית" : "Custom AI solutions tailored to your business"}
                  </li>
                  <li className="text-gray-300">
                    {isHebrew ? "צוות ישראלי מנוסה" : "Experienced local team"}
                  </li>
                  <li className="text-gray-300">
                    {isHebrew ? "התקנה ותמיכה מהירה" : "Fast setup and support"}
                  </li>
                  <li className="text-gray-300">
                    {isHebrew ? "מחירים הוגנים ושקופים" : "Fair and transparent pricing"}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
