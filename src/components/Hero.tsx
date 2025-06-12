
import { useState } from "react";
import { ContactSheet } from "./ContactSheet";
import { FloatingNetworkAnimation } from "./FloatingNetworkAnimation";
import { HeroContent } from "./HeroContent";
import { HeroFeatures } from "./HeroFeatures";
import { AIAssessment } from "./AIAssessment";

export const Hero = () => {
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showAIAssessment, setShowAIAssessment] = useState(false);

  return (
    <>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <FloatingNetworkAnimation />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <HeroContent 
            onContactClick={() => setShowContactSheet(true)}
            onAIAssessmentClick={() => setShowAIAssessment(true)}
          />
          <HeroFeatures />
        </div>
      </section>

      <ContactSheet 
        open={showContactSheet} 
        onOpenChange={setShowContactSheet}
      />

      <AIAssessment 
        open={showAIAssessment} 
        onOpenChange={setShowAIAssessment}
      />
    </>
  );
};
