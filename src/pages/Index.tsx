
import { Hero } from "@/components/Hero";
import { ServicesSection } from "@/components/ServicesSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { CTASection } from "@/components/CTASection";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <Hero />
      <ServicesSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
};

export default Index;
