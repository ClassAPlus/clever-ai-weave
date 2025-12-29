import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2, 
  Copy, 
  Check, 
  ExternalLink,
  Zap,
  AlertCircle,
  Settings2,
  Play,
  Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Top ElevenLabs voices
const ELEVENLABS_VOICES = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Male, Warm & Professional" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Female, Friendly & Clear" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Female, Soft & Calm" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Male, Casual & Friendly" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Male, British Accent" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Male, Narrative" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Non-binary, Calm" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Male, Articulate" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Female, British Accent" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Female, Warm & Friendly" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Male, Friendly" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Female, Expressive" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Male, Friendly American" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", description: "Male, Casual" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Male, Deep & Narration" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Male, British Authoritative" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Female, British Narration" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", description: "Male, Documentary" },
];

interface ElevenLabsAgentSettingsProps {
  businessId: string;
  businessName: string;
  twilioSettings: {
    elevenLabsAgentId?: string;
    useElevenLabsAgent?: boolean;
    elevenLabsVoiceId?: string;
    [key: string]: any;
  } | null;
  onSettingsChange: (settings: any) => void;
  isEditing: boolean;
}

export function ElevenLabsAgentSettings({ 
  businessId, 
  businessName,
  twilioSettings,
  onSettingsChange,
  isEditing
}: ElevenLabsAgentSettingsProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const agentId = twilioSettings?.elevenLabsAgentId || "";
  const useElevenLabsAgent = twilioSettings?.useElevenLabsAgent ?? false;
  const selectedVoiceId = twilioSettings?.elevenLabsVoiceId || "";
  
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-webhook`;

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setTranscript(prev => [...prev, "📞 Connected - Start speaking..."]);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setTranscript(prev => [...prev, "📞 Call ended"]);
      setIsConnecting(false);
    },
    onMessage: (message: any) => {
      console.log("ElevenLabs message:", message);
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) {
          setTranscript(prev => [...prev, `🎤 You: ${text}`]);
        }
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) {
          setTranscript(prev => [...prev, `🤖 AI: ${text}`]);
        }
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice agent. Please check your Agent ID.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  const startTestCall = useCallback(async () => {
    if (!agentId) {
      toast({
        title: "Agent ID Required",
        description: "Please enter your ElevenLabs Agent ID first.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with WebRTC
      await conversation.startSession({
        agentId: agentId,
        connectionType: "webrtc",
        dynamicVariables: {
          business_id: businessId,
          caller_phone: "+1234567890", // Test phone
        },
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start test call",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  }, [agentId, businessId, conversation, toast]);

  const endTestCall = useCallback(async () => {
    await conversation.endSession();
    setIsConnecting(false);
  }, [conversation]);

  const toggleMute = useCallback(() => {
    // Toggle local audio - ElevenLabs SDK handles this internally
    setIsMuted(prev => !prev);
  }, []);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleAgentIdChange = (value: string) => {
    onSettingsChange({
      ...twilioSettings,
      elevenLabsAgentId: value,
    });
  };

  const handleToggleAgent = (enabled: boolean) => {
    onSettingsChange({
      ...twilioSettings,
      useElevenLabsAgent: enabled,
    });
  };

  const handleVoiceChange = (voiceId: string) => {
    onSettingsChange({
      ...twilioSettings,
      elevenLabsVoiceId: voiceId,
    });
  };

  const previewVoice = async (voiceId: string) => {
    // Stop current preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (previewingVoiceId === voiceId && isPreviewPlaying) {
      setIsPreviewPlaying(false);
      setPreviewingVoiceId(null);
      return;
    }

    setIsPreviewPlaying(true);
    setPreviewingVoiceId(voiceId);

    try {
      // Use ElevenLabs preview samples (these are publicly available)
      const previewUrl = `https://api.elevenlabs.io/v1/voices/${voiceId}/preview`;
      
      // Alternatively, use a simple fetch to get voice samples
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: "GET",
      });
      
      if (response.ok) {
        const voiceData = await response.json();
        const previewAudioUrl = voiceData.preview_url;
        
        if (previewAudioUrl) {
          const audio = new Audio(previewAudioUrl);
          audioRef.current = audio;
          
          audio.onended = () => {
            setIsPreviewPlaying(false);
            setPreviewingVoiceId(null);
          };
          
          audio.onerror = () => {
            toast({
              title: "Preview unavailable",
              description: "Could not load voice preview.",
              variant: "destructive",
            });
            setIsPreviewPlaying(false);
            setPreviewingVoiceId(null);
          };
          
          await audio.play();
        } else {
          throw new Error("No preview available");
        }
      } else {
        throw new Error("Failed to fetch voice data");
      }
    } catch (error) {
      console.error("Voice preview error:", error);
      toast({
        title: "Preview unavailable",
        description: "Could not load voice preview. The voice will still work in your agent.",
      });
      setIsPreviewPlaying(false);
      setPreviewingVoiceId(null);
    }
  };

  const isConnected = conversation.status === "connected";

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          ElevenLabs Conversational AI
          <Badge variant="outline" className="ml-2 text-xs border-yellow-500/50 text-yellow-400">
            New
          </Badge>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect your ElevenLabs Conversational AI agent for ultra-low latency voice interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div>
            <Label className="text-gray-300">Use ElevenLabs Agent</Label>
            <p className="text-xs text-gray-500 mt-1">
              Replace the current voice system with ElevenLabs Conversational AI
            </p>
          </div>
          <Switch 
            checked={useElevenLabsAgent} 
            onCheckedChange={handleToggleAgent}
            disabled={!isEditing}
          />
        </div>

        {/* Agent ID Input */}
        <div className="space-y-2">
          <Label className="text-gray-300">Agent ID</Label>
          <Input
            value={agentId}
            onChange={(e) => handleAgentIdChange(e.target.value)}
            placeholder="Enter your ElevenLabs Agent ID..."
            disabled={!isEditing}
            className="bg-gray-700 border-gray-600 text-white font-mono"
          />
          <p className="text-xs text-gray-500">
            Get your Agent ID from the{" "}
            <a 
              href="https://elevenlabs.io/app/conversational-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              ElevenLabs Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <Label className="text-gray-300">Agent Voice</Label>
          <div className="flex gap-2">
            <Select
              value={selectedVoiceId}
              onValueChange={handleVoiceChange}
              disabled={!isEditing}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white flex-1">
                <SelectValue placeholder="Select a voice for your agent..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
                {ELEVENLABS_VOICES.map((voice) => (
                  <SelectItem 
                    key={voice.id} 
                    value={voice.id}
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-gray-400">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoiceId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => previewVoice(selectedVoiceId)}
                disabled={!selectedVoiceId}
                className="border-gray-600 hover:bg-gray-700"
                title="Preview voice"
              >
                {isPreviewPlaying && previewingVoiceId === selectedVoiceId ? (
                  <Square className="h-4 w-4 text-red-400" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Select a voice for your AI agent. Configure this voice in your ElevenLabs agent settings.
            <a 
              href="https://elevenlabs.io/voice-library" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline inline-flex items-center gap-1 ml-1"
            >
              Browse more voices
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              readOnly
              className="bg-gray-900 border-gray-600 text-gray-400 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyWebhookUrl}
              className="border-gray-600 hover:bg-gray-700"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Configure this URL as the webhook endpoint in your ElevenLabs agent tools
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Settings2 className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="text-blue-300 font-medium">Setup Instructions</p>
              <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                <li>Create an agent in the ElevenLabs dashboard</li>
                <li>Copy your Agent ID and paste it above</li>
                <li>Add tools using the webhook URL above</li>
                <li>Configure dynamic variables: <code className="text-purple-300">business_id</code> and <code className="text-purple-300">caller_phone</code></li>
                <li>Connect your Twilio number in ElevenLabs</li>
              </ol>
              <a 
                href="/docs/ELEVENLABS_AGENT_SETUP.md" 
                target="_blank"
                className="text-purple-400 hover:underline inline-flex items-center gap-1 mt-2"
              >
                View detailed setup guide
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Test Call Section */}
        {agentId && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <Label className="text-gray-300">Test Your Agent</Label>
            
            {/* Call Controls */}
            <div className="flex items-center gap-3">
              {!isConnected ? (
                <Button
                  onClick={startTestCall}
                  disabled={isConnecting || !agentId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  {isConnecting ? "Connecting..." : "Start Test Call"}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={endTestCall}
                    variant="destructive"
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="icon"
                    className={isMuted ? "bg-red-500/20 border-red-500/50" : "border-gray-600"}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </>
              )}
              
              {/* Status Badge */}
              <Badge 
                variant={
                  isConnected ? "default" : 
                  isConnecting ? "secondary" : 
                  "outline"
                }
              >
                {isConnected && "In Call"}
                {isConnecting && "Connecting..."}
                {!isConnected && !isConnecting && "Ready"}
              </Badge>
              
              {/* Speaking Indicator */}
              {isConnected && conversation.isSpeaking && (
                <div className="flex items-center gap-2 text-purple-400">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI Speaking...</span>
                </div>
              )}
            </div>

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 max-h-60 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {transcript.map((line, i) => (
                    <p key={i} className="text-gray-300">{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Microphone Permission Note */}
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>
                Your browser will ask for microphone permission when you start a test call. 
                The test uses your browser's microphone to simulate a real phone call.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
