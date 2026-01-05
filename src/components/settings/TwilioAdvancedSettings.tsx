import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Volume2, Loader2, Square, Bot, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TwilioDebuggerHints } from "./TwilioDebuggerHints";
import { WebhookHealthCheck } from "./WebhookHealthCheck";

interface TwilioSettings {
  voiceLanguage: string;
  voiceGender: string;
  voiceId: string;
  googleVoiceName?: string;
  voiceflowProjectId?: string;
  voiceflowVersionId?: string;
  ringTimeout: number;
  dailyMessageLimit: number;
  rateLimitWindow: number;
  enableAiReceptionist?: boolean;
  timeFormat?: '12h' | '24h';
  speechRecognitionLanguage?: string; // Override for Twilio Gather speech recognition
}

interface TwilioAdvancedSettingsProps {
  settings: TwilioSettings;
  onChange: (settings: TwilioSettings) => void;
  primaryLanguage?: string;
  businessId?: string;
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

// Twilio Gather speech recognition only supports these languages
const SPEECH_RECOGNITION_LANGUAGES = [
  { value: "auto", label: "Auto (fallback to English)" },
  { value: "en-us", label: "English (US)" },
  { value: "en-gb", label: "English (UK)" },
  { value: "en-au", label: "English (Australia)" },
  { value: "es-es", label: "Spanish (Spain)" },
  { value: "es-mx", label: "Spanish (Mexico)" },
  { value: "es-us", label: "Spanish (US)" },
  { value: "fr-fr", label: "French (France)" },
  { value: "fr-ca", label: "French (Canada)" },
  { value: "de-de", label: "German" },
  { value: "it-it", label: "Italian" },
  { value: "pt-br", label: "Portuguese (Brazil)" },
  { value: "pt-pt", label: "Portuguese (Portugal)" },
  { value: "ru-ru", label: "Russian" },
  { value: "ja-jp", label: "Japanese" },
  { value: "ko-kr", label: "Korean" },
  { value: "cmn-cn", label: "Chinese (Mandarin)" },
  { value: "nl-nl", label: "Dutch" },
  { value: "pl-pl", label: "Polish" },
  { value: "tr-tr", label: "Turkish" },
  { value: "hi-in", label: "Hindi" },
  { value: "arb", label: "Arabic" },
  { value: "da-dk", label: "Danish" },
  { value: "nb-no", label: "Norwegian" },
  { value: "sv-se", label: "Swedish" },
  { value: "ro-ro", label: "Romanian" },
  { value: "is-is", label: "Icelandic" },
  { value: "cy-gb", label: "Welsh" },
];

export function TwilioAdvancedSettings({ settings, onChange, primaryLanguage, businessId }: TwilioAdvancedSettingsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customText, setCustomText] = useState("");

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

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    stopAudio();

    const langConfig = VOICE_LANGUAGES.find(l => l.value === effectiveVoiceLanguage);
    const textToSpeak = customText.trim() || langConfig?.sampleText || "Hello, how can I help you today?";

    setIsLoading(true);

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
        description: error instanceof Error ? error.message : "Could not generate voice preview. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLang = VOICE_LANGUAGES.find(l => l.value === effectiveVoiceLanguage);

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
        {/* AI Receptionist */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 space-y-4">
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
              onCheckedChange={(checked) => {
                updateSettings({ enableAiReceptionist: checked });
              }}
            />
          </div>
          
          {settings.enableAiReceptionist !== false && (
            <p className="text-xs text-purple-300">
              🎙️ When enabled, callers will have a real-time voice conversation with your AI assistant. The AI will use your business knowledge base and can book appointments, take messages, and answer questions.
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

        {/* Voice Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
            <Phone className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-white">Voice Settings</span>
            <span className="text-xs text-emerald-400 ml-auto">Powered by Voiceflow</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Voice Language</Label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-700/50 border border-gray-600 rounded-md">
                <span className="text-white">{currentLang?.label || effectiveVoiceLanguage}</span>
                <span className="text-xs text-purple-400 ml-auto">Synced from AI Config</span>
              </div>
              <p className="text-xs text-gray-500">
                Voice language is synced from your AI configuration
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Voice Gender</Label>
              <Select
                value={settings.voiceGender}
                onValueChange={(value) => updateSettings({ voiceGender: value })}
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

          {/* Speech Recognition Language Override */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="space-y-2">
              <Label className="text-gray-300">Speech Recognition Language</Label>
              <Select
                value={settings.speechRecognitionLanguage || "auto"}
                onValueChange={(value) => updateSettings({ speechRecognitionLanguage: value === "auto" ? undefined : value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {SPEECH_RECOGNITION_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-300">
                ⚠️ Twilio's speech recognition doesn't support all languages (e.g., Hebrew). 
                If your TTS language isn't supported, callers will still hear the AI in their language, 
                but they'll need to speak in the selected recognition language.
              </p>
            </div>
          </div>

          {/* Custom Text Preview */}
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Voice Preview (Google TTS)</span>
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
                    <Play className="h-4 w-4 mr-2" />
                    Preview Voice
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
            🎙️ <strong>Voiceflow:</strong> Design powerful conversational AI flows with a visual canvas. Configure your agent at{" "}
            <a 
              href="https://creator.voiceflow.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-emerald-200"
            >
              creator.voiceflow.com
            </a>
          </p>
        </div>

        {/* Webhook Health Check */}
        <WebhookHealthCheck />

        {/* Twilio Debugger Hints */}
        <TwilioDebuggerHints />
      </CardContent>
    </Card>
  );
}
