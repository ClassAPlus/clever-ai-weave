import { useState, useRef, useEffect, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Volume2, Loader2, Square, User, Bot, Play, RefreshCw, PhoneOff, Mic, MicOff, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwilioSettings {
  voiceLanguage: string;
  voiceGender: string;
  voiceId: string;
  googleVoiceName?: string;
  elevenLabsVoiceId?: string;
  elevenLabsVoiceGender?: 'male' | 'female'; // Auto-derived from selected voice
  elevenLabsAgentId?: string;
  useElevenLabsAgent?: boolean;
  ringTimeout: number;
  dailyMessageLimit: number;
  rateLimitWindow: number;
  enableAiReceptionist?: boolean;
  timeFormat?: '12h' | '24h'; // AM/PM vs 24-hour format
}

interface TwilioAdvancedSettingsProps {
  settings: TwilioSettings;
  onChange: (settings: TwilioSettings) => void;
  primaryLanguage?: string; // From AI Configuration - auto-syncs voice language
  businessId?: string; // For test calls
}

// Map AI language names to voice language codes (for display purposes)
const AI_LANGUAGE_TO_VOICE_CODE: Record<string, string> = {
  hebrew: 'he-IL',
  english: 'en-US',
  arabic: 'ar-XA',
  russian: 'ru-RU',
  spanish: 'es-ES',
  french: 'fr-FR',
  german: 'de-DE',
  portuguese: 'pt-BR',
  italian: 'it-IT',
  dutch: 'nl-NL',
  polish: 'pl-PL',
  turkish: 'tr-TR',
  chinese: 'zh-CN',
  japanese: 'ja-JP',
  korean: 'ko-KR',
  hindi: 'hi-IN',
  thai: 'th-TH',
  vietnamese: 'vi-VN',
};

// ElevenLabs voices - multilingual_v2 supports all languages including Hebrew
// Voices marked as "Multilingual" are specifically optimized for non-English languages
const ELEVENLABS_VOICES = [
  // Female voices - Best for Hebrew marked first
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', gender: 'female', description: '⭐ Best for Hebrew - Professional, clear', accent: 'Multilingual' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'female', description: 'Warm, natural, conversational', accent: 'Multilingual' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', gender: 'female', description: 'Friendly, clear', accent: 'Multilingual' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: 'female', description: 'Soft, gentle', accent: 'British' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', gender: 'female', description: 'Young, bright', accent: 'British' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', gender: 'female', description: 'Calm, professional', accent: 'Multilingual' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', gender: 'female', description: 'Confident, articulate', accent: 'American' },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', gender: 'female', description: 'Nordic, elegant', accent: 'Scandinavian' },
  { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', gender: 'female', description: 'Southern charm', accent: 'American' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', description: 'Swedish, melodic', accent: 'Swedish' },
  { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Serena', gender: 'female', description: 'Soothing, calm', accent: 'American' },
  { id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', gender: 'female', description: 'Warm, motherly', accent: 'American' },
  // Male voices - Best for Hebrew marked first
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', description: '⭐ Best for Hebrew - Clear, professional', accent: 'Multilingual' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', gender: 'male', description: 'Friendly, warm', accent: 'Multilingual' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', gender: 'male', description: 'British, refined', accent: 'British' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'male', description: 'Casual, approachable', accent: 'Australian' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', gender: 'male', description: 'Deep, authoritative', accent: 'American' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', gender: 'male', description: 'Warm, trustworthy', accent: 'Multilingual' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'male', description: 'Scottish accent', accent: 'Scottish' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Will', gender: 'male', description: 'Young, energetic', accent: 'American' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', gender: 'male', description: 'Mature, authoritative', accent: 'American' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', gender: 'male', description: 'Casual, friendly', accent: 'American' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', gender: 'male', description: 'Narrator style', accent: 'American' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', description: 'Raspy, character', accent: 'American' },
  { id: 'ZQe5CZNOzWyzPSCn5a3c', name: 'James', gender: 'male', description: 'British gentleman', accent: 'British' },
  { id: 'ODq5zmih8GrVes37Dizd', name: 'Patrick', gender: 'male', description: 'Irish charm', accent: 'Irish' },
  { id: 'g5CIjZEefAph4nQFvHAz', name: 'Ethan', gender: 'male', description: 'News anchor', accent: 'American' },
];

const VOICE_LANGUAGES = [
  { value: "he-IL", label: "Hebrew (Israel)", sampleText: "שלום! ברוכים הבאים. איך אוכל לעזור לך היום?" },
  { value: "en-US", label: "English (US)", sampleText: "Hello! Welcome. How can I help you today?" },
  { value: "en-GB", label: "English (UK)", sampleText: "Hello! Welcome. How may I assist you today?" },
  { value: "ar-XA", label: "Arabic", sampleText: "مرحباً! أهلاً بك. كيف يمكنني مساعدتك اليوم؟" },
  { value: "ru-RU", label: "Russian", sampleText: "Здравствуйте! Добро пожаловать. Чем могу помочь?" },
  { value: "es-ES", label: "Spanish", sampleText: "¡Hola! Bienvenido. ¿Cómo puedo ayudarte hoy?" },
  { value: "fr-FR", label: "French", sampleText: "Bonjour! Bienvenue. Comment puis-je vous aider?" },
  { value: "de-DE", label: "German", sampleText: "Hallo! Willkommen. Wie kann ich Ihnen helfen?" },
  { value: "pt-BR", label: "Portuguese (Brazil)", sampleText: "Olá! Bem-vindo. Como posso ajudá-lo hoje?" },
  { value: "pt-PT", label: "Portuguese (Portugal)", sampleText: "Olá! Bem-vindo. Como posso ajudá-lo hoje?" },
  { value: "zh-CN", label: "Chinese (Mandarin)", sampleText: "您好！欢迎光临。今天我能为您做些什么？" },
  { value: "ja-JP", label: "Japanese", sampleText: "こんにちは！ようこそ。本日はどのようなご用件でしょうか？" },
  { value: "ko-KR", label: "Korean", sampleText: "안녕하세요! 환영합니다. 무엇을 도와드릴까요?" },
  { value: "it-IT", label: "Italian", sampleText: "Ciao! Benvenuto. Come posso aiutarti oggi?" },
  { value: "nl-NL", label: "Dutch", sampleText: "Hallo! Welkom. Hoe kan ik u helpen?" },
  { value: "pl-PL", label: "Polish", sampleText: "Cześć! Witamy. Jak mogę pomóc?" },
  { value: "tr-TR", label: "Turkish", sampleText: "Merhaba! Hoş geldiniz. Size nasıl yardımcı olabilirim?" },
  { value: "hi-IN", label: "Hindi", sampleText: "नमस्ते! स्वागत है। आज मैं आपकी कैसे मदद कर सकता हूं?" },
  { value: "th-TH", label: "Thai", sampleText: "สวัสดีครับ! ยินดีต้อนรับ วันนี้ให้ช่วยอะไรได้บ้างครับ?" },
  { value: "vi-VN", label: "Vietnamese", sampleText: "Xin chào! Chào mừng. Tôi có thể giúp gì cho bạn?" },
];

export function TwilioAdvancedSettings({ settings, onChange, primaryLanguage, businessId }: TwilioAdvancedSettingsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'female' | 'male'>('all');

  const [accountVoices, setAccountVoices] = useState<Array<{ voice_id: string; name: string; category?: string; labels?: { gender?: string } }>>([]);
  const [accountVoicesLoading, setAccountVoicesLoading] = useState(false);
  const [accountVoicesError, setAccountVoicesError] = useState<string | null>(null);
  const [selectedAccountVoiceId, setSelectedAccountVoiceId] = useState<string>("");

  // ElevenLabs test call state
  const [isTestCallConnecting, setIsTestCallConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-webhook`;

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setTranscript(prev => [...prev, "📞 Connected - Start speaking..."]);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setTranscript(prev => [...prev, "📞 Call ended"]);
      setIsTestCallConnecting(false);
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
        description: "Failed to connect to voice agent. Check your Agent ID.",
        variant: "destructive",
      });
      setIsTestCallConnecting(false);
    },
  });

  const startTestCall = useCallback(async () => {
    if (!settings.elevenLabsAgentId) {
      toast({
        title: "Agent ID Required",
        description: "Please enter your ElevenLabs Agent ID first.",
        variant: "destructive",
      });
      return;
    }

    setIsTestCallConnecting(true);
    setTranscript([]);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: settings.elevenLabsAgentId,
        connectionType: "webrtc",
        dynamicVariables: {
          business_id: businessId || "",
          caller_phone: "+1234567890",
        },
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start test call",
        variant: "destructive",
      });
      setIsTestCallConnecting(false);
    }
  }, [settings.elevenLabsAgentId, businessId, conversation, toast]);

  const endTestCall = useCallback(async () => {
    await conversation.endSession();
    setIsTestCallConnecting(false);
  }, [conversation]);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  const isTestCallConnected = conversation.status === "connected";

  // Auto-sync voice language from primary AI language (for display)
  const effectiveVoiceLanguage = primaryLanguage 
    ? (AI_LANGUAGE_TO_VOICE_CODE[primaryLanguage] || 'en-US')
    : settings.voiceLanguage;

  const updateSettings = (patch: Partial<TwilioSettings>) => {
    onChange({ ...settings, ...patch });
  };

  // Auto-update voice language when primary language changes
  useEffect(() => {
    if (!primaryLanguage) return;
    
    const newVoiceLanguage = AI_LANGUAGE_TO_VOICE_CODE[primaryLanguage] || 'en-US';
    const currentVoiceLanguage = settings.voiceLanguage;
    
    if (newVoiceLanguage !== currentVoiceLanguage) {
      onChange({
        ...settings,
        voiceLanguage: newVoiceLanguage,
      });
    }
  }, [primaryLanguage]);

  // Set default ElevenLabs voice if not set, and ensure gender is stored
  useEffect(() => {
    if (!settings.elevenLabsVoiceId) {
      const defaultVoice = settings.voiceGender === 'male' 
        ? 'onwK4e9ZLuTAKqWW03F9' // Daniel
        : 'cgSgspJ2msm6clMCkdW9'; // Jessica (best multilingual)
      const defaultGender = settings.voiceGender === 'male' ? 'male' : 'female';
      updateSettings({ elevenLabsVoiceId: defaultVoice, elevenLabsVoiceGender: defaultGender as 'male' | 'female' });
    }
  }, []);

  // Helper function to get gender from voice ID (from hardcoded list or account voices)
  const getVoiceGender = (voiceId: string): 'male' | 'female' => {
    // Check hardcoded voices first
    const hardcodedVoice = ELEVENLABS_VOICES.find(v => v.id === voiceId);
    if (hardcodedVoice) {
      return hardcodedVoice.gender as 'male' | 'female';
    }
    // Check account voices (from ElevenLabs API)
    const accountVoice = accountVoices.find(v => v.voice_id === voiceId);
    if (accountVoice?.labels?.gender) {
      return accountVoice.labels.gender === 'male' ? 'male' : 'female';
    }
    // Default to female if unknown
    return 'female';
  };

  const fetchAccountVoices = async () => {
    try {
      setAccountVoicesLoading(true);
      setAccountVoicesError(null);

      const { data, error } = await supabase.functions.invoke("elevenlabs-voices");
      if (error) throw error;

      const voices = (data?.voices as Array<{ voice_id: string; name: string; category?: string; labels?: { gender?: string } }>) || [];
      setAccountVoices(voices);
      setSelectedAccountVoiceId((prev) => prev || voices?.[0]?.voice_id || "");
    } catch (e) {
      console.error("Failed to load ElevenLabs voices:", e);
      setAccountVoicesError(e instanceof Error ? e.message : "Failed to load voices");
    } finally {
      setAccountVoicesLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccountVoices();
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setPreviewingVoiceId(null);
  };

  const playVoicePreview = async (voiceId?: string) => {
    const targetVoiceId = voiceId || settings.elevenLabsVoiceId || 'EXAVITQu4vr4xnSDxMaL';
    
    if (isSpeaking && previewingVoiceId === targetVoiceId) {
      stopAudio();
      return;
    }

    // Stop any current audio first
    stopAudio();

    const langConfig = VOICE_LANGUAGES.find(l => l.value === effectiveVoiceLanguage);
    const textToSpeak = customText.trim() || langConfig?.sampleText || "Hello, how can I help you today?";

    setIsLoading(true);
    setPreviewingVoiceId(targetVoiceId);

    try {
      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            text: textToSpeak, 
            languageCode: effectiveVoiceLanguage,
            gender: settings.voiceGender,
            voiceId: targetVoiceId
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate voice preview");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        setPreviewingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setPreviewingVoiceId(null);
        URL.revokeObjectURL(audioUrl);
      };

      setIsSpeaking(true);
      await audioRef.current.play();
    } catch (error) {
      console.error("Voice preview error:", error);
      toast({
        variant: "destructive",
        title: "Voice preview failed",
        description: error instanceof Error ? error.message : "Could not generate voice preview. Please try again.",
      });
      setPreviewingVoiceId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentLang = VOICE_LANGUAGES.find(l => l.value === effectiveVoiceLanguage);
  
  // Filter and sort voices
  const filteredVoices = ELEVENLABS_VOICES.filter(v => 
    voiceFilter === 'all' || v.gender === voiceFilter
  );
  
  const sortedVoices = [...filteredVoices].sort((a, b) => {
    // Preferred gender first
    if (a.gender === settings.voiceGender && b.gender !== settings.voiceGender) return -1;
    if (b.gender === settings.voiceGender && a.gender !== settings.voiceGender) return 1;
    return a.name.localeCompare(b.name);
  });
  
  const selectedVoice = ELEVENLABS_VOICES.find(v => v.id === settings.elevenLabsVoiceId);
  const isUsingCustomVoice = useCustomVoice || (settings.elevenLabsVoiceId && !ELEVENLABS_VOICES.find(v => v.id === settings.elevenLabsVoiceId));

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Phone className="h-5 w-5 text-purple-400" />
          Advanced Twilio Settings
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure voice and SMS behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Receptionist Toggle */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-purple-400" />
              <div>
                <Label className="text-white font-medium">AI Receptionist</Label>
                <p className="text-xs text-gray-400">Let AI answer calls when you're unavailable</p>
              </div>
            </div>
            <Switch
              checked={settings.enableAiReceptionist !== false}
              onCheckedChange={(checked) => updateSettings({ enableAiReceptionist: checked })}
            />
          </div>
          {settings.enableAiReceptionist !== false && (
            <p className="text-xs text-purple-300">
              🎙️ When enabled, callers will have a real-time voice conversation with your AI assistant powered by OpenAI Realtime API.
            </p>
          )}
        </div>

        {/* Time Format Toggle */}
        <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-blue-400" />
              <div>
                <Label className="text-white font-medium">Time Format</Label>
                <p className="text-xs text-gray-400">How times are spoken and displayed in SMS</p>
              </div>
            </div>
            <div className="flex gap-2 bg-gray-700/50 rounded-lg p-1">
              <button
                onClick={() => updateSettings({ timeFormat: '12h' })}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  (settings.timeFormat || '12h') === '12h'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                AM/PM
              </button>
              <button
                onClick={() => updateSettings({ timeFormat: '24h' })}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  settings.timeFormat === '24h'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                24-hour
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {settings.timeFormat === '24h' 
              ? '📞 AI will say "14:00" instead of "2 PM"' 
              : '📞 AI will say "2 PM" instead of "14:00"'}
          </p>
        </div>


        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
            <Phone className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-white">Voice Settings</span>
            <span className="text-xs text-emerald-400 ml-auto">Powered by ElevenLabs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Voice Language</Label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-700/50 border border-gray-600 rounded-md">
                <span className="text-white">{currentLang?.label || effectiveVoiceLanguage}</span>
                <span className="text-xs text-purple-400 ml-auto">Synced from AI Config</span>
              </div>
              <p className="text-xs text-gray-500">
                ElevenLabs automatically speaks in the detected language
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Voice Gender</Label>
              <Select
                value={settings.voiceGender}
                onValueChange={(value) => {
                  // Auto-select first voice of the new gender and store gender
                  const firstVoice = ELEVENLABS_VOICES.find((v) => v.gender === value);
                  updateSettings({
                    voiceGender: value,
                    elevenLabsVoiceId: firstVoice?.id || 'EXAVITQu4vr4xnSDxMaL',
                    elevenLabsVoiceGender: value as 'male' | 'female',
                  });
                }}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voice Selection with Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4" />
                AI Voice Character
              </Label>
              
              {/* Filter tabs */}
              <div className="flex gap-1 bg-gray-700/50 rounded-lg p-1">
                {(['all', 'female', 'male'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setVoiceFilter(filter)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      voiceFilter === filter 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Voice Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-300">🎤 Use Custom/Cloned Voice</span>
              </div>
              <Switch
                checked={useCustomVoice}
                onCheckedChange={(checked) => {
                  setUseCustomVoice(checked);
                  if (!checked && customVoiceId) {
                    // Reset to a default voice when disabling custom
                    updateSettings({ elevenLabsVoiceId: 'cgSgspJ2msm6clMCkdW9' });
                  }
                }}
              />
            </div>

            {/* Account voices (includes cloned voices) */}
            <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-white">Your ElevenLabs voices</p>
                  <p className="text-xs text-gray-400">
                    Includes cloned voices. For the best Hebrew, pick a Hebrew-trained voice from your account.
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAccountVoices}
                  disabled={accountVoicesLoading}
                  className="text-purple-400 hover:text-purple-300"
                >
                  {accountVoicesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {accountVoicesError && (
                <p className="text-xs text-red-400">{accountVoicesError}</p>
              )}

              {accountVoices.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedAccountVoiceId} onValueChange={setSelectedAccountVoiceId}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select one of your voices" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountVoices.map((v) => (
                        <SelectItem key={v.voice_id} value={v.voice_id}>
                          {v.name}{v.category ? ` (${v.category})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!selectedAccountVoiceId) return;
                        setUseCustomVoice(false);
                        const detectedGender = getVoiceGender(selectedAccountVoiceId);
                        updateSettings({ 
                          elevenLabsVoiceId: selectedAccountVoiceId,
                          elevenLabsVoiceGender: detectedGender,
                          voiceGender: detectedGender,
                        });
                        toast({ title: "Voice selected", description: `Saved your ElevenLabs voice (${detectedGender}) for calls.` });
                      }}
                      disabled={!selectedAccountVoiceId}
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      Use
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playVoicePreview(selectedAccountVoiceId)}
                      disabled={isLoading || !selectedAccountVoiceId}
                      className="text-purple-400 hover:text-purple-300"
                      aria-label="Preview selected account voice"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  No voices found in your ElevenLabs account yet. Create/clone a Hebrew voice in ElevenLabs, then refresh.
                </p>
              )}
            </div>
            
            {useCustomVoice ? (
              /* Custom Voice ID Input */
              <div className="p-4 rounded-lg bg-gray-900/50 border border-amber-500/30 space-y-3">
                <Label className="text-amber-300">Custom Voice ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={customVoiceId || settings.elevenLabsVoiceId || ''}
                    onChange={(e) => setCustomVoiceId(e.target.value)}
                    placeholder="Enter your ElevenLabs voice ID..."
                    className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (customVoiceId) {
                        // For custom voices, try to detect gender, default to current voiceGender
                        const detectedGender = getVoiceGender(customVoiceId);
                        updateSettings({ 
                          elevenLabsVoiceId: customVoiceId,
                          elevenLabsVoiceGender: detectedGender,
                        });
                        toast({ title: "Custom voice saved", description: `Voice ID set (gender: ${detectedGender}).` });
                      }
                    }}
                    disabled={!customVoiceId}
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playVoicePreview(customVoiceId || settings.elevenLabsVoiceId)}
                    disabled={isLoading || (!customVoiceId && !settings.elevenLabsVoiceId)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Find your voice ID in ElevenLabs → Voices → Click on voice → Copy Voice ID
                </p>
                <a 
                  href="https://elevenlabs.io/voice-library" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  Browse ElevenLabs Voice Library →
                </a>
              </div>
            ) : (
              /* Voice Grid */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                  {sortedVoices.map((voice) => {
                    const isSelected = settings.elevenLabsVoiceId === voice.id && !isUsingCustomVoice;
                    const isPreviewing = previewingVoiceId === voice.id && isSpeaking;
                    const isLoadingThis = previewingVoiceId === voice.id && isLoading;
                    
                    return (
                      <div
                        key={voice.id}
                        className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-500/20 border-purple-500' 
                            : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          setUseCustomVoice(false);
                          updateSettings({ 
                            elevenLabsVoiceId: voice.id,
                            elevenLabsVoiceGender: voice.gender as 'male' | 'female',
                            voiceGender: voice.gender,
                          });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                                {voice.name}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                voice.gender === 'female' 
                                  ? 'bg-pink-500/20 text-pink-300' 
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {voice.gender}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{voice.description}</p>
                            <p className="text-[10px] text-gray-500">{voice.accent}</p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`ml-1 h-7 w-7 p-0 ${
                              isPreviewing ? 'text-red-400 hover:text-red-300' : 'text-purple-400 hover:text-purple-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              playVoicePreview(voice.id);
                            }}
                            disabled={isLoadingThis}
                          >
                            {isLoadingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isPreviewing ? (
                              <Square className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <div className="h-2 w-2 rounded-full bg-purple-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-xs text-gray-500">
                  {sortedVoices.length} voices available • Click to select, press play to preview
                </p>
              </>
            )}
          </div>

          {/* Custom Text Preview */}
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Custom Preview</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => playVoicePreview()}
                disabled={isLoading}
                className={`border-purple-500/50 hover:bg-purple-500/10 ${
                  isSpeaking && previewingVoiceId === settings.elevenLabsVoiceId 
                    ? "text-red-400 border-red-500/50" 
                    : "text-purple-400"
                }`}
              >
                {isLoading && previewingVoiceId === settings.elevenLabsVoiceId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : isSpeaking && previewingVoiceId === settings.elevenLabsVoiceId ? (
                  <>
                    <Square className="h-4 w-4 mr-2 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Play Selected Voice
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={currentLang?.sampleText || "Enter custom text to preview..."}
                className="bg-gray-700 border-gray-600 text-white text-sm"
              />
              <p className="text-xs text-gray-500">
                Leave empty to use the default greeting for {currentLang?.label || "the selected language"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Ring Timeout (seconds)</Label>
              <span className="text-sm text-purple-400 font-mono">{settings.ringTimeout}s</span>
            </div>
            <Slider
              value={[settings.ringTimeout]}
              onValueChange={([value]) => updateSettings({ ringTimeout: value })}
              min={10}
              max={60}
              step={5}
              className="py-2"
            />
            <p className="text-xs text-gray-500">
              Time to wait for call forwarding before AI takes over
            </p>
          </div>
        </div>

        {/* SMS Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-white">SMS Settings</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Daily Message Limit (per contact)</Label>
              <span className="text-sm text-purple-400 font-mono">{settings.dailyMessageLimit}</span>
            </div>
            <Slider
              value={[settings.dailyMessageLimit]}
              onValueChange={([value]) => updateSettings({ dailyMessageLimit: value })}
              min={1}
              max={50}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-gray-500">
              Maximum AI-generated messages per contact per day
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Rate Limit Window (minutes)</Label>
              <span className="text-sm text-purple-400 font-mono">{settings.rateLimitWindow}m</span>
            </div>
            <Slider
              value={[settings.rateLimitWindow]}
              onValueChange={([value]) => updateSettings({ rateLimitWindow: value })}
              min={1}
              max={60}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-gray-500">
              Minimum time between consecutive AI responses to same contact
            </p>
          </div>
        </div>

        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
          <p className="text-sm text-emerald-300">
            🎙️ <strong>ElevenLabs:</strong> Ultra-realistic AI voices with natural intonation. Supports 29+ languages including Hebrew and English with the same voice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
