import { Bot, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIPersonality {
  tone: string;
  style: string;
  emoji_usage: string;
  response_length: string;
}

interface KnowledgeBase {
  faqs: { q: string; a: string }[];
  policies: Record<string, string>;
  pricing: { service: string; price: string }[];
  staff: { name: string; specialty: string }[];
}

interface AIResponsePreviewProps {
  businessName: string;
  personality: AIPersonality;
  knowledgeBase: KnowledgeBase;
  industryType: string;
}

const SAMPLE_QUESTIONS_HE = [
  "מה שעות הפעילות?",
  "כמה עולה?",
  "אפשר לקבוע תור?",
  "יש לכם הנחות?",
  "מי עובד היום?",
];

const SAMPLE_QUESTIONS_EN = [
  "What are your hours?",
  "How much does it cost?",
  "Can I book an appointment?",
  "Do you have any discounts?",
  "Who is working today?",
];

export function AIResponsePreview({ 
  businessName, 
  personality, 
  knowledgeBase,
  industryType 
}: AIResponsePreviewProps) {
  const { toast } = useToast();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isHebrew, setIsHebrew] = useState(true);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const questions = isHebrew ? SAMPLE_QUESTIONS_HE : SAMPLE_QUESTIONS_EN;
  const sampleQuestion = questions[questionIndex];

  const generatePreview = useCallback(async () => {
    setIsLoading(true);
    setHasGenerated(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-preview', {
        body: {
          businessName,
          industryType,
          personality,
          knowledgeBase,
          sampleMessage: sampleQuestion,
          language: isHebrew ? 'hebrew' : 'english',
        },
      });

      if (error) {
        console.error('AI Preview error:', error);
        throw error;
      }

      setResponse(data.response || 'No response generated');
    } catch (err) {
      console.error('Preview error:', err);
      toast({
        variant: "destructive",
        title: "Preview Error",
        description: "Could not generate AI preview. Try again.",
      });
      // Fallback to local generation
      setResponse(generateLocalFallback());
    } finally {
      setIsLoading(false);
    }
  }, [businessName, industryType, personality, knowledgeBase, sampleQuestion, isHebrew, toast]);

  const generateLocalFallback = () => {
    const { tone, emoji_usage } = personality;
    const greetings: Record<string, string> = {
      professional: isHebrew ? "שלום," : "Hello,",
      friendly: isHebrew ? "היי!" : "Hi!",
      casual: isHebrew ? "היי 👋" : "Hey 👋",
      formal: isHebrew ? "שלום רב," : "Good day,",
    };
    const greeting = greetings[tone] || greetings.friendly;
    const base = isHebrew 
      ? `תודה שפנית ל${businessName}! נשמח לעזור.`
      : `Thanks for reaching out to ${businessName}! Happy to help.`;
    
    let result = `${greeting} ${base}`;
    if (emoji_usage === "frequent") result += " 😊✨";
    else if (emoji_usage === "moderate") result += " 😊";
    
    return result;
  };

  const cycleQuestion = () => {
    setQuestionIndex((prev) => (prev + 1) % questions.length);
    setHasGenerated(false);
    setResponse("");
  };

  const toggleLanguage = () => {
    setIsHebrew((prev) => !prev);
    setQuestionIndex(0);
    setHasGenerated(false);
    setResponse("");
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            Test how AI responds with your settings
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-gray-400 hover:text-white text-xs px-2"
            >
              {isHebrew ? "EN" : "עב"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleQuestion}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Next
            </Button>
          </div>
        </div>

        {/* Customer Message */}
        <div className="flex justify-end">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
            <p className="text-sm text-blue-100" dir={isHebrew ? "rtl" : "ltr"}>{sampleQuestion}</p>
          </div>
        </div>

        {/* AI Response or Generate Button */}
        {!hasGenerated ? (
          <div className="flex justify-center py-4">
            <Button
              onClick={generatePreview}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Response
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
              ) : (
                <Bot className="h-4 w-4 text-purple-400" />
              )}
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%] min-h-[40px]">
              {isLoading ? (
                <p className="text-sm text-gray-400 italic">Generating response...</p>
              ) : (
                <p className="text-sm text-gray-200" dir={isHebrew ? "rtl" : "ltr"}>{response}</p>
              )}
            </div>
          </div>
        )}

        {/* Regenerate button after response */}
        {hasGenerated && !isLoading && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={generatePreview}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        )}

        {/* Personality Indicators */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
            {personality.tone}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
            {personality.style}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
            {personality.emoji_usage} emoji
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300">
            {personality.response_length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
