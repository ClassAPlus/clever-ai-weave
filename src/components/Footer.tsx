
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  const { isHebrew } = useLanguage();

  return (
    <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className={`${isHebrew ? 'text-right' : 'text-left'}`}>
            <h3 className="text-xl font-bold text-white mb-4">
              LocalEdgeAI
            </h3>
            <p className="text-gray-300 mb-4">
              {isHebrew 
                ? "הופכים עסקים קטנים לחכמים יותר עם בינה מלאכותית מתקדמת ופתרונות מותאמים אישית."
                : "Making small businesses smarter with advanced artificial intelligence and custom solutions."
              }
            </p>
          </div>

          {/* Contact Info */}
          <div className={`${isHebrew ? 'text-right' : 'text-left'}`}>
            <h4 className="text-lg font-semibold text-white mb-4">
              {isHebrew ? "יצירת קשר" : "Contact"}
            </h4>
            <div className="space-y-3">
              <div className={`flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                <Mail className={`h-4 w-4 text-purple-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                <a 
                  href="mailto:contact@classaplus.org"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  contact@classaplus.org
                </a>
              </div>
              <div className={`flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                <Phone className={`h-4 w-4 text-purple-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                <span className="text-gray-300">+972-50-123-4567</span>
              </div>
              <div className={`flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                <MapPin className={`h-4 w-4 text-purple-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                <span className="text-gray-300">
                  {isHebrew ? "בית שמש, ישראל" : "Beit Shemesh, Israel"}
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className={`${isHebrew ? 'text-right' : 'text-left'}`}>
            <h4 className="text-lg font-semibold text-white mb-4">
              {isHebrew ? "שירותים" : "Services"}
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-300 hover:text-purple-400 transition-colors cursor-pointer">
                  {isHebrew ? "אוטומציה עסקית" : "Business Automation"}
                </span>
              </li>
              <li>
                <span className="text-gray-300 hover:text-purple-400 transition-colors cursor-pointer">
                  {isHebrew ? "צ'אטבוטים חכמים" : "Smart Chatbots"}
                </span>
              </li>
              <li>
                <span className="text-gray-300 hover:text-purple-400 transition-colors cursor-pointer">
                  {isHebrew ? "ניתוח נתונים" : "Data Analytics"}
                </span>
              </li>
              <li>
                <span className="text-gray-300 hover:text-purple-400 transition-colors cursor-pointer">
                  {isHebrew ? "פתרונות מותאמים" : "Custom Solutions"}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            {isHebrew 
              ? "© 2024 LocalEdgeAI. כל הזכויות שמורות."
              : "© 2024 LocalEdgeAI. All rights reserved."
            }
          </p>
        </div>
      </div>
    </footer>
  );
};
