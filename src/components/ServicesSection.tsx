
import { Bot, Image, MessageSquare, Database, Video, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: MessageSquare,
    title: "Customer Service AI",
    description: "Smart chatbots and virtual assistants that understand local dialects and business needs to serve your customers 24/7.",
    gradient: "from-blue-500 to-cyan-500",
    features: ["Custom Knowledge Base", "Local Dialect Understanding", "After-Hours Support"]
  },
  {
    icon: Image,
    title: "Visual Merchandising",
    description: "AI-powered image recognition to organize products, optimize displays, and create personalized recommendations for in-store customers.",
    gradient: "from-purple-500 to-pink-500",
    features: ["Shelf Optimization", "Product Recognition", "Customer Preference Analysis"]
  },
  {
    icon: Bot,
    title: "Small Business Assistant",
    description: "Virtual business assistant that helps manage appointments, answer inquiries, and follow up with customers based on your business rules.",
    gradient: "from-green-500 to-teal-500",
    features: ["Appointment Scheduling", "Custom Business Rules", "Client Follow-ups"]
  },
  {
    icon: Database,
    title: "Local Market Intelligence",
    description: "Analyze local trends, customer preferences, and competition to make data-driven decisions for your business.",
    gradient: "from-orange-500 to-red-500",
    features: ["Local Trend Analysis", "Competitive Insights", "Neighborhood Demographics"]
  },
  {
    icon: Video,
    title: "In-Store Analytics",
    description: "Monitor customer flow, engagement, and behavior in your physical location to optimize layouts and staffing.",
    gradient: "from-indigo-500 to-purple-500",
    features: ["Foot Traffic Analysis", "Dwell Time Tracking", "Staff Optimization"]
  },
  {
    icon: Music,
    title: "Voice Systems",
    description: "Voice-activated solutions for both customers and staff to improve accessibility and efficiency in your local business.",
    gradient: "from-pink-500 to-rose-500",
    features: ["Voice Ordering", "Hands-free Operations", "Accessibility Features"]
  }
];

export const ServicesSection = () => {
  return (
    <section id="services" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            AI Services for
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Local Businesses
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Affordable, practical AI solutions designed specifically for small and local businesses. No enterprise budgets required.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">{service.title}</CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
