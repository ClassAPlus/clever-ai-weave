import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Phone, MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SMSPreviewTestProps {
  businessId: string;
  businessName: string;
  twilioPhoneNumber: string | null;
  ownerPhone: string | null;
  template: string;
  language: string;
  disabled?: boolean;
}

export function SMSPreviewTest({
  businessId,
  businessName,
  twilioPhoneNumber,
  ownerPhone,
  template,
  language,
  disabled = false,
}: SMSPreviewTestProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [testPhone, setTestPhone] = useState(ownerPhone || "");
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);

  // Generate preview message with sample data
  const getSampleData = () => {
    const sampleDataByLang: Record<string, { name: string; service: string; time: string; date: string }> = {
      hebrew: { name: "ישראל ישראלי", service: "תספורת", time: "2:30 PM", date: "יום שלישי, 15 בינואר" },
      arabic: { name: "أحمد محمد", service: "قص شعر", time: "2:30 PM", date: "الثلاثاء، 15 يناير" },
      english: { name: "John Smith", service: "Haircut", time: "2:30 PM", date: "Tuesday, January 15" },
      russian: { name: "Иван Петров", service: "Стрижка", time: "2:30 PM", date: "Вторник, 15 января" },
      spanish: { name: "Juan García", service: "Corte de pelo", time: "2:30 PM", date: "Martes, 15 de enero" },
      french: { name: "Jean Dupont", service: "Coupe de cheveux", time: "2:30 PM", date: "Mardi 15 janvier" },
      german: { name: "Hans Müller", service: "Haarschnitt", time: "2:30 PM", date: "Dienstag, 15. Januar" },
    };
    return sampleDataByLang[language] || sampleDataByLang.english;
  };

  const getPreviewMessage = () => {
    const sampleData = getSampleData();
    return template
      .replace(/\{name\}/gi, sampleData.name)
      .replace(/\{business\}/gi, businessName || "Your Business")
      .replace(/\{service\}/gi, sampleData.service)
      .replace(/\{time\}/gi, sampleData.time)
      .replace(/\{date\}/gi, sampleData.date);
  };

  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) {
      toast({
        variant: "destructive",
        title: "Phone number required",
        description: "Please enter a phone number to receive the test SMS.",
      });
      return;
    }

    if (!twilioPhoneNumber) {
      toast({
        variant: "destructive",
        title: "No Twilio number configured",
        description: "Please configure a Twilio phone number first.",
      });
      return;
    }

    setIsSending(true);
    try {
      const previewMessage = getPreviewMessage();
      
      // Add test prefix to the message
      const testMessage = `[TEST PREVIEW] ${previewMessage}`;

      const { data, error } = await supabase.functions.invoke("send-test-sms", {
        body: {
          to: testPhone.trim(),
          from: twilioPhoneNumber,
          message: testMessage,
          businessId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setLastSentAt(new Date());
        toast({
          title: "Test SMS sent!",
          description: `Preview message sent to ${testPhone}`,
        });
      } else {
        throw new Error(data?.error || "Failed to send test SMS");
      }
    } catch (error) {
      console.error("Error sending test SMS:", error);
      toast({
        variant: "destructive",
        title: "Failed to send test SMS",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const isRTL = ['hebrew', 'arabic'].includes(language);

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">Send Test SMS</span>
          </div>
          {lastSentAt && (
            <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sent {lastSentAt.toLocaleTimeString()}
            </Badge>
          )}
        </div>

        {/* Message Preview */}
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-gray-400">Message Preview</span>
            <Badge variant="outline" className="text-xs text-gray-500 border-gray-600">
              [TEST PREVIEW] prefix will be added
            </Badge>
          </div>
          <p 
            className="text-sm text-gray-200 whitespace-pre-wrap"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {getPreviewMessage()}
          </p>
        </div>

        {/* Phone input and send button */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="test-phone" className="sr-only">Test phone number</Label>
            <Input
              id="test-phone"
              type="tel"
              placeholder="Enter phone number (e.g., +1234567890)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              disabled={disabled || isSending}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <Button
            onClick={handleSendTestSMS}
            disabled={disabled || isSending || !testPhone.trim() || !twilioPhoneNumber}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </>
            )}
          </Button>
        </div>

        {!twilioPhoneNumber && (
          <p className="text-xs text-amber-400">
            ⚠️ Configure a Twilio phone number to send test messages.
          </p>
        )}
      </CardContent>
    </Card>
  );
}