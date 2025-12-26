import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Loader2, Volume2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AITestCallProps {
  businessId: string;
  businessName: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export function AITestCall({ businessId, businessName }: AITestCallProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const startCall = async () => {
    setStatus("connecting");
    setError(null);
    setTranscript([]);

    try {
      // Get ephemeral token from our edge function
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke("ai-test-call", {
        body: { businessId }
      });

      if (sessionError) {
        throw new Error(sessionError.message || "Failed to create session");
      }

      if (!sessionData?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = sessionData.client_secret.value;
      console.log("Got ephemeral key, connecting to OpenAI...");

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Create audio element for playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      // Set up remote audio
      pc.ontrack = (e) => {
        console.log("Received remote audio track");
        audioEl.srcObject = e.streams[0];
      };

      // Get local audio and add track
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = localStream;

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Set up data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("Data channel open");
        setTranscript(prev => [...prev, "📞 Connected - Start speaking..."]);
      });

      dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          handleRealtimeEvent(event);
        } catch (err) {
          console.error("Error parsing event:", err);
        }
      });

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");
      setStatus("connected");

      // Send initial greeting request
      setTimeout(() => {
        if (dc.readyState === "open") {
          dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [{
                type: "input_text",
                text: "Greet the caller warmly and ask how you can help them today. Mention this is a test call if appropriate."
              }]
            }
          }));
          dc.send(JSON.stringify({ type: "response.create" }));
        }
      }, 500);

    } catch (err) {
      console.error("Error starting call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setStatus("error");
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Failed to start test call",
        variant: "destructive",
      });
      cleanup();
    }
  };

  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case "response.audio.delta":
        setIsAISpeaking(true);
        break;

      case "response.audio.done":
        setIsAISpeaking(false);
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          setTranscript(prev => [...prev, `🤖 AI: ${event.transcript}`]);
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          setTranscript(prev => [...prev, `🎤 You: ${event.transcript}`]);
        }
        break;

      case "input_audio_buffer.speech_started":
        setIsAISpeaking(false);
        break;

      case "error":
        console.error("Realtime error:", event.error);
        setTranscript(prev => [...prev, `⚠️ Error: ${event.error?.message || "Unknown error"}`]);
        break;
    }
  };

  const endCall = () => {
    cleanup();
    setStatus("idle");
    setTranscript(prev => [...prev, "📞 Call ended"]);
    toast({
      title: "Test Call Ended",
      description: "The test call has been disconnected.",
    });
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    setIsAISpeaking(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Test AI Receptionist
        </CardTitle>
        <CardDescription>
          Simulate a phone call to test your AI receptionist without making a real call
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <Badge 
            variant={
              status === "connected" ? "default" : 
              status === "connecting" ? "secondary" : 
              status === "error" ? "destructive" : 
              "outline"
            }
          >
            {status === "idle" && "Ready"}
            {status === "connecting" && "Connecting..."}
            {status === "connected" && "In Call"}
            {status === "error" && "Error"}
          </Badge>
          
          {isAISpeaking && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4 animate-pulse text-primary" />
              <span>AI is speaking...</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
            {transcript.map((line, index) => (
              <p 
                key={index} 
                className={`text-sm ${
                  line.startsWith("🤖") ? "text-primary" : 
                  line.startsWith("🎤") ? "text-foreground" : 
                  "text-muted-foreground"
                }`}
              >
                {line}
              </p>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {status === "idle" || status === "error" ? (
            <Button onClick={startCall} className="gap-2">
              <Phone className="h-4 w-4" />
              Start Test Call
            </Button>
          ) : status === "connecting" ? (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </Button>
          ) : (
            <>
              <Button onClick={endCall} variant="destructive" className="gap-2">
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
              <Button onClick={toggleMute} variant="outline" className="gap-2">
                {isMuted ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Mute
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <p className="text-xs text-muted-foreground">
          This test uses your microphone and speakers to simulate a voice call. 
          Speak naturally and the AI will respond based on your business settings.
        </p>
      </CardContent>
    </Card>
  );
}
