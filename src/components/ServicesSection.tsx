
import { Bot, Image, MessageSquare, Database, Video, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const services = [
  {
    icon: MessageSquare,
    title: { en: "Customer Service AI", he: "שירות לקוחות AI" },
    description: { 
      en: "Smart chatbots and virtual assistants that understand local dialects and business needs to serve your customers 24/7.",
      he: "צ'אטבוטים חכמים ועוזרים וירטואליים המבינים ניבים מקומיים וצרכי עסק כדי לשרת את הלקוחות שלכם 24/7."
    },
    gradient: "from-blue-500 to-cyan-500",
    features: {
      en: ["Custom Knowledge Base", "Local Dialect Understanding", "After-Hours Support"],
      he: ["בסיס ידע מותאם", "הבנת ניב מקומי", "תמיכה מחוץ לשעות העבודה"]
    }
  },
  {
    icon: Image,
    title: { en: "Visual Merchandising", he: "סחורה חזותית" },
    description: { 
      en: "AI-powered image recognition to organize products, optimize displays, and create personalized recommendations for in-store customers.",
      he: "זיהוי תמונה מבוסס בינה מלאכותית לארגון מוצרים, אופטימיזציה של תצוגות ויצירת המלצות מותאמות אישית ללקוחות בחנות."
    },
    gradient: "from-purple-500 to-pink-500",
    features: {
      en: ["Shelf Optimization", "Product Recognition", "Customer Preference Analysis"],
      he: ["אופטימיזציה של המדפים", "זיהוי מוצרים", "ניתוח העדפות לקוחות"]
    }
  },
  {
    icon: Bot,
    title: { en: "Small Business Assistant", he: "עוזר עסק קטן" },
    description: { 
      en: "Virtual business assistant that helps manage appointments, answer inquiries, and follow up with customers based on your business rules.",
      he: "עוזר עסק וירטואלי המסייע בניהול פגישות, מענה לפניות ומעקב אחר לקוחות על בסיס כללי העסק שלכם."
    },
    gradient: "from-green-500 to-teal-500",
    features: {
      en: ["Appointment Scheduling", "Custom Business Rules", "Client Follow-ups"],
      he: ["תזמון פגישות", "כללי עסק מותאמים", "מעקב אחר לקוחות"]
    }
  },
  {
    icon: Database,
    title: { en: "Local Market Intelligence", he: "מודיעין שוק מקומי" },
    description: { 
      en: "Analyze local trends, customer preferences, and competition to make data-driven decisions for your business.",
      he: "ניתוח מגמות מקומיות, העדפות לקוחות ותחרות כדי לקבל החלטות מבוססות נתונים לעסק שלכם."
    },
    gradient: "from-orange-500 to-red-500",
    features: {
      en: ["Local Trend Analysis", "Competitive Insights", "Neighborhood Demographics"],
      he: ["ניתוח מגמות מקומיות", "תובנות תחרותיות", "דמוגרפיה של השכונה"]
    }
  },
  {
    icon: Video,
    title: { en: "In-Store Analytics", he: "ניתוחי חנות" },
    description: { 
      en: "Monitor customer flow, engagement, and behavior in your physical location to optimize layouts and staffing.",
      he: "מעקב אחר זרימת לקוחות, מעורבות והתנהגות במיקום הפיזי שלכם כדי לייעל פריסות וכוח אדם."
    },
    gradient: "from-indigo-500 to-purple-500",
    features: {
      en: ["Foot Traffic Analysis", "Dwell Time Tracking", "Staff Optimization"],
      he: ["ניתוח תנועת רגל", "מעקב זמן שהייה", "אופטימיזציה של הצוות"]
    }
  },
  {
    icon: Music,
    title: { en: "Voice Systems", he: "מערכות קול" },
    description: { 
      en: "Voice-activated solutions for both customers and staff to improve accessibility and efficiency in your local business.",
      he: "פתרונות מופעלי קול עבור לקוחות וצוות כדי לשפר נגישות ויעילות בעסק המקומי שלכם."
    },
    gradient: "from-pink-500 to-rose-500",
    features: {
      en: ["Voice Ordering", "Hands-free Operations", "Accessibility Features"],
      he: ["הזמנה קולית", "פעולות ללא ידיים", "תכונות נגישות"]
    }
  }
];

export const ServicesSection = () => {
  const { isHebrew } = useLanguage();

  return (
    <section id="services" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            {isHebrew ? (
              <>
                שירותי AI עבור
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  עסקים מקומיים
                </span>
              </>
            ) : (
              <>
                AI Services for
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Local Businesses
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {isHebrew 
              ? "פתרונות בינה מלאכותית זולים ומעשיים המיועדים במיוחד לעסקים קטנים ומקומיים. אין צורך בתקציבי ארגון."
              : "Affordable, practical AI solutions designed specifically for small and local businesses. No enterprise budgets required."
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">
                  {isHebrew ? service.title.he : service.title.en}
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  {isHebrew ? service.description.he : service.description.en}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(isHebrew ? service.features.he : service.features.en).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
