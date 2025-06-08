import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Zap, Brain, Code, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { ContactSheet } from "./ContactSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FloatingNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export const Hero = () => {
  const { isHebrew } = useLanguage();
  const { toast } = useToast();
  const [nodes, setNodes] = useState<FloatingNode[]>([]);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);

  useEffect(() => {
    // Initialize floating nodes
    const initialNodes: FloatingNode[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 4 + 3,
      opacity: Math.random() * 0.5 + 0.5,
    }));
    setNodes(initialNodes);

    const interval = setInterval(() => {
      setNodes(prevNodes =>
        prevNodes.map(node => {
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= 100) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(100, newY));
          }

          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }, 60);

    return () => clearInterval(interval);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmittingEmail(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            first_name: "Quick",
            last_name: "Assessment",
            email: email,
            message: isHebrew 
              ? "בקשה לקבלת הערכה חינמית ומותאמת אישית של 30 דקות" 
              : "Request for free 30-minute personalized assessment",
          }
        ]);

      if (error) throw error;

      toast({
        title: isHebrew ? "!נרשמת בהצלחה" : "Successfully registered!",
        description: isHebrew 
          ? "נקבל קשר תוך שעה עם המלצות מותאמות אישית" 
          : "We'll contact you within an hour with personalized recommendations",
      });

      setEmail("");
      setShowEmailInput(false);
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: isHebrew ? "שגיאה ברישום" : "Registration error",
        description: isHebrew 
          ? "אירעה שגיאה. אנא נסה שוב או צור קשר ישירות" 
          : "An error occurred. Please try again or contact us directly",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailSubmit(e as any);
    }
  };

  return (
    <>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Enhanced Floating Network Animation */}
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Enhanced connections between nearby nodes */}
              {nodes.map((node, i) =>
                nodes.slice(i + 1).map((otherNode, j) => {
                  const distance = Math.sqrt(
                    Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
                  );
                  if (distance < 25) {
                    return (
                      <line
                        key={`${i}-${j}`}
                        x1={`${node.x}%`}
                        y1={`${node.y}%`}
                        x2={`${otherNode.x}%`}
                        y2={`${otherNode.y}%`}
                        stroke="rgba(147, 51, 234, 0.6)"
                        strokeWidth="2"
                        className="animate-pulse"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.8))',
                          animationDuration: '3s',
                          animationDelay: `${(i + j) * 0.3}s`
                        }}
                      />
                    );
                  }
                  return null;
                })
              )}
              
              {/* Enhanced glowing nodes */}
              {nodes.map((node) => (
                <g key={node.id}>
                  {/* Outer glow */}
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r={node.size * 2}
                    fill="rgba(147, 51, 234, 0.2)"
                    className="animate-pulse"
                    style={{
                      filter: 'blur(4px)',
                      opacity: node.opacity * 0.7,
                      animationDelay: `${node.id * 0.15}s`,
                      animationDuration: '2s'
                    }}
                  />
                  {/* Main node */}
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r={node.size}
                    fill="rgba(147, 51, 234, 0.9)"
                    className="animate-pulse"
                    style={{
                      opacity: node.opacity,
                      animationDelay: `${node.id * 0.2}s`,
                      filter: 'drop-shadow(0 0 6px rgba(147, 51, 234, 1))',
                    }}
                  />
                  {/* Inner bright core */}
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r={node.size * 0.4}
                    fill="rgba(255, 255, 255, 0.8)"
                    className="animate-pulse"
                    style={{
                      animationDelay: `${node.id * 0.25}s`,
                      animationDuration: '1.5s'
                    }}
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                {isHebrew ? "בינה מלאכותית לעסק שלך" : "AI for Your Business"}
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
              {isHebrew ? (
                <>
                  הפוך לעסק חכם
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent" dir="rtl">
                    AI בעזרת אינטגרציית
                  </span>
                </>
              ) : (
                <>
                  Make Your Business
                  <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Smarter with AI
                  </span>
                </>
              )}
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              {isHebrew ? "שדרג את העסק שלך עם אינטגרצית בינה מלאכותית יעילה וחסכוניות. מצ'אטבוטים ועד ניתוח נתונים וביצוע משימות, אנו בונים בינה מלאכותית ידידותית, ומותאמת לצרכים שלך" : "Empower your business with cost-effective AI integrations. From chatbots to data analytics, we make AI simple, fast, and affordable."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => setShowContactSheet(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg group"
              >
                {isHebrew ? "התחל עכשיו" : "Get Started Now"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {!showEmailInput ? (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setShowEmailInput(true)}
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
                >
                  {isHebrew ? "הערכה חינמית של 30 דקות" : "Free 30-Minute AI Assessment"}
                </Button>
              ) : (
                <form onSubmit={handleEmailSubmit} className="flex items-center gap-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      required
                      autoFocus
                      placeholder={isHebrew ? "האימייל שלך" : "Your email address"} 
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 w-64"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmittingEmail}
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isSubmittingEmail 
                      ? (isHebrew ? "...שולח" : "Sending...")
                      : (isHebrew ? "שלח" : "Send")
                    }
                  </Button>
                </form>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <Brain className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className={`text-xl font-semibold text-white mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? "חכם ופשוט" : "Smart & Simple"}
              </h3>
              <p className={`text-gray-300 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? "AI שמבין את העסק שלך ופועל בלי להסבך" : "AI that understands your business and works without complication"}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.2s' }}>
              <Code className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className={`text-xl font-semibold text-white mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? "התקנה מהירה" : "Fast Setup"}
              </h3>
              <p className={`text-gray-300 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? "ללא צורך במומחה טכני או השקעה גדולה" : "No tech expert or major investment required"}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.4s' }}>
              <Zap className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className={`text-xl font-semibold text-white mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? "תמיכה מקומית" : "Local Support"}
              </h3>
              <p className={`text-gray-300 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? "צוות ישראלי שזמין בכל שעה לעזור לך" : "Always available to help when you need it"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

<ContactSheet 
  open={showContactSheet} 
  onOpenChange={setShowContactSheet}
/>
