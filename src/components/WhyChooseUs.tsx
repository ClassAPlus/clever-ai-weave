
import { useLanguage } from "@/contexts/LanguageContext";

export const WhyChooseUs = () => {
  const { isHebrew } = useLanguage();

  return (
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
  );
};
