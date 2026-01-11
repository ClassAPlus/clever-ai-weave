import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, Loader2, Unlink, RefreshCw } from "lucide-react";

interface GoogleCalendarSyncProps {
  businessId: string;
}

export function GoogleCalendarSync({ businessId }: GoogleCalendarSyncProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    
    // Listen for OAuth popup messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-calendar-connected') {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Google Calendar connected successfully!",
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [businessId]);

  const checkConnectionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-calendar?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      setIsConnected(result?.connected || false);
    } catch (error) {
      console.error('Error checking calendar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const redirectUri = window.location.origin;
      
      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-calendar?action=auth-url&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Open popup for OAuth
      const popup = window.open(data.url, 'google-auth', 'width=500,height=600');
      
      // Poll for popup close
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
          checkConnectionStatus();
        }
      }, 500);
    } catch (error: any) {
      console.error('Error connecting to Google Calendar:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Google Calendar",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-calendar?action=disconnect`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Google Calendar disconnected successfully",
      });
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-calendar?action=sync-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      toast({
        title: "Sync complete",
        description: `Synced ${data.synced} appointments${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
      });
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync appointments",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
            </CardTitle>
            <CardDescription>
              Sync appointments to your Google Calendar
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSyncAll} 
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync All Appointments
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Connect Google Calendar
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          {isConnected 
            ? "Your appointments will be synced to your primary Google Calendar. New appointments are synced automatically."
            : "Connect your Google Calendar to sync appointments automatically."
          }
        </p>
      </CardContent>
    </Card>
  );
}
