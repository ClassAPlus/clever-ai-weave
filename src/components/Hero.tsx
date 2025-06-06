
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Code } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Hero = () => {
  const { isHebrew } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-300">
              {isHebrew ? "פתרונות בינה מלאכותית לעסקים מקומיים" : "AI Solutions for Local Businesses"}
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
            {isHebrew ? (
              <>
                שנה את
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  העסק המקומי שלך עם AI
                </span>
              </>
            ) : (
              <>
                Transform Your
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Local Business with AI
                </span>
              </>
            )}
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {isHebrew 
              ? "הביאו פתרונות בינה מלאכותית ברמת הארגון לעסק המקומי שלכם. משירות לקוחות לניהול מלאי, אנחנו הופכים בינה מלאכותית מתקדמת לנגישה, זולה ומותאמת לצרכים המקומיים הספציפיים שלכם."
              : "Bring enterprise-level AI solutions to your local business. From customer service to inventory management, we make advanced AI accessible, affordable, and tailored to your specific local needs."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg group"
            >
              {isHebrew ? "פתח את העסק המקומי שלך" : "Grow Your Local Business"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              {isHebrew ? "ראה סיפורי הצלחה מקומיים" : "See Local Success Stories"}
            </Button>
          </div>
        </div>
        
        {/* Floating AI elements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <Brain className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isHebrew ? "בינה מלאכותית לעסקים קטנים" : "Small Business AI"}
            </h3>
            <p className="text-gray-300">
              {isHebrew ? "פתרונות בינה מלאכותית המותאמים באופן מושלם לצרכים ותקציבים של עסקים מקומיים" : "AI solutions scaled perfectly for local business needs and budgets"}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.2s' }}>
            <Code className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isHebrew ? "אינטגרציה מקומית קלה" : "Easy Local Integration"}
            </h3>
            <p className="text-gray-300">
              {isHebrew ? "התקנה פשוטה עם המערכות הקיימות שלכם, ללא צורך בידע טכני" : "Simple setup with your existing systems, no tech expertise required"}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.4s' }}>
            <Zap className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isHebrew ? "מיקוד קהילתי" : "Community Focus"}
            </h3>
            <p className="text-gray-300">
              {isHebrew ? "כלי בינה מלאכותית המבינים את השוק המקומי וצרכי הקהילה שלכם" : "AI tools that understand your local market and community needs"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
