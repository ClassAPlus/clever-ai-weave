import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Phone, MessageSquare, Volume2, Loader2, Square, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwilioSettings {
  voiceLanguage: string;
  voiceGender: string;
  voiceId: string;
  ringTimeout: number;
  dailyMessageLimit: number;
  rateLimitWindow: number;
}

interface TwilioAdvancedSettingsProps {
  settings: TwilioSettings;
  onChange: (settings: TwilioSettings) => void;
}

// ElevenLabs voices with human-like quality
const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", description: "Warm & professional" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", description: "Friendly & clear" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", description: "Calm & reassuring" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", description: "Soft & gentle" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "female", description: "Energetic & engaging" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "female", description: "British & articulate" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male", description: "Warm & authoritative" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male", description: "Friendly & natural" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", description: "Casual & approachable" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", gender: "male", description: "Professional & clear" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "male", description: "Deep & confident" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill", gender: "male", description: "Mature & trustworthy" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", gender: "male", description: "Young & dynamic" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "male", description: "Narrative & expressive" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", gender: "male", description: "British & distinguished" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", gender: "male", description: "Scottish & warm" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", gender: "neutral", description: "Smooth & versatile" },
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

export function TwilioAdvancedSettings({ settings, onChange }: TwilioAdvancedSettingsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customText, setCustomText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateSetting = <K extends keyof TwilioSettings>(key: K, value: TwilioSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playVoicePreview = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }

    const langConfig = VOICE_LANGUAGES.find(l => l.value === settings.voiceLanguage);
    const textToSpeak = customText.trim() || langConfig?.sampleText || "Hello, how can I help you today?";
    const voiceId = settings.voiceId || "EXAVITQu4vr4xnSDxMaL";

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: textToSpeak, voiceId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate voice preview");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      setIsSpeaking(true);
      await audioRef.current.play();
    } catch (error) {
      console.error("Voice preview error:", error);
      toast({
        variant: "destructive",
        title: "Voice preview failed",
        description: "Could not generate voice preview. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLang = VOICE_LANGUAGES.find(l => l.value === settings.voiceLanguage);
  const selectedVoice = ELEVENLABS_VOICES.find(v => v.id === settings.voiceId);
  const filteredVoices = settings.voiceGender === "male" 
    ? ELEVENLABS_VOICES.filter(v => v.gender === "male")
    : settings.voiceGender === "female"
    ? ELEVENLABS_VOICES.filter(v => v.gender === "female")
    : ELEVENLABS_VOICES;

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
        {/* Voice Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
            <Phone className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-white">Voice Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Voice Language</Label>
              <Select
                value={settings.voiceLanguage}
                onValueChange={(value) => updateSetting("voiceLanguage", value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Voice Gender</Label>
              <Select
                value={settings.voiceGender}
                onValueChange={(value) => {
                  updateSetting("voiceGender", value);
                  // Auto-select first voice of the new gender
                  const firstVoice = ELEVENLABS_VOICES.find(v => v.gender === value);
                  if (firstVoice) {
                    updateSetting("voiceId", firstVoice.id);
                  }
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

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              AI Voice Character
            </Label>
            <Select
              value={settings.voiceId || "EXAVITQu4vr4xnSDxMaL"}
              onValueChange={(value) => updateSetting("voiceId", value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue>
                  {selectedVoice ? (
                    <span className="flex items-center gap-2">
                      {selectedVoice.name} - <span className="text-gray-400 text-sm">{selectedVoice.description}</span>
                    </span>
                  ) : (
                    "Select a voice"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {filteredVoices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-gray-400">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Premium human-like voices powered by ElevenLabs
            </p>
          </div>

          {/* Voice Preview Section */}
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Voice Preview</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={playVoicePreview}
                disabled={isLoading}
                className={`border-purple-500/50 hover:bg-purple-500/10 ${
                  isSpeaking ? "text-red-400 border-red-500/50" : "text-purple-400"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : isSpeaking ? (
                  <>
                    <Square className="h-4 w-4 mr-2 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Play Preview
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
              onValueChange={([value]) => updateSetting("ringTimeout", value)}
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
              onValueChange={([value]) => updateSetting("dailyMessageLimit", value)}
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
              onValueChange={([value]) => updateSetting("rateLimitWindow", value)}
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

        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <p className="text-sm text-green-300">
            ✨ <strong>Premium Voices:</strong> Using ElevenLabs AI for natural, human-like speech. Preview the selected voice above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
