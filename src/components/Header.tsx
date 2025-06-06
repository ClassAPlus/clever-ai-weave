
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Header = () => {
  const { isHebrew, toggleLanguage } = useLanguage();

  return (
    <header className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Custom AI Logo */}
          <div className="relative">
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-400">
              {/* Neural network nodes */}
              <circle cx="8" cy="8" r="2" fill="currentColor" className="animate-pulse" />
              <circle cx="24" cy="8" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              <circle cx="8" cy="24" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1s' }} />
              <circle cx="24" cy="24" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
              <circle cx="16" cy="16" r="3" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.75s' }} />
              
              {/* Connecting lines */}
              <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="24" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="8" y1="24" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <line x1="24" y1="24" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              
              {/* Outer ring for "local" concept */}
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="2,2" className="animate-spin" style={{ animationDuration: '8s' }} />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LocalEdgeAI
          </span>
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
