
import { Bot, Image, MessageSquare, Database, Video, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: MessageSquare,
    title: "Natural Language Processing",
    description: "Advanced text analysis, sentiment detection, and language understanding for chatbots and content analysis.",
    gradient: "from-blue-500 to-cyan-500",
    features: ["Sentiment Analysis", "Text Summarization", "Language Translation"]
  },
  {
    icon: Image,
    title: "Computer Vision",
    description: "Image recognition, object detection, and visual analysis to automate visual tasks and insights.",
    gradient: "from-purple-500 to-pink-500",
    features: ["Object Detection", "Facial Recognition", "Image Classification"]
  },
  {
    icon: Bot,
    title: "Conversational AI",
    description: "Intelligent chatbots and virtual assistants that understand context and provide human-like interactions.",
    gradient: "from-green-500 to-teal-500",
    features: ["Smart Chatbots", "Voice Assistants", "Context Awareness"]
  },
  {
    icon: Database,
    title: "Predictive Analytics",
    description: "Machine learning models that predict trends, behaviors, and outcomes from your data.",
    gradient: "from-orange-500 to-red-500",
    features: ["Trend Prediction", "Risk Assessment", "Data Forecasting"]
  },
  {
    icon: Video,
    title: "Video Intelligence",
    description: "Analyze video content for objects, actions, and scenes to extract meaningful insights.",
    gradient: "from-indigo-500 to-purple-500",
    features: ["Content Analysis", "Action Recognition", "Scene Understanding"]
  },
  {
    icon: Music,
    title: "Audio Processing",
    description: "Speech recognition, audio classification, and sound analysis for multimedia applications.",
    gradient: "from-pink-500 to-rose-500",
    features: ["Speech-to-Text", "Audio Classification", "Sound Analysis"]
  }
];

export const ServicesSection = () => {
  return (
    <section id="services" className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            AI Services That
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Power Innovation
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose from our comprehensive suite of AI services designed to transform how you work and serve your customers.
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
