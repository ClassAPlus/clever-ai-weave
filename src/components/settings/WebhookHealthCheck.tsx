import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  checks?: {
    voiceflow_api_key: boolean;
    supabase_url: boolean;
    supabase_service_key: boolean;
  };
  error?: string;
  latencyMs?: number;
}

export function WebhookHealthCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('voiceflow-phone', {
        body: null,
        method: 'GET',
      });
      
      // The function uses query params, so we need a direct fetch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://wqhakzywmqirucmetnuo.supabase.co'}/functions/v1/voiceflow-phone?health=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setResult({
          ...data,
          latencyMs,
        });
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        setResult({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: `HTTP ${response.status}: ${errorText}`,
          latencyMs,
        });
      }
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      setResult({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Connection failed',
        latencyMs,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (!result) return null;
    
    switch (result.status) {
      case 'healthy':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Activity className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  return (
    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium text-white">Webhook Health Check</p>
            <p className="text-xs text-gray-400">Test voiceflow-phone endpoint connectivity</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={runHealthCheck}
          disabled={isChecking}
          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Check
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status</span>
            {getStatusBadge()}
          </div>
          
          {result.latencyMs !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Latency</span>
              <span className={`text-sm font-mono ${
                result.latencyMs < 500 ? 'text-emerald-400' : 
                result.latencyMs < 1500 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {result.latencyMs}ms
              </span>
            </div>
          )}

          {result.checks && (
            <div className="space-y-2">
              <span className="text-xs text-gray-500">Configuration checks:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(result.checks).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                    {value ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.error && (
            <div className="p-2 bg-red-500/10 rounded border border-red-500/30">
              <p className="text-xs text-red-400">{result.error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Last checked: {new Date(result.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
