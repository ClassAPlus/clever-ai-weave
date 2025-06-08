
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, MapPin } from "lucide-react";

export const ContactInfo = () => {
  const { isHebrew } = useLanguage();

  return (
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
  );
};
