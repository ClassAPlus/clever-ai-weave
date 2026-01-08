import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Volume2,
  AlertCircle,
  Loader2,
  AudioLines
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VoiceAgentDemoProps {
  businessId: string;
  agentId?: string;
  disabled?: boolean;
}

export function VoiceAgentDemo({ businessId, agentId, disabled = false }: VoiceAgentDemoProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      // Handle different message types from ElevenLabs
      const msg = message as unknown as Record<string, unknown>;
      if (msg.user_transcription_event) {
        const event = msg.user_transcription_event as { user_transcript?: string };
        if (event.user_transcript) {
          setTranscript(prev => [...prev, { role: 'user', text: event.user_transcript! }]);
        }
      } else if (msg.agent_response_event) {
        const event = msg.agent_response_event as { agent_response?: string };
        if (event.agent_response) {
          setTranscript(prev => [...prev, { role: 'agent', text: event.agent_response! }]);
        }
      }
    },
    onError: (err) => {
      console.error("Conversation error:", err);
      const errorMessage = typeof err === 'string' ? err : (err as Error)?.message || "An error occurred during the conversation";
      setError(errorMessage);
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId) {
      setError("Agent ID is not configured. Please save your ElevenLabs settings first.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: { businessId },
        }
      );

      if (fnError || !data?.token) {
        throw new Error(fnError?.message || data?.error || "Failed to get conversation token");
      }

      // Start the conversation with WebRTC using the conversation token
      await conversation.startSession({
        conversationToken: data.token,
        overrides: data.overrides,
      });

      // Set initial volume
      await conversation.setVolume({ volume });

    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, businessId, conversation, volume]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setTranscript([]);
  }, [conversation]);

  const handleVolumeChange = useCallback(async (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (conversation.status === 'connected') {
      await conversation.setVolume({ volume: newVolume });
    }
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  if (!agentId) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-8 text-center">
          <Mic className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Configure your Agent ID above to preview your voice AI
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isConnected ? "bg-green-500/10" : "bg-muted"
            )}>
              <Phone className={cn(
                "h-5 w-5 transition-colors",
                isConnected ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg">Voice Demo</CardTitle>
              <CardDescription>
                Preview your AI agent before going live
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={cn(
              "transition-colors",
              isConnected && "bg-green-500 hover:bg-green-500/90"
            )}
          >
            {isConnected ? (
              isSpeaking ? (
                <>
                  <AudioLines className="h-3 w-3 mr-1 animate-pulse" />
                  Speaking
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3 mr-1" />
                  Listening
                </>
              )
            ) : (
              <>
                <MicOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transcript Area */}
        {isConnected && (
          <div className="rounded-lg bg-muted/50 p-4 min-h-[120px] max-h-[200px] overflow-y-auto space-y-2">
            {transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isSpeaking ? "Agent is speaking..." : "Start talking to test your AI..."}
              </p>
            ) : (
              transcript.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "text-sm p-2 rounded-lg max-w-[85%]",
                    msg.role === 'user' 
                      ? "bg-primary/10 text-primary ml-auto" 
                      : "bg-muted text-foreground"
                  )}
                >
                  <span className="font-medium text-xs opacity-70 block mb-0.5">
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </span>
                  {msg.text}
                </div>
              ))
            )}
          </div>
        )}

        {/* Voice Activity Indicator */}
        {isConnected && (
          <div className="flex items-center justify-center gap-1 h-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-150",
                  isSpeaking 
                    ? "bg-green-500 animate-pulse" 
                    : "bg-primary/30"
                )}
                style={{
                  height: isSpeaking ? `${Math.random() * 20 + 12}px` : '8px',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Volume Control */}
        {isConnected && (
          <div className="flex items-center gap-3 px-2">
            <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.05}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Control Button */}
        <Button
          onClick={isConnected ? stopConversation : startConversation}
          disabled={disabled || isConnecting}
          variant={isConnected ? "destructive" : "default"}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <PhoneOff className="h-4 w-4 mr-2" />
              End Demo Call
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              Start Demo Call
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This demo uses your microphone to test the AI agent with your business configuration.
        </p>
      </CardContent>
    </Card>
  );
}
