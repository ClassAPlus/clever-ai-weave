
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";

export const CTASection = () => {
  return (
    <section id="contact" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl p-12 border border-white/20 backdrop-blur-sm text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Start Building with AI
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Today
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Get instant access to our AI APIs and start building intelligent applications in minutes, not months.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Enter your email" 
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-400 mb-8">
            Free tier includes 1,000 API calls per month • No credit card required
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">Free Tier</div>
              <div className="text-gray-300">1,000 calls/month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">Quick Setup</div>
              <div className="text-gray-300">5-minute integration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">Full Support</div>
              <div className="text-gray-300">Documentation & guides</div>
            </div>
          </div>
        </div>
        
        <footer className="mt-20 text-center text-gray-400">
          <p>&copy; 2024 AI Integration Hub. Empowering the future with artificial intelligence.</p>
        </footer>
      </div>
    </section>
  );
};
