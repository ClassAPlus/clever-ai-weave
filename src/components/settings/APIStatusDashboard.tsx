import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

interface APIStatus {
  name: string;
  key: string;
  configured: boolean;
  tested: boolean | null;
  maskedValue: string;
}

interface APIStatusDashboardProps {
  businessId: string;
}

export function APIStatusDashboard({ businessId }: APIStatusDashboardProps) {
  const { toast } = useToast();
  const [testing, setTesting] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, boolean | null>>({
    openai: null,
    twilio: null,
    resend: null,
  });

  const apis: APIStatus[] = [
    {
      name: "OpenAI",
      key: "openai",
      configured: true, // These are set in Supabase secrets
      tested: statuses.openai,
      maskedValue: "sk-...****",
    },
    {
      name: "Twilio",
      key: "twilio",
      configured: true,
      tested: statuses.twilio,
      maskedValue: "AC...****",
    },
    {
      name: "Resend",
      key: "resend",
      configured: true,
      tested: statuses.resend,
      maskedValue: "re_...****",
    },
  ];

  const testConnection = async (apiKey: string) => {
    setTesting(apiKey);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-connections', {
        body: { api: apiKey, businessId }
      });

      if (error) throw error;

      setStatuses(prev => ({
        ...prev,
        [apiKey]: data.success,
      }));

      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error(`Error testing ${apiKey}:`, error);
      setStatuses(prev => ({
        ...prev,
        [apiKey]: false,
      }));
      toast({
        variant: "destructive",
        title: "Test failed",
        description: error instanceof Error ? error.message : "Could not test connection",
      });
    } finally {
      setTesting(null);
    }
  };

  const testAllConnections = async () => {
    for (const api of apis) {
      await testConnection(api.key);
    }
  };

  const getStatusBadge = (api: APIStatus) => {
    if (!api.configured) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Not Configured</Badge>;
    }
    if (api.tested === null) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Not Tested</Badge>;
    }
    if (api.tested) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>;
    }
    return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
  };

  const getStatusIcon = (api: APIStatus) => {
    if (!api.configured) {
      return <XCircle className="h-5 w-5 text-red-400" />;
    }
    if (api.tested === null) {
      return <div className="h-5 w-5 rounded-full bg-yellow-500/30 border-2 border-yellow-500" />;
    }
    if (api.tested) {
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    }
    return <XCircle className="h-5 w-5 text-red-400" />;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-400" />
              API Connections
            </CardTitle>
            <CardDescription className="text-gray-400">
              Status of external service integrations
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testAllConnections}
            disabled={testing !== null}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Test All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {apis.map((api) => (
          <div
            key={api.key}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-700"
          >
            <div className="flex items-center gap-4">
              {getStatusIcon(api)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{api.name}</span>
                  {getStatusBadge(api)}
                </div>
                <p className="text-sm text-gray-500 font-mono">{api.maskedValue}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testConnection(api.key)}
              disabled={testing !== null}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {testing === api.key ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Test"
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
