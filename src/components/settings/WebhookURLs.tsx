import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Webhook, Copy, Check, Phone, MessageSquare, PhoneForwarded, Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

const PROJECT_ID = "wqhakzywmqirucmetnuo";
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

interface WebhookInfo {
  name: string;
  description: string;
  url: string;
  icon: React.ElementType;
  key: string;
}

interface WebhookTestResult {
  [key: string]: 'idle' | 'testing' | 'success' | 'error';
}

export function WebhookURLs() {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<WebhookTestResult>({});
  const [testingAll, setTestingAll] = useState(false);

  const webhooks: WebhookInfo[] = [
    {
      name: "Voice Incoming",
      description: "Handles incoming voice calls from Twilio",
      url: `${BASE_URL}/voice-incoming`,
      icon: Phone,
      key: "voice-incoming",
    },
    {
      name: "SMS Incoming",
      description: "Processes incoming SMS messages",
      url: `${BASE_URL}/sms-incoming`,
      icon: MessageSquare,
      key: "sms-incoming",
    },
    {
      name: "Voice Dial Result",
      description: "Receives call forwarding outcomes",
      url: `${BASE_URL}/voice-dial-result`,
      icon: PhoneForwarded,
      key: "voice-dial-result",
    },
  ];

  const testWebhook = async (webhook: WebhookInfo) => {
    setTestResults(prev => ({ ...prev, [webhook.key]: 'testing' }));
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ test: 'true' }).toString(),
      });
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [webhook.key]: 'success' }));
        toast({
          title: "Webhook responding",
          description: `${webhook.name} is correctly configured`,
        });
      } else {
        throw new Error(`Status ${response.status}`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [webhook.key]: 'error' }));
      toast({
        variant: "destructive",
        title: "Webhook test failed",
        description: `${webhook.name} is not responding correctly`,
      });
    }
  };

  const testAllWebhooks = async () => {
    setTestingAll(true);
    for (const webhook of webhooks) {
      await testWebhook(webhook);
    }
    setTestingAll(false);
    toast({
      title: "Tests complete",
      description: "All webhook tests have finished",
    });
  };

  const getTestIcon = (key: string) => {
    const status = testResults[key];
    if (status === 'testing') return <Loader2 className="h-4 w-4 animate-spin text-purple-400" />;
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-400" />;
    return null;
  };

  const copyToClipboard = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: "Copied!",
        description: `${name} URL copied to clipboard`,
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the URL manually",
      });
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Webhook className="h-5 w-5 text-purple-400" />
              Webhook URLs
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure these URLs in your Twilio console
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testAllWebhooks}
            disabled={testingAll}
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
          >
            {testingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhooks.map((webhook) => {
          const Icon = webhook.icon;
          return (
            <div
              key={webhook.name}
              className="p-4 rounded-lg bg-gray-900/50 border border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Icon className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{webhook.name}</p>
                      {getTestIcon(webhook.key)}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{webhook.description}</p>
                    <code className="text-xs text-purple-300 bg-gray-800 px-2 py-1 rounded block truncate">
                      {webhook.url}
                    </code>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testWebhook(webhook)}
                    disabled={testResults[webhook.key] === 'testing'}
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                    title="Test webhook"
                  >
                    {testResults[webhook.key] === 'testing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(webhook.url, webhook.name)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    {copiedUrl === webhook.url ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Copy these URLs to your Twilio phone number's webhook settings to enable AI call handling and SMS responses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
