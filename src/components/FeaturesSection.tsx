
import { Shield, Zap, Globe, Users, Clock, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const features = [{
  icon: Shield,
  title: {
    en: "Secure & Private",
    he: "מאובטח ופרטי"
  },
  description: {
    en: "Your data stays safe with enterprise-level security that's simple to manage.",
    he: "הנתונים שלך נשארים מאובטחים."
  }
}, {
  icon: Zap,
  title: {
    en: "Quick Start",
    he: "אינטגרציה מהירה"
  },
  description: {
    en: "Get up and running in minutes, not months. No technical expertise required.",
    he: "תפעלו תוך דקות, לא חודשים. ללא צורך בידע טכני."
  }
}, {
  icon: Globe,
  title: {
    en: "Knows Your Market",
    he: "מכיר את השוק שלך"
  },
  description: {
    en: "AI that understands local preferences, trends, and what your customers really want.",
    he: "בינה מלאכותית שמבינה העדפות מקומיות, מגמות ומה שהלקוחות שלך באמת רוצים."
  }
}, {
  icon: Users,
  title: {
    en: "Real Human Support",
    he: "תמיכה אנושית אמיתי"
  },
  description: {
    en: "Talk to real people who understand your business and are here to help you succeed.",
    he: "דבר עם אנשים אמיתיים שמבינים את העסק שלך וכאן כדי לעזור לך להצליח."
  }
}, {
  icon: Clock,
  title: {
    en: "Save Hours Daily",
    he: "חוסך שעות ביום"
  },
  description: {
    en: "Automate routine tasks so you can focus on growing your business, not managing it.",
    he: "אוטומציה של משימות שגרתיות כדי שתוכל להתמקד בצמיחת העסק, לא בניהולו."
  }
}, {
  icon: Award,
  title: {
    en: "Built for Small Business",
    he: "נבנה לעסק קטן"
  },
  description: {
    en: "Designed specifically for small businesses, not oversized corporate solutions.",
    he: "מעוצב במיוחד לעסקים קטנים, לא פתרונות ארגוניים מוגדלים."
  }
}];

export const FeaturesSection = () => {
  const { isHebrew } = useLanguage();
  
  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            {isHebrew ? (
              <>
                למה לבחור
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight pb-2" dir="rtl">
                  ב-LocalEdgeAI
                </span>
              </>
            ) : (
              <>
                Why Choose
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight pb-2">
                  LocalEdgeAI
                </span>
              </>
            )}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {isHebrew ? "נבנה במיוחד לעסקים כמו שלך - פשוט, אמין ומשתלם" : "Built specifically for businesses like yours - simple, reliable, and affordable."}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group hover:scale-105 transition-all duration-300" style={{
              animationDelay: `${index * 0.1}s`
            }}>
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {isHebrew ? feature.title.he : feature.title.en}
              </h3>
              <p className={`text-gray-300 text-lg leading-relaxed ${isHebrew ? 'text-right' : 'text-center'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                {isHebrew ? feature.description.he : feature.description.en}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-white/20 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-white mb-6">
              {isHebrew ? "?מוכן להפוך את העסק לחכם יותר" : "Ready to Make Your Business Smarter?"}
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              {isHebrew ? "הצטרף לעסקים שכבר חוסכים זמן וכסף עם הפתרונות שלנו" : "Join businesses already saving time and money with our solutions."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">$2K+</div>
                <div className="text-gray-300">
                  {isHebrew ? "נחסך בחודש" : "Saved Monthly"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">Easy</div>
                <div className="text-gray-300">
                  {isHebrew ? "התקנה" : "Setup"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">40%</div>
                <div className="text-gray-300">
                  {isHebrew ? "חיסכון בזמן" : "Time Saved"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">Local</div>
                <div className="text-gray-300">
                  {isHebrew ? "תמיכה" : "Support"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
