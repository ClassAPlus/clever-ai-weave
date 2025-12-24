import { useState, useRef } from "react";
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
  googleVoiceName?: string;
  ringTimeout: number;
  dailyMessageLimit: number;
  rateLimitWindow: number;
}

interface TwilioAdvancedSettingsProps {
  settings: TwilioSettings;
  onChange: (settings: TwilioSettings) => void;
}

// Google Cloud TTS voices organized by language
const GOOGLE_VOICES: Record<string, { name: string; gender: string; type: string; description: string }[]> = {
  'he-IL': [
    { name: 'he-IL-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Natural Hebrew female' },
    { name: 'he-IL-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Natural Hebrew male' },
    { name: 'he-IL-Wavenet-C', gender: 'female', type: 'Wavenet', description: 'Alternative Hebrew female' },
    { name: 'he-IL-Wavenet-D', gender: 'male', type: 'Wavenet', description: 'Alternative Hebrew male' },
  ],
  'en-US': [
    { name: 'en-US-Neural2-C', gender: 'female', type: 'Neural2', description: 'Natural American female' },
    { name: 'en-US-Neural2-D', gender: 'male', type: 'Neural2', description: 'Natural American male' },
    { name: 'en-US-Neural2-E', gender: 'female', type: 'Neural2', description: 'Warm American female' },
    { name: 'en-US-Neural2-J', gender: 'male', type: 'Neural2', description: 'Friendly American male' },
    { name: 'en-US-Wavenet-C', gender: 'female', type: 'Wavenet', description: 'Clear American female' },
    { name: 'en-US-Wavenet-D', gender: 'male', type: 'Wavenet', description: 'Clear American male' },
  ],
  'en-GB': [
    { name: 'en-GB-Neural2-A', gender: 'female', type: 'Neural2', description: 'British female' },
    { name: 'en-GB-Neural2-B', gender: 'male', type: 'Neural2', description: 'British male' },
    { name: 'en-GB-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic British female' },
    { name: 'en-GB-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Classic British male' },
  ],
  'ar-XA': [
    { name: 'ar-XA-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Arabic female' },
    { name: 'ar-XA-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Arabic male' },
    { name: 'ar-XA-Wavenet-C', gender: 'male', type: 'Wavenet', description: 'Alternative Arabic male' },
  ],
  'es-ES': [
    { name: 'es-ES-Neural2-A', gender: 'female', type: 'Neural2', description: 'Spanish female' },
    { name: 'es-ES-Neural2-B', gender: 'male', type: 'Neural2', description: 'Spanish male' },
    { name: 'es-ES-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Classic Spanish male' },
    { name: 'es-ES-Wavenet-C', gender: 'female', type: 'Wavenet', description: 'Classic Spanish female' },
  ],
  'fr-FR': [
    { name: 'fr-FR-Neural2-A', gender: 'female', type: 'Neural2', description: 'French female' },
    { name: 'fr-FR-Neural2-B', gender: 'male', type: 'Neural2', description: 'French male' },
    { name: 'fr-FR-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic French female' },
    { name: 'fr-FR-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Classic French male' },
  ],
  'de-DE': [
    { name: 'de-DE-Neural2-A', gender: 'female', type: 'Neural2', description: 'German female' },
    { name: 'de-DE-Neural2-B', gender: 'male', type: 'Neural2', description: 'German male' },
    { name: 'de-DE-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic German female' },
    { name: 'de-DE-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Classic German male' },
  ],
  'pt-BR': [
    { name: 'pt-BR-Neural2-A', gender: 'female', type: 'Neural2', description: 'Brazilian Portuguese female' },
    { name: 'pt-BR-Neural2-B', gender: 'male', type: 'Neural2', description: 'Brazilian Portuguese male' },
    { name: 'pt-BR-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic Brazilian female' },
    { name: 'pt-BR-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Classic Brazilian male' },
  ],
  'pt-PT': [
    { name: 'pt-PT-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Portuguese female' },
    { name: 'pt-PT-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Portuguese male' },
  ],
  'it-IT': [
    { name: 'it-IT-Neural2-A', gender: 'female', type: 'Neural2', description: 'Italian female' },
    { name: 'it-IT-Neural2-C', gender: 'male', type: 'Neural2', description: 'Italian male' },
    { name: 'it-IT-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic Italian female' },
    { name: 'it-IT-Wavenet-C', gender: 'male', type: 'Wavenet', description: 'Classic Italian male' },
  ],
  'nl-NL': [
    { name: 'nl-NL-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Dutch female' },
    { name: 'nl-NL-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Dutch male' },
  ],
  'pl-PL': [
    { name: 'pl-PL-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Polish female' },
    { name: 'pl-PL-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Polish male' },
  ],
  'ru-RU': [
    { name: 'ru-RU-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Russian female' },
    { name: 'ru-RU-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Russian male' },
  ],
  'zh-CN': [
    { name: 'cmn-CN-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Mandarin female' },
    { name: 'cmn-CN-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Mandarin male' },
  ],
  'ja-JP': [
    { name: 'ja-JP-Neural2-B', gender: 'female', type: 'Neural2', description: 'Japanese female' },
    { name: 'ja-JP-Neural2-C', gender: 'male', type: 'Neural2', description: 'Japanese male' },
    { name: 'ja-JP-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic Japanese female' },
    { name: 'ja-JP-Wavenet-B', gender: 'female', type: 'Wavenet', description: 'Alternative Japanese female' },
  ],
  'ko-KR': [
    { name: 'ko-KR-Neural2-A', gender: 'female', type: 'Neural2', description: 'Korean female' },
    { name: 'ko-KR-Neural2-C', gender: 'male', type: 'Neural2', description: 'Korean male' },
    { name: 'ko-KR-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic Korean female' },
    { name: 'ko-KR-Wavenet-B', gender: 'female', type: 'Wavenet', description: 'Alternative Korean female' },
  ],
  'tr-TR': [
    { name: 'tr-TR-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Turkish female' },
    { name: 'tr-TR-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Turkish male' },
  ],
  'hi-IN': [
    { name: 'hi-IN-Neural2-A', gender: 'female', type: 'Neural2', description: 'Hindi female' },
    { name: 'hi-IN-Neural2-B', gender: 'male', type: 'Neural2', description: 'Hindi male' },
    { name: 'hi-IN-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Classic Hindi female' },
    { name: 'hi-IN-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Classic Hindi male' },
  ],
  'th-TH': [
    { name: 'th-TH-Standard-A', gender: 'female', type: 'Standard', description: 'Thai female' },
  ],
  'vi-VN': [
    { name: 'vi-VN-Wavenet-A', gender: 'female', type: 'Wavenet', description: 'Vietnamese female' },
    { name: 'vi-VN-Wavenet-B', gender: 'male', type: 'Wavenet', description: 'Vietnamese male' },
  ],
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

export function TwilioAdvancedSettings({ settings, onChange }: TwilioAdvancedSettingsProps) {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customText, setCustomText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateSettings = (patch: Partial<TwilioSettings>) => {
    onChange({ ...settings, ...patch });
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
    const voiceName = settings.googleVoiceName || getDefaultVoice(settings.voiceLanguage, settings.voiceGender);

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
            languageCode: settings.voiceLanguage,
            gender: settings.voiceGender,
            voiceName: voiceName 
          }),
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

  const getDefaultVoice = (lang: string, gender: string): string => {
    const voices = GOOGLE_VOICES[lang] || GOOGLE_VOICES['en-US'];
    const targetGender = gender || 'female';
    // Prefer Neural2 > Wavenet > Standard
    const sorted = [...voices].sort((a, b) => {
      const scoreA = a.type === 'Neural2' ? 3 : a.type === 'Wavenet' ? 2 : 1;
      const scoreB = b.type === 'Neural2' ? 3 : b.type === 'Wavenet' ? 2 : 1;
      return scoreB - scoreA;
    });
    return sorted.find(v => v.gender === targetGender)?.name || sorted[0]?.name || 'en-US-Neural2-C';
  };

  const currentLang = VOICE_LANGUAGES.find(l => l.value === settings.voiceLanguage);
  const availableVoices = GOOGLE_VOICES[settings.voiceLanguage] || GOOGLE_VOICES['en-US'];
  // Show all voices for the language, sorted with preferred gender first
  const sortedVoices = [...availableVoices].sort((a, b) => {
    // Preferred gender first
    if (a.gender === settings.voiceGender && b.gender !== settings.voiceGender) return -1;
    if (b.gender === settings.voiceGender && a.gender !== settings.voiceGender) return 1;
    // Then by quality: Neural2 > Wavenet > Standard
    const scoreA = a.type === 'Neural2' ? 3 : a.type === 'Wavenet' ? 2 : 1;
    const scoreB = b.type === 'Neural2' ? 3 : b.type === 'Wavenet' ? 2 : 1;
    return scoreB - scoreA;
  });
  const selectedVoice = availableVoices.find(v => v.name === settings.googleVoiceName);

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
                onValueChange={(value) => {
                  // Auto-select first voice of the current gender for new language
                  const newVoices = GOOGLE_VOICES[value] || GOOGLE_VOICES["en-US"];
                  const firstVoice = newVoices.find((v) => v.gender === settings.voiceGender) || newVoices[0];
                  updateSettings({
                    voiceLanguage: value,
                    googleVoiceName: firstVoice?.name || getDefaultVoice(value, settings.voiceGender),
                  });
                }}
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
                  // Auto-select first voice of the new gender
                  const voices = GOOGLE_VOICES[settings.voiceLanguage] || GOOGLE_VOICES["en-US"];
                  const firstVoice = voices.find((v) => v.gender === value) || voices[0];
                  updateSettings({
                    voiceGender: value,
                    googleVoiceName:
                      firstVoice?.name || getDefaultVoice(settings.voiceLanguage, value),
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

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              AI Voice Character
            </Label>
            <Select
              value={settings.googleVoiceName || getDefaultVoice(settings.voiceLanguage, settings.voiceGender)}
              onValueChange={(value) => updateSettings({ googleVoiceName: value })}
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
                {sortedVoices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-xs text-gray-400">{voice.type} • {voice.gender} • {voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              High-quality voices powered by Google Cloud Text-to-Speech
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

        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-300">
            🌐 <strong>Google Cloud TTS:</strong> High-quality, natural-sounding voices with excellent support for {currentLang?.label || "all languages"}, including Hebrew and Arabic.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
