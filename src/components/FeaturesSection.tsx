
import { Shield, Zap, Globe, Users, Clock, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const features = [
  {
    icon: Shield,
    title: { en: "Local Data Security", he: "אבטחת נתונים מקומית" },
    description: { 
      en: "Keep your customer data secure with enterprise-level encryption tailored for small business needs.",
      he: "שמרו על נתוני הלקוחות שלכם מאובטחים עם הצפנה ברמת ארגון המותאמת לצרכי עסקים קטנים."
    }
  },
  {
    icon: Zap,
    title: { en: "Quick Implementation", he: "יישום מהיר" },
    description: { 
      en: "Get your AI solutions up and running within days, not months, perfect for busy local businesses.",
      he: "הפעילו את פתרונות הבינה המלאכותית שלכם תוך ימים, לא חודשים, מושלם לעסקים מקומיים עמוסים."
    }
  },
  {
    icon: Globe,
    title: { en: "Community Focused", he: "מיקוד קהילתי" },
    description: { 
      en: "Our AI solutions understand local markets, dialects, and neighborhood preferences.",
      he: "פתרונות הבינה המלאכותית שלנו מבינים שווקים מקומיים, ניבים והעדפות שכונתיות."
    }
  },
  {
    icon: Users,
    title: { en: "Local Support", he: "תמיכה מקומית" },
    description: { 
      en: "Get help from real people who understand your local business landscape and challenges.",
      he: "קבלו עזרה מאנשים אמיתיים המבינים את הנוף העסקי המקומי והאתגרים שלכם."
    }
  },
  {
    icon: Clock,
    title: { en: "Time-Saving Tools", he: "כלים חוסכי זמן" },
    description: { 
      en: "Automate routine tasks so you can focus on what matters—serving your customers.",
      he: "הפוך משימות שגרתיות לאוטומטיות כדי שתוכלו להתמקד במה שחשוב - שירות הלקוחות שלכם."
    }
  },
  {
    icon: Award,
    title: { en: "Small Business Specialists", he: "מומחי עסקים קטנים" },
    description: { 
      en: "AI solutions designed specifically for the unique needs of local and small businesses.",
      he: "פתרונות בינה מלאכותית המיועדים במיוחד לצרכים הייחודיים של עסקים מקומיים וקטנים."
    }
  }
];

export const FeaturesSection = () => {
  const { isHebrew } = useLanguage();

  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            {isHebrew ? (
              <>
                למה עסקים מקומיים
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  בוחרים LocalEdgeAI
                </span>
              </>
            ) : (
              <>
                Why Local Businesses
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Choose LocalEdgeAI
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {isHebrew 
              ? "נבנה במיוחד עבור עסקים קטנים ומקומיים, לא רק פתרונות ארגוניים מוקטנים."
              : "Built specifically for small and local businesses, not just scaled-down enterprise solutions."
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-center group hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {isHebrew ? feature.title.he : feature.title.en}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {isHebrew ? feature.description.he : feature.description.en}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-white/20 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-white mb-6">
              {isHebrew 
                ? "מוכנים להביא AI לעסק המקומי שלכם?"
                : "Ready to Bring AI to Your Local Business?"
              }
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              {isHebrew 
                ? "הצטרפו למאות עסקים מקומיים שכבר משתמשים בפתרונות הבינה המלאכותית שלנו כדי לצמוח ולשגשג."
                : "Join hundreds of local businesses already using our AI solutions to grow and thrive."
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">200+</div>
                <div className="text-gray-300">
                  {isHebrew ? "עסקים מקומיים" : "Local Businesses"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">15min</div>
                <div className="text-gray-300">
                  {isHebrew ? "זמן התקנה ממוצע" : "Average Setup Time"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">30%</div>
                <div className="text-gray-300">
                  {isHebrew ? "זמן נחסך" : "Time Saved"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">
                  {isHebrew ? "מקומי" : "Local"}
                </div>
                <div className="text-gray-300">
                  {isHebrew ? "צוות תמיכה" : "Support Team"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
