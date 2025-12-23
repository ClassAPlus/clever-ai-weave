import { Bot, MessageSquare, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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

const SAMPLE_QUESTIONS = [
  "מה שעות הפעילות?",
  "כמה עולה?",
  "אפשר לקבוע תור?",
  "What are your hours?",
  "How much does it cost?",
  "Can I book an appointment?",
];

export function AIResponsePreview({ 
  businessName, 
  personality, 
  knowledgeBase,
  industryType 
}: AIResponsePreviewProps) {
  const [sampleQuestion, setSampleQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [response, setResponse] = useState("");

  const generateResponse = () => {
    const { tone, style, emoji_usage, response_length } = personality;
    
    // Check if we have a relevant FAQ
    const matchingFaq = knowledgeBase.faqs.find(faq => 
      sampleQuestion.toLowerCase().includes("שעות") || 
      sampleQuestion.toLowerCase().includes("hours") ||
      faq.q.toLowerCase().includes(sampleQuestion.toLowerCase().slice(0, 10))
    );
    
    const hasPricing = knowledgeBase.pricing.length > 0;
    const isPricingQuestion = sampleQuestion.includes("עולה") || sampleQuestion.includes("cost") || sampleQuestion.includes("price");
    
    // Base responses by tone
    const greetings: Record<string, string> = {
      professional: "שלום,",
      friendly: "היי!",
      casual: "היי 👋",
      formal: "שלום רב,",
    };
    
    const closings: Record<string, string> = {
      professional: "נשמח לעזור בכל שאלה.",
      friendly: "אם יש עוד שאלות, אני כאן!",
      casual: "תרגיש חופשי לשאול עוד!",
      formal: "אנו עומדים לרשותך.",
    };
    
    // Build response
    let baseResponse = "";
    
    // Opening based on tone
    const greeting = greetings[tone] || greetings.friendly;
    
    // Content based on question and knowledge
    if (matchingFaq && (sampleQuestion.includes("שעות") || sampleQuestion.includes("hours"))) {
      baseResponse = matchingFaq.a;
    } else if (isPricingQuestion && hasPricing) {
      const prices = knowledgeBase.pricing.slice(0, 3).map(p => `${p.service}: ${p.price}`).join(", ");
      baseResponse = `המחירים שלנו: ${prices}`;
    } else if (sampleQuestion.includes("תור") || sampleQuestion.includes("appointment") || sampleQuestion.includes("book")) {
      baseResponse = "בטח! מתי נוח לך? אני יכול לבדוק זמינות.";
    } else {
      baseResponse = `תודה שפנית ל${businessName}! נשמח לעזור.`;
    }
    
    // Apply style
    let styledResponse = "";
    if (style === "concise") {
      styledResponse = baseResponse.split(".")[0] + ".";
    } else if (style === "detailed") {
      styledResponse = `${baseResponse} ${closings[tone] || closings.friendly}`;
    } else {
      styledResponse = baseResponse;
    }
    
    // Apply emoji usage
    let finalResponse = "";
    if (emoji_usage === "none") {
      finalResponse = `${greeting.replace(/[^\w\sא-ת,]/g, "")} ${styledResponse}`;
    } else if (emoji_usage === "minimal") {
      finalResponse = `${greeting} ${styledResponse}`;
    } else if (emoji_usage === "moderate") {
      finalResponse = `${greeting} ${styledResponse} 😊`;
    } else if (emoji_usage === "frequent") {
      finalResponse = `${greeting} ✨ ${styledResponse} 🙌😊`;
    } else {
      finalResponse = `${greeting} ${styledResponse}`;
    }
    
    // Apply length constraints
    if (response_length === "short" && finalResponse.length > 100) {
      finalResponse = finalResponse.slice(0, 97) + "...";
    } else if (response_length === "medium" && finalResponse.length > 200) {
      finalResponse = finalResponse.slice(0, 197) + "...";
    }
    
    setResponse(finalResponse);
  };

  useEffect(() => {
    generateResponse();
  }, [personality, knowledgeBase, sampleQuestion, businessName]);

  const cycleQuestion = () => {
    const currentIndex = SAMPLE_QUESTIONS.indexOf(sampleQuestion);
    const nextIndex = (currentIndex + 1) % SAMPLE_QUESTIONS.length;
    setSampleQuestion(SAMPLE_QUESTIONS[nextIndex]);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            See how your AI would respond with current settings
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleQuestion}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Another
          </Button>
        </div>

        {/* Customer Message */}
        <div className="flex justify-end">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
            <p className="text-sm text-blue-100" dir="auto">{sampleQuestion}</p>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-purple-400" />
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
            <p className="text-sm text-gray-200" dir="auto">{response}</p>
          </div>
        </div>

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
            {personality.response_length} length
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
