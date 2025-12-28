import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Mic, MicOff, Loader2, Volume2, AlertCircle, Activity, Wifi, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AITestCallProps {
  businessId: string;
  businessName: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface AudioDiagnostics {
  inputLevel: number;
  outputLevel: number;
  latency: number;
  packetsLost: number;
  packetsReceived: number;
  jitter: number;
  connectionState: string;
  iceState: string;
  audioCodec: string;
  bitrate: number;
}

const defaultDiagnostics: AudioDiagnostics = {
  inputLevel: 0,
  outputLevel: 0,
  latency: 0,
  packetsLost: 0,
  packetsReceived: 0,
  jitter: 0,
  connectionState: "new",
  iceState: "new",
  audioCodec: "-",
  bitrate: 0,
};

export function AITestCall({ businessId, businessName }: AITestCallProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics>(defaultDiagnostics);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const diagnosticsIntervalRef = useRef<number | null>(null);
  const prevBytesReceivedRef = useRef<number>(0);
  const prevTimestampRef = useRef<number>(0);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Setup audio level monitoring
  const setupAudioAnalysis = useCallback((localStream: MediaStream, remoteStream: MediaStream | null) => {
    try {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      // Input (microphone) analyser
      const inputAnalyser = audioContext.createAnalyser();
      inputAnalyser.fftSize = 256;
      const inputSource = audioContext.createMediaStreamSource(localStream);
      inputSource.connect(inputAnalyser);
      analyserRef.current = inputAnalyser;

      // Output (AI voice) analyser - if remote stream exists
      if (remoteStream) {
        const outputAnalyser = audioContext.createAnalyser();
        outputAnalyser.fftSize = 256;
        const outputSource = audioContext.createMediaStreamSource(remoteStream);
        outputSource.connect(outputAnalyser);
        outputAnalyserRef.current = outputAnalyser;
      }
    } catch (err) {
      console.error("Error setting up audio analysis:", err);
    }
  }, []);

  // Get audio levels from analyser
  const getAudioLevel = (analyser: AnalyserNode | null): number => {
    if (!analyser) return 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return Math.min(100, (average / 128) * 100);
  };

  // Update diagnostics periodically
  const updateDiagnostics = useCallback(async () => {
    if (!pcRef.current) return;

    const pc = pcRef.current;
    const inputLevel = getAudioLevel(analyserRef.current);
    const outputLevel = getAudioLevel(outputAnalyserRef.current);

    try {
      const stats = await pc.getStats();
      let latency = 0;
      let packetsLost = 0;
      let packetsReceived = 0;
      let jitter = 0;
      let audioCodec = "-";
      let bytesReceived = 0;
      let timestamp = 0;

      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "audio") {
          packetsLost = report.packetsLost || 0;
          packetsReceived = report.packetsReceived || 0;
          jitter = (report.jitter || 0) * 1000; // Convert to ms
          bytesReceived = report.bytesReceived || 0;
          timestamp = report.timestamp || 0;
        }
        if (report.type === "remote-inbound-rtp" && report.kind === "audio") {
          latency = (report.roundTripTime || 0) * 1000; // Convert to ms
        }
        if (report.type === "codec" && report.mimeType?.includes("audio")) {
          audioCodec = report.mimeType.replace("audio/", "");
        }
      });

      // Calculate bitrate
      let bitrate = 0;
      if (prevBytesReceivedRef.current > 0 && prevTimestampRef.current > 0) {
        const bytesDiff = bytesReceived - prevBytesReceivedRef.current;
        const timeDiff = (timestamp - prevTimestampRef.current) / 1000; // Convert to seconds
        if (timeDiff > 0) {
          bitrate = Math.round((bytesDiff * 8) / timeDiff / 1000); // kbps
        }
      }
      prevBytesReceivedRef.current = bytesReceived;
      prevTimestampRef.current = timestamp;

      setDiagnostics({
        inputLevel,
        outputLevel,
        latency: Math.round(latency),
        packetsLost,
        packetsReceived,
        jitter: Math.round(jitter * 10) / 10,
        connectionState: pc.connectionState,
        iceState: pc.iceConnectionState,
        audioCodec,
        bitrate,
      });
    } catch (err) {
      console.error("Error getting stats:", err);
      setDiagnostics(prev => ({ ...prev, inputLevel, outputLevel }));
    }
  }, []);

  // Start diagnostics interval
  const startDiagnosticsInterval = useCallback(() => {
    if (diagnosticsIntervalRef.current) {
      clearInterval(diagnosticsIntervalRef.current);
    }
    diagnosticsIntervalRef.current = window.setInterval(updateDiagnostics, 500);
  }, [updateDiagnostics]);

  // Stop diagnostics interval
  const stopDiagnosticsInterval = useCallback(() => {
    if (diagnosticsIntervalRef.current) {
      clearInterval(diagnosticsIntervalRef.current);
      diagnosticsIntervalRef.current = null;
    }
  }, []);

  const startCall = async () => {
    setStatus("connecting");
    setError(null);
    setTranscript([]);
    setDiagnostics(defaultDiagnostics);
    prevBytesReceivedRef.current = 0;
    prevTimestampRef.current = 0;

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

      // Create peer connection with STUN/TURN for better connectivity diagnostics
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      pcRef.current = pc;

      // Monitor connection state changes
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        setDiagnostics(prev => ({ ...prev, connectionState: pc.connectionState }));
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setTranscript(prev => [...prev, `⚠️ Connection ${pc.connectionState}`]);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
        setDiagnostics(prev => ({ ...prev, iceState: pc.iceConnectionState }));
      };

      // Create audio element for playback
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      // Set up remote audio with analyser
      pc.ontrack = (e) => {
        console.log("Received remote audio track");
        audioEl.srcObject = e.streams[0];
        
        // Setup output analyser for remote audio
        if (audioContextRef.current && e.streams[0]) {
          try {
            const outputAnalyser = audioContextRef.current.createAnalyser();
            outputAnalyser.fftSize = 256;
            const outputSource = audioContextRef.current.createMediaStreamSource(e.streams[0]);
            outputSource.connect(outputAnalyser);
            outputAnalyserRef.current = outputAnalyser;
          } catch (err) {
            console.error("Error setting up output analyser:", err);
          }
        }
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

      // Setup audio analysis for input
      setupAudioAnalysis(localStream, null);

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Set up data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("open", () => {
        console.log("Data channel open");
        setTranscript(prev => [...prev, "📞 Connected - Start speaking..."]);
        startDiagnosticsInterval();
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
    stopDiagnosticsInterval();
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    outputAnalyserRef.current = null;
    
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

  // Get quality indicator color
  const getQualityColor = (): string => {
    const { latency, jitter, packetsLost, packetsReceived } = diagnostics;
    const lossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
    
    if (latency > 300 || jitter > 50 || lossRate > 5) return "text-destructive";
    if (latency > 150 || jitter > 30 || lossRate > 2) return "text-yellow-500";
    return "text-green-500";
  };

  const getQualityLabel = (): string => {
    const { latency, jitter, packetsLost, packetsReceived } = diagnostics;
    const lossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
    
    if (latency > 300 || jitter > 50 || lossRate > 5) return "Poor";
    if (latency > 150 || jitter > 30 || lossRate > 2) return "Fair";
    return "Good";
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
          
          {status === "connected" && (
            <div className="flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${getQualityColor()}`} />
              <span className={`text-sm ${getQualityColor()}`}>{getQualityLabel()}</span>
            </div>
          )}
          
          {isAISpeaking && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4 animate-pulse text-primary" />
              <span>AI is speaking...</span>
            </div>
          )}
        </div>

        {/* Audio Level Indicators (shown when connected) */}
        {status === "connected" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mic className="h-3 w-3" />
                <span>Your Voice</span>
                {isMuted && <span className="text-destructive">(Muted)</span>}
              </div>
              <Progress 
                value={isMuted ? 0 : diagnostics.inputLevel} 
                className="h-2"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="h-3 w-3" />
                <span>AI Voice</span>
              </div>
              <Progress 
                value={diagnostics.outputLevel} 
                className="h-2"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Diagnostics Panel */}
        {status === "connected" && (
          <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Audio Diagnostics</span>
                </div>
                {showDiagnostics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 p-3 bg-muted/30 rounded-lg text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Latency</p>
                  <p className={`font-mono ${diagnostics.latency > 200 ? 'text-destructive' : diagnostics.latency > 100 ? 'text-yellow-500' : 'text-foreground'}`}>
                    {diagnostics.latency}ms
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Jitter</p>
                  <p className={`font-mono ${diagnostics.jitter > 30 ? 'text-destructive' : diagnostics.jitter > 15 ? 'text-yellow-500' : 'text-foreground'}`}>
                    {diagnostics.jitter}ms
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Packet Loss</p>
                  <p className={`font-mono ${diagnostics.packetsLost > 0 ? 'text-yellow-500' : 'text-foreground'}`}>
                    {diagnostics.packetsLost}/{diagnostics.packetsReceived}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Bitrate</p>
                  <p className="font-mono">{diagnostics.bitrate} kbps</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Codec</p>
                  <p className="font-mono">{diagnostics.audioCodec}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Connection</p>
                  <p className={`font-mono ${diagnostics.connectionState === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {diagnostics.connectionState}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">ICE State</p>
                  <p className={`font-mono ${diagnostics.iceState === 'connected' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {diagnostics.iceState}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Input Level</p>
                  <p className="font-mono">{Math.round(diagnostics.inputLevel)}%</p>
                </div>
              </div>
              
              {/* Troubleshooting tips */}
              {(diagnostics.inputLevel < 5 && !isMuted) && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
                  <strong>Low input:</strong> Check your microphone is working and not blocked by other apps.
                </div>
              )}
              {diagnostics.latency > 200 && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
                  <strong>High latency:</strong> Your network connection may be slow. Try a wired connection.
                </div>
              )}
              {diagnostics.jitter > 30 && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
                  <strong>High jitter:</strong> Network instability detected. This may cause audio quality issues.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
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
