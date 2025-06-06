
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bot, Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const { isHebrew, toggleLanguage } = useLanguage();

  return (
    <header className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-purple-400" />
          <span className="text-2xl font-bold text-white">LocalEdgeAI</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-gray-300 hover:text-white transition-colors">
            {isHebrew ? "שירותים" : "Services"}
          </a>
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">
            {isHebrew ? "תכונות" : "Features"}
          </a>
          <a href="#contact" className="text-gray-300 hover:text-white transition-colors">
            {isHebrew ? "צור קשר" : "Contact"}
          </a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">EN</span>
            <Switch 
              checked={isHebrew} 
              onCheckedChange={toggleLanguage}
              className="data-[state=checked]:bg-purple-600"
            />
            <span className="text-sm text-gray-300">עב</span>
          </div>
          <Button variant="outline" className="hidden md:inline-flex border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
            {isHebrew ? "התחל" : "Get Started"}
          </Button>
          <Button size="icon" variant="ghost" className="md:hidden text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
