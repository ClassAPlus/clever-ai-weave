י
import { Bot, Image, MessageSquare, Database, Video, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const services = [{
  icon: MessageSquare,
  title: {
    en: "Smart Customer Service",
    he: "שירות לקוחות חכם"
  },
  description: {
    en: "AI chatbot that handles customer questions 24/7, understands your business, and never takes a day off.",
    he: "שמטפל בשאלות לקוחות 24/7, בינה מלאכותית שמבין את העסק שלך ואף פעם לא לוקח יום חופש"
  },
  gradient: "from-blue-500 to-cyan-500",
  features: {
    en: ["24/7 Availability", "Instant Responses", "Learns Your Business"],
    he: ["24/7 זמינות", "מענה מיידי", "לומד את העסק שלך"]
  }
}, {
  icon: Image,
  title: {
    en: "Visual Recognition",
    he: "זיהוי חזותי"
  },
  description: {
    en: "Automatically organize products, track inventory, and identify what customers are looking for.",
    he: "ארגון אוטומטי של מוצרים, מעקב מלאי, וזיהוי מה שהלקוחות מחפשים"
  },
  gradient: "from-purple-500 to-pink-500",
  features: {
    en: ["Auto Inventory", "Product Search", "Smart Displays"],
    he: ["מלאי אוטומטי", "חיפוש מוצרים", "תצוגות חכמות"]
  }
}, {
  icon: Bot,
  title: {
    en: "Business Assistant",
    he: "עוזר עסק"
  },
  description: {
    en: "Virtual assistant that schedules appointments, follows up with customers, and manages daily tasks.",
    he: "עוזר וירטואלי שמתאם פגישות, מעקב לקוחות ומנהל משימות יומיות"
  },
  gradient: "from-green-500 to-teal-500",
  features: {
    en: ["Smart Scheduling", "Customer Follow-ups", "Task Management"],
    he: ["תיאום חכם", "מעקב לקוחות", "ניהול משימות"]
  }
}, {
  icon: Database,
  title: {
    en: "Market Insights",
    he: "תובנות שוק"
  },
  description: {
    en: "Understand your local market trends, customer behavior, and what drives sales in your area.",
    he: "הבנה של מגמות השוק המקומי, התנהגות לקוחות ומה מניע מכירות באזור שלך"
  },
  gradient: "from-orange-500 to-red-500",
  features: {
    en: ["Local Trends", "Customer Analytics", "Sales Insights"],
    he: ["מגמות מקומיות", "אנליטיקה של לקוחות", "תובנות מכירות"]
  }
}, {
  icon: Video,
  title: {
    en: "Store Analytics",
    he: "אנליטיקה של החנות"
  },
  description: {
    en: "Track foot traffic, understand customer flow, and optimize your store layout for better sales.",
    he: "מעקב תנועת לקוחות, הבנת זרימה בחנות ואופטימיזציה של פריסה למכירות טובות יותר"
  },
  gradient: "from-indigo-500 to-purple-500",
  features: {
    en: ["Traffic Monitoring", "Flow Analysis", "Layout Optimization"],
    he: ["ניטור תנועה", "ניתוח זרימה", "אופטימיזציה של פריסה"]
  }
}, {
  icon: Music,
  title: {
    en: "Voice Control",
    he: "שליטה קולית"
  },
  description: {
    en: "Voice-activated ordering, hands-free operations, and accessibility features for all customers.",
    he: "הזמנות אודיו ותכונות נגישות ונוחות למגוון לקוחות"
  },
  gradient: "from-pink-500 to-rose-500",
  features: {
    en: ["Voice Orders", "Hands-free Mode", "Easy Access"],
    he: ["הזמנות אודיו", "ללא צורך התערבות אנושית", "גישה קלה"]
  }
}];

export const ServicesSection = () => {
  const { isHebrew } = useLanguage();
  
  return (
    <section id="services" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            {isHebrew ? (
              <>
                AI פתרונות
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  לעסק שלך
                </span>
              </>
            ) : (
              <>
                AI Solutions
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  For Your Business
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {isHebrew ? "כלים חכמים שחוסכים לך זמן וכסף ומשפרים את החוויה ללקוחות" : "Smart tools that save you time, money, and improve customer experience."}
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
                <CardTitle className={`text-2xl text-white ${isHebrew ? 'text-right' : 'text-left'}`}>
                  {isHebrew ? service.title.he : service.title.en}
                </CardTitle>
                <CardDescription className={`text-gray-300 text-base ${isHebrew ? 'text-right' : 'text-left'}`}>
                  {isHebrew ? service.description.he : service.description.en}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(isHebrew ? service.features.he : service.features.en).map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-center text-gray-300 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-2 h-2 bg-purple-400 rounded-full ${isHebrew ? 'ml-3' : 'mr-3'}`}></div>
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
