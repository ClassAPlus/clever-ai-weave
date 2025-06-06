
import { Shield, Zap, Globe, Users, Clock, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and security protocols to protect your sensitive data."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second response times with our optimized AI infrastructure."
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Worldwide deployment with 99.9% uptime guarantee."
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "24/7 technical support from our team of AI specialists."
  },
  {
    icon: Clock,
    title: "Quick Integration",
    description: "Get up and running in minutes with our simple APIs."
  },
  {
    icon: Award,
    title: "Industry Leading",
    description: "Award-winning AI solutions trusted by Fortune 500 companies."
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Why Choose Our
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Platform
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built for developers, designed for businesses, and trusted by enterprises worldwide.
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
            <h3 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h3>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of developers already building with our AI platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">10M+</div>
                <div className="text-gray-300">API Calls Daily</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">50ms</div>
                <div className="text-gray-300">Average Response</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
                <div className="text-gray-300">Uptime Guarantee</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">24/7</div>
                <div className="text-gray-300">Expert Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
