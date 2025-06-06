
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, Users, MessageSquare, TrendingUp, Clock, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";

const UseCases = () => {
  const { isHebrew } = useLanguage();

  const useCases = [
    {
      icon: Store,
      title: isHebrew ? "חנות בגדים" : "Clothing Store",
      description: isHebrew 
        ? "הפוך את החנות שלך לחכמה עם המלצות אישיות ללקוחות"
        : "Transform your store with AI-powered personal shopping recommendations",
      benefits: isHebrew 
        ? ["עלייה של 40% במכירות", "לקוחות מרוצים יותר", "ניהול מלאי חכם"]
        : ["40% increase in sales", "Happier customers", "Smart inventory management"],
      example: isHebrew
        ? "לקוח נכנס לחנות → AI מזהה העדפות → ממליץ על פריטים מותאמים"
        : "Customer enters store → AI identifies preferences → Recommends tailored items"
    },
    {
      icon: Users,
      title: isHebrew ? "מסעדה משפחתית" : "Family Restaurant",
      description: isHebrew
        ? "שפר את השירות עם AI שמבין את הלקוחות שלך"
        : "Enhance service with AI that understands your customers",
      benefits: isHebrew
        ? ["זמן המתנה קצר יותר", "שירות מותאם אישית", "ניהול הזמנות חכם"]
        : ["Shorter wait times", "Personalized service", "Smart order management"],
      example: isHebrew
        ? "לקוח מזמין → AI זוכר העדפות → מציע מנות והשלמות"
        : "Customer orders → AI remembers preferences → Suggests dishes and add-ons"
    },
    {
      icon: MessageSquare,
      title: isHebrew ? "קליניקה רפואית" : "Medical Clinic",
      description: isHebrew
        ? "שפר את חוויית המטופלים עם תיאום חכם"
        : "Improve patient experience with smart scheduling",
      benefits: isHebrew
        ? ["תיאום פגישות אוטומטי", "תזכורות חכמות", "שירות 24/7"]
        : ["Automatic appointment scheduling", "Smart reminders", "24/7 service"],
      example: isHebrew
        ? "מטופל מבקש פגישה → AI מוצא זמן מתאים → שולח תזכורות"
        : "Patient requests appointment → AI finds suitable time → Sends reminders"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {isHebrew ? (
                <>
                  ראה איך עסקים
                  <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    משנים הכל עם AI
                  </span>
                </>
              ) : (
                <>
                  See How Businesses
                  <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Transform with AI
                  </span>
                </>
              )}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {isHebrew
                ? "גלה איך עסקים דומים לשלך משתמשים ב-AI כדי לגדול, לשפר שירות וליעל תהליכים"
                : "Discover how businesses like yours use AI to grow, improve service, and streamline operations"
              }
            </p>
          </div>

          {/* Use Cases Grid */}
          <div className="grid gap-8 mb-16">
            {useCases.map((useCase, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <useCase.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                      <CardDescription className="text-gray-300 text-lg">
                        {useCase.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-purple-300">
                        {isHebrew ? "התוצאות:" : "Results:"}
                      </h4>
                      <ul className="space-y-2">
                        {useCase.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-purple-300">
                        {isHebrew ? "איך זה עובד:" : "How it works:"}
                      </h4>
                      <p className="text-gray-300 bg-white/5 p-4 rounded-lg border border-white/10">
                        {useCase.example}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">15 דק׳</div>
              <div className="text-gray-300">
                {isHebrew ? "זמן התקנה ממוצע" : "Average setup time"}
              </div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">+35%</div>
              <div className="text-gray-300">
                {isHebrew ? "עלייה ממוצעת במכירות" : "Average sales increase"}
              </div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <DollarSign className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">₪0</div>
              <div className="text-gray-300">
                {isHebrew ? "עלות התחלתית" : "Upfront cost"}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl p-12 border border-white/20 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-6">
              {isHebrew ? "מוכן להתחיל?" : "Ready to Get Started?"}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {isHebrew
                ? "בוא נראה איך AI יכול לשנות את העסק שלך. התייעצות חינמית ללא התחייבות."
                : "Let's see how AI can transform your business. Free consultation with no commitment."
              }
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              {isHebrew ? "קבל הערכה חינמית" : "Get Free Assessment"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCases;
