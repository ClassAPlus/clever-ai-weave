
import { FloatingNetworkAnimation } from "./FloatingNetworkAnimation";
import { HeroContent } from "./HeroContent";
import { HeroFeatures } from "./HeroFeatures";
import { useLanguage } from "@/contexts/LanguageContext";

export const Hero = () => {
  const { isHebrew } = useLanguage();
  
  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${isHebrew ? 'rtl' : 'ltr'}`}>
      <FloatingNetworkAnimation />
      
      <div className="container mx-auto px-6 pt-20 pb-16 relative z-10">
        <div className="text-center">
          <HeroContent />
          <HeroFeatures />
        </div>
      </div>
    </section>
  );
};
