import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export interface AIPersonality {
  tone: string;
  style: string;
  emoji_usage: string;
  response_length: string;
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "casual", label: "Casual", description: "Relaxed and informal" },
  { value: "formal", label: "Formal", description: "Very proper and official" },
];

const STYLE_OPTIONS = [
  { value: "concise", label: "Concise", description: "Short and to the point" },
  { value: "conversational", label: "Conversational", description: "Natural flowing dialogue" },
  { value: "detailed", label: "Detailed", description: "Thorough explanations" },
];

const EMOJI_OPTIONS = [
  { value: "none", label: "None", description: "No emojis at all" },
  { value: "minimal", label: "Minimal", description: "Occasional key emojis" },
  { value: "moderate", label: "Moderate", description: "Regular emoji use" },
  { value: "frequent", label: "Frequent", description: "Lots of expressive emojis" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Short", description: "< 100 characters" },
  { value: "medium", label: "Medium", description: "100-200 characters" },
  { value: "detailed", label: "Detailed", description: "200-400 characters" },
];

interface AIPersonalitySettingsProps {
  personality: AIPersonality;
  onChange: (personality: AIPersonality) => void;
}

export function AIPersonalitySettings({ personality, onChange }: AIPersonalitySettingsProps) {
  const updateField = (field: keyof AIPersonality, value: string) => {
    onChange({ ...personality, [field]: value });
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Tone</Label>
            <Select value={personality.tone} onValueChange={(val) => updateField("tone", val)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-2">- {opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Style</Label>
            <Select value={personality.style} onValueChange={(val) => updateField("style", val)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-2">- {opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Emoji Usage</Label>
            <Select value={personality.emoji_usage} onValueChange={(val) => updateField("emoji_usage", val)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMOJI_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-2">- {opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Response Length</Label>
            <Select value={personality.response_length} onValueChange={(val) => updateField("response_length", val)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTH_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-2">- {opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400">
            <span className="text-purple-400 font-medium">Preview:</span> AI will respond in a{" "}
            <span className="text-white">{personality.tone}</span> tone, using a{" "}
            <span className="text-white">{personality.style}</span> style with{" "}
            <span className="text-white">{personality.emoji_usage}</span> emojis,
            keeping responses{" "}
            <span className="text-white">{personality.response_length}</span>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
