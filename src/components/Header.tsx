
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const { isHebrew, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSectionClick = (sectionId: string) => {
    if (location.pathname !== '/') {
      // If not on home page, navigate to home first then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // If on home page, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          {/* Sleek Modern AI Logo */}
          <div className="relative">
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-purple-400">
              {/* Central hexagon representing AI core */}
              <path 
                d="M16 4 L24 8 L24 16 L16 20 L8 16 L8 8 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                className="animate-pulse"
              />
              
              {/* Inner geometric pattern */}
              <circle cx="16" cy="12" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              <path 
                d="M12 10 L20 10 M12 14 L20 14" 
                stroke="currentColor" 
                strokeWidth="1" 
                className="animate-pulse" 
                style={{ animationDelay: '1s' }}
              />
              
              {/* Outer connecting nodes for "local/edge" concept */}
              <circle cx="6" cy="6" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="26" cy="6" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
              <circle cx="6" cy="20" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
              <circle cx="26" cy="20" r="1.5" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
              
              {/* Connection lines */}
              <line x1="8" y1="8" x2="12" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
              <line x1="24" y1="8" x2="20" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
              <line x1="8" y1="16" x2="12" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
              <line x1="24" y1="16" x2="20" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
            </svg>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LocalEdgeAI
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors">
            {isHebrew ? "בית" : "Home"}
          </Link>
          <Link to="/use-cases" className="text-gray-300 hover:text-white transition-colors">
            {isHebrew ? "דוגמאות" : "Use Cases"}
          </Link>
          <button 
            onClick={() => handleSectionClick('services')} 
            className="text-gray-300 hover:text-white transition-colors"
          >
            {isHebrew ? "שירותים" : "Services"}
          </button>
          <button 
            onClick={() => handleSectionClick('features')} 
            className="text-gray-300 hover:text-white transition-colors"
          >
            {isHebrew ? "תכונות" : "Features"}
          </button>
          <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
            {isHebrew ? "צור קשר" : "Contact"}
          </Link>
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
          <Button asChild variant="outline" className="hidden md:inline-flex border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
            <Link to="/contact">
              {isHebrew ? "התחל" : "Get Started"}
            </Link>
          </Button>
          <Button size="icon" variant="ghost" className="md:hidden text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};
