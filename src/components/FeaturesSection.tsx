
import { Shield, Zap, Globe, Users, Clock, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Local Data Security",
    description: "Keep your customer data secure with enterprise-level encryption tailored for small business needs."
  },
  {
    icon: Zap,
    title: "Quick Implementation",
    description: "Get your AI solutions up and running within days, not months, perfect for busy local businesses."
  },
  {
    icon: Globe,
    title: "Community Focused",
    description: "Our AI solutions understand local markets, dialects, and neighborhood preferences."
  },
  {
    icon: Users,
    title: "Local Support",
    description: "Get help from real people who understand your local business landscape and challenges."
  },
  {
    icon: Clock,
    title: "Time-Saving Tools",
    description: "Automate routine tasks so you can focus on what matters—serving your customers."
  },
  {
    icon: Award,
    title: "Small Business Specialists",
    description: "AI solutions designed specifically for the unique needs of local and small businesses."
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Why Local Businesses
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Choose LocalEdgeAI
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built specifically for small and local businesses, not just scaled-down enterprise solutions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-center group hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-300 text-lg leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-white/20 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-white mb-6">Ready to Bring AI to Your Local Business?</h3>
            <p className="text-xl text-gray-300 mb-8">
              Join hundreds of local businesses already using our AI solutions to grow and thrive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">200+</div>
                <div className="text-gray-300">Local Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">15min</div>
                <div className="text-gray-300">Average Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">30%</div>
                <div className="text-gray-300">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">Local</div>
                <div className="text-gray-300">Support Team</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
