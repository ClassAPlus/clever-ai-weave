
import { useLanguage } from "@/contexts/LanguageContext";

export const ContactHeader = () => {
  const { isHebrew } = useLanguage();

  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {isHebrew ? "צור קשר" : "Contact Us"}
      </h1>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        {isHebrew 
          ? "מוכנים להפוך את העסק שלכם לחכם יותר? בואו נתחיל בשיחה"
          : "Ready to make your business smarter? Let's start the conversation"
        }
      </p>
    </div>
  );
};
