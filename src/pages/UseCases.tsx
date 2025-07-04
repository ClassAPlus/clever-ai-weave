import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, Camera, Building, FileText, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { ContactSheet } from "@/components/ContactSheet";

const UseCases = () => {
  const { isHebrew } = useLanguage();
  const [showContactSheet, setShowContactSheet] = useState(false);

  const useCases = [
    {
      icon: Camera,
      title: isHebrew ? "חנות חלקי חילוף לטכנאים" : "Replacement Parts Store",
      description: isHebrew 
        ? "AI מערכת זיהוי חלקים וקבלת הצעות מחיר באמצעות צילום עם בינה מלאכותית"
        : "AI-powered part identification and quote system through photo capture",
      benefits: isHebrew 
        ? ["זיהוי חלקים אוטומטי", "הצעות מחיר מיידיות", "מעקב הזמנות", "מאגר חלקים חכם"]
        : ["Automatic part identification", "Instant price quotes", "Order tracking", "Smart parts database"],
      howItWorks: isHebrew
        ? "הטכנאי מצלם את החלק הפגום, הבינה המלאכותית מזהה אותו ומספקת הצעת מחיר והזמנה מיידית"
        : "Technician takes a photo of the damaged part, AI identifies it and provides instant quote and ordering"
    },
    {
      icon: MapPin,
      title: isHebrew ? "משרד תיווך נדל\"ן" : "Real Estate Agency",
      description: isHebrew 
        ? "מערכת ניהול נכסים מתקדמת לקליטת נתונים על נכסים למכירה וקניה לפי אזורים"
        : "Advanced property management system for collecting data on properties for sale and purchase by regions",
      benefits: isHebrew 
        ? ["ניהול נכסים לפי אזורים", "מעקב דרישות קונים", "ניתוח מגמות שוק", "התאמה אוטומטית נכס-לקוח"]
        : ["Property management by regions", "Buyer requirements tracking", "Market trend analysis", "Automatic property-client matching"],
      howItWorks: isHebrew
        ? "המערכת אוספת ומנתחת נתונים על נכסים באזורים שונים, מתאימה בין מוכרים לקונים ומספקת תובנות שוק"
        : "System collects and analyzes property data across different regions, matches sellers with buyers and provides market insights"
    },
    {
      icon: Building,
      title: isHebrew ? "מרפאה" : "Clinic",
      description: isHebrew 
        ? "מערכת ניהול מטופלים ותורים עם אוטומציה חכמה"
        : "Patient and appointment management system with smart automation",
      benefits: isHebrew 
        ? ["ניהול תורים חכם", "מעקב מטופלים", "ניהול רשומות רפואיות", "תזכורות אוטומטיות"]
        : ["Smart appointment scheduling", "Patient tracking", "Medical records management", "Automated reminders"],
      howItWorks: isHebrew
        ? "המערכת מנהלת תורים, מעקב מטופלים ורשומות רפואיות בצורה מאובטחת ויעילה"
        : "System manages appointments, patient tracking, and medical records securely and efficiently"
    },
    {
      icon: FileText,
      title: isHebrew ? "סורק מסמכים משפטי" : "Legal Document Scanner",
      description: isHebrew 
        ? "AI מערכת סריקה וניתוח מסמכים משפטיים עם בינה מלאכותית מתקדמת"
        : "Advanced AI-powered legal document scanning and analysis system",
      benefits: isHebrew 
        ? ["סריקה אוטומטית של חוזים", "זיהוי סעיפים חשובים", "ניתוח סיכונים משפטיים", "חיפוש מהיר במסמכים"]
        : ["Automated contract scanning", "Key clause identification", "Legal risk analysis", "Fast document search"],
      howItWorks: isHebrew
        ? "הבינה המלאכותית סורקת מסמכים משפטיים, מזהה סעיפים קריטיים ומספקת ניתוח משפטי מעמיק"
        : "AI scans legal documents, identifies critical clauses, and provides comprehensive legal analysis"
    },
    {
      icon: Mail,
      title: isHebrew ? "עוזר חיוב לעורכי דין" : "Legal Billing Assistant",
      description: isHebrew 
        ? "מערכת ניתוח אימיילים וחיוב אוטומטית לעורכי דין"
        : "Automated email analysis and billing system for attorneys",
      benefits: isHebrew 
        ? ["סריקת אימיילים אוטומטית", "זיהוי שעות חיוב", "מעקב תקשורת לקוחות", "דוחות חיוב מפורטים"]
        : ["Automated email scanning", "Billable hours identification", "Client communication tracking", "Detailed billing reports"],
      howItWorks: isHebrew
        ? "המערכת סורקת חשבונות אימייל, מזהה פעילויות ניתנות לחיוב ויוצרת דוחות חיוב מפורטים"
        : "System scans email accounts, identifies billable activities, and generates comprehensive billing reports"
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            {/* Header Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {isHebrew ? "דוגמאות שימוש" : "Use Cases"}
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {isHebrew 
                  ? "LocalEdgeAI גלה כיצד משנה עסקים ומקצועות שונים עם פתרונות בינה מלאכותית מותאמים אישית"
                  : "Discover how LocalEdgeAI transforms various businesses and professions with tailored AI solutions"
                }
              </p>
            </div>

            {/* Use Cases Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {useCases.map((useCase, index) => (
                <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 rounded-lg bg-purple-500/20">
                        <useCase.icon className="h-8 w-8 text-purple-400" />
                      </div>
                      <CardTitle className={`text-white text-xl ${isHebrew ? 'text-right' : 'text-left'}`}>{useCase.title}</CardTitle>
                    </div>
                    <CardDescription className={`text-gray-300 text-base ${isHebrew ? 'text-right' : 'text-left'}`}>
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className={`text-purple-300 font-semibold mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
                          {isHebrew ? ":יתרונות" : "Benefits:"}
                        </h4>
                        <ul className="space-y-1">
                          {useCase.benefits.map((benefit, idx) => (
                            <li key={idx} className={`text-gray-300 text-sm flex items-center ${isHebrew ? 'flex-row-reverse text-right' : 'text-left'}`}>
                              <ArrowRight className={`h-3 w-3 text-purple-400 flex-shrink-0 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-purple-300 font-semibold mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
                          {isHebrew ? ":איך זה עובד" : "How it works:"}
                        </h4>
                        <p className={`text-gray-300 text-sm ${isHebrew ? 'text-right' : 'text-left'}`}>{useCase.howItWorks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {isHebrew ? "?מוכנים להתחיל" : "Ready to Get Started?"}
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                {isHebrew 
                  ? "AI פתחו את הפוטנציאל העסקי שלכם עם פתרונות בינה מלאכותית מותאמים אישית"
                  : "Unlock your business potential with custom AI solutions tailored to your needs"
                }
              </p>
              <Button 
                onClick={() => setShowContactSheet(true)}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                {isHebrew ? "צרו קשר עכשיו" : "Contact Us Now"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>

      <ContactSheet 
        open={showContactSheet} 
        onOpenChange={setShowContactSheet}
      />
    </>
  );
};

export default UseCases;
