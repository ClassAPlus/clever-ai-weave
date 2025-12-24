import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Phone, MessageSquare, Clock } from "lucide-react";

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
  { value: "he-IL", label: "Hebrew (Israel)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "ar-XA", label: "Arabic" },
  { value: "ru-RU", label: "Russian" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
];

export function TwilioAdvancedSettings({ settings, onChange }: TwilioAdvancedSettingsProps) {
  const updateSetting = <K extends keyof TwilioSettings>(key: K, value: TwilioSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

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
            ⚠️ <strong>Note:</strong> These settings affect how your AI responds to customers. Adjust carefully to balance responsiveness and cost.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
