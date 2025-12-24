import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bug, Send, MessageSquare, Loader2, Bot } from "lucide-react";

interface DebugToolsProps {
  businessId: string;
  businessName: string;
  ownerPhone: string;
  twilioPhoneNumber: string | null;
}

export function DebugTools({ businessId, businessName, ownerPhone, twilioPhoneNumber }: DebugToolsProps) {
  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("");
  const [aiTestMessage, setAiTestMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);

  const sendTestSms = async () => {
    if (!testMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Message required",
        description: "Please enter a test message",
      });
      return;
    }

    setIsSendingSms(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-sms', {
        body: { 
          businessId, 
          greeting: testMessage,
        }
      });

      if (error) throw error;

      toast({
        title: "Test SMS sent",
        description: `Message sent to ${ownerPhone}`,
      });
      setTestMessage("");
    } catch (error) {
      console.error("Error sending test SMS:", error);
      toast({
        variant: "destructive",
        title: "Failed to send SMS",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  const testAiResponse = async () => {
    if (!aiTestMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Message required",
        description: "Please enter a sample customer message",
      });
      return;
    }

    setIsTestingAi(true);
    setAiResponse("");
    try {
      const { data, error } = await supabase.functions.invoke('ai-preview', {
        body: { 
          businessName,
          sampleMessage: aiTestMessage,
        }
      });

      if (error) throw error;

      setAiResponse(data.response || "No response generated");
    } catch (error) {
      console.error("Error testing AI:", error);
      toast({
        variant: "destructive",
        title: "AI test failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bug className="h-5 w-5 text-purple-400" />
          Debug Tools
        </CardTitle>
        <CardDescription className="text-gray-400">
          Test SMS delivery and AI responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test SMS Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            <Label className="text-gray-300 font-medium">Send Test SMS</Label>
          </div>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="bg-gray-700 border-gray-600 text-white flex-1"
            />
            <Button
              onClick={sendTestSms}
              disabled={isSendingSms || !twilioPhoneNumber}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSendingSms ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!twilioPhoneNumber && (
            <p className="text-xs text-gray-500">Configure an AI phone number to test SMS</p>
          )}
        </div>

        {/* Test AI Response Section */}
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-400" />
            <Label className="text-gray-300 font-medium">Test AI Response</Label>
          </div>
          <div className="flex gap-2">
            <Input
              value={aiTestMessage}
              onChange={(e) => setAiTestMessage(e.target.value)}
              placeholder="Enter sample customer message..."
              className="bg-gray-700 border-gray-600 text-white flex-1"
              onKeyDown={(e) => e.key === "Enter" && testAiResponse()}
            />
            <Button
              onClick={testAiResponse}
              disabled={isTestingAi}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isTestingAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Test"
              )}
            </Button>
          </div>
          {aiResponse && (
            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
