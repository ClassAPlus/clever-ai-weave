
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";

export const MobileSheetHeader = () => {
  const { isHebrew } = useLanguage();

  return (
    <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b">
      <div className="p-4 pb-2 pt-6">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            {isHebrew ? "🤖 הערכת בינה מלאכותית חינמית של לוקל אדג׳" : "🤖 Free LocalEdgeAI Assessment"}
          </SheetTitle>
          <SheetDescription className="text-gray-600 text-sm">
            {isHebrew ? "גלה איך לוקל אדג׳ יכול לשדרג את העסק שלך" : "Discover how LocalEdgeAI can transform your business"}
          </SheetDescription>
        </SheetHeader>
      </div>
    </div>
  );
};
