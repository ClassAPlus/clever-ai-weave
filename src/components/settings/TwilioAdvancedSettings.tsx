import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Phone, MessageSquare, Volume2, Loader2, Square } from "lucide-react";

interface TwilioSettings {
  voiceLanguage: string;
  voiceGender: string;
  ringTimeout: number;
  dailyMessageLimit: number;
  rateLimitWindow: number;
}

interface TwilioAdvancedSettingsProps {
  settings: TwilioSettings;
  onChange: (settings: TwilioSettings) => void;
}

const VOICE_LANGUAGES = [
  { value: "he-IL", label: "Hebrew (Israel)", sampleText: "שלום! ברוכים הבאים. איך אוכל לעזור לך היום?" },
  { value: "en-US", label: "English (US)", sampleText: "Hello! Welcome. How can I help you today?" },
  { value: "en-GB", label: "English (UK)", sampleText: "Hello! Welcome. How may I assist you today?" },
  { value: "ar-XA", label: "Arabic", sampleText: "مرحباً! أهلاً بك. كيف يمكنني مساعدتك اليوم؟" },
  { value: "ru-RU", label: "Russian", sampleText: "Здравствуйте! Добро пожаловать. Чем могу помочь?" },
  { value: "es-ES", label: "Spanish", sampleText: "¡Hola! Bienvenido. ¿Cómo puedo ayudarte hoy?" },
  { value: "fr-FR", label: "French", sampleText: "Bonjour! Bienvenue. Comment puis-je vous aider?" },
  { value: "de-DE", label: "German", sampleText: "Hallo! Willkommen. Wie kann ich Ihnen helfen?" },
];

export function TwilioAdvancedSettings({ settings, onChange }: TwilioAdvancedSettingsProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const updateSetting = <K extends keyof TwilioSettings>(key: K, value: TwilioSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const getVoiceForLanguage = (lang: string, gender: string): SpeechSynthesisVoice | null => {
    // Find a voice matching the language and gender preference
    const langCode = lang.split("-")[0]; // e.g., "he" from "he-IL"
    
    // Try to find exact match first
    let voice = availableVoices.find(v => 
      v.lang.startsWith(lang) && 
      v.name.toLowerCase().includes(gender)
    );
    
    // Fall back to language match
    if (!voice) {
      voice = availableVoices.find(v => v.lang.startsWith(lang));
    }
    
    // Fall back to language code match
    if (!voice) {
      voice = availableVoices.find(v => v.lang.startsWith(langCode));
    }
    
    // Final fallback to any voice
    if (!voice && availableVoices.length > 0) {
      voice = availableVoices[0];
    }
    
    return voice || null;
  };

  const playVoicePreview = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const langConfig = VOICE_LANGUAGES.find(l => l.value === settings.voiceLanguage);
    const textToSpeak = customText.trim() || langConfig?.sampleText || "Hello, how can I help you today?";
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = settings.voiceLanguage;
    
    const voice = getVoiceForLanguage(settings.voiceLanguage, settings.voiceGender);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1.0;
    utterance.pitch = settings.voiceGender === "female" ? 1.1 : 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const currentLang = VOICE_LANGUAGES.find(l => l.value === settings.voiceLanguage);

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
                onValueChange={(value) => updateSetting("voiceGender", value)}
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
                className={`border-purple-500/50 hover:bg-purple-500/10 ${
                  isSpeaking ? "text-red-400 border-red-500/50" : "text-purple-400"
                }`}
              >
                {isSpeaking ? (
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

        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <p className="text-sm text-yellow-300">
            ⚠️ <strong>Note:</strong> Voice preview uses your browser's speech synthesis. Actual Twilio voices may sound slightly different.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
