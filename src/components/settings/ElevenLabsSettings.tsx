import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Mic, 
  Volume2, 
  Globe, 
  Settings2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VoiceAgentDemo } from "./VoiceAgentDemo";

export interface ElevenLabsConfig {
  agentId: string;
  voiceId?: string;
  language?: string;
  customPromptOverride?: string;
  firstMessageOverride?: string;
  enableTools?: boolean;
}

interface ElevenLabsSettingsProps {
  config: ElevenLabsConfig;
  onChange: (config: ElevenLabsConfig) => void;
  onTest?: () => void;
  isTesting?: boolean;
  testResult?: { success: boolean; message: string } | null;
  disabled?: boolean;
  businessId?: string;
}

// Popular ElevenLabs voice options
const VOICE_OPTIONS = [
  { value: "", label: "Default (Agent's voice)" },
  { value: "EXAVITQu4vr4xnSDxMaL", label: "Sarah - Soft, friendly" },
  { value: "JBFqnCBsd6RMkjVDRZzb", label: "George - Professional, clear" },
  { value: "pFZP5JQG7iQjIQuC4Bku", label: "Lily - Warm, expressive" },
  { value: "onwK4e9ZLuTAKqWW03F9", label: "Daniel - Authoritative" },
  { value: "cgSgspJ2msm6clMCkdW9", label: "Jessica - Friendly, natural" },
  { value: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam - Casual, young" },
  { value: "custom", label: "Custom Voice ID..." },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "he", label: "Hebrew (עברית)" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
  { value: "de", label: "German (Deutsch)" },
  { value: "ru", label: "Russian (Русский)" },
  { value: "pt", label: "Portuguese (Português)" },
  { value: "zh", label: "Chinese (中文)" },
  { value: "ja", label: "Japanese (日本語)" },
  { value: "ko", label: "Korean (한국어)" },
  { value: "it", label: "Italian (Italiano)" },
];

export function ElevenLabsSettings({
  config,
  onChange,
  onTest,
  isTesting,
  testResult,
  disabled = false,
  businessId,
}: ElevenLabsSettingsProps) {
  const [showCustomVoiceInput, setShowCustomVoiceInput] = useState(
    config.voiceId && !VOICE_OPTIONS.some(v => v.value === config.voiceId && v.value !== "custom")
  );

  const updateField = <K extends keyof ElevenLabsConfig>(field: K, value: ElevenLabsConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  const handleVoiceChange = (value: string) => {
    if (value === "custom") {
      setShowCustomVoiceInput(true);
      updateField("voiceId", "");
    } else {
      setShowCustomVoiceInput(false);
      updateField("voiceId", value);
    }
  };

  const isConfigured = !!config.agentId;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">ElevenLabs Voice AI</CardTitle>
              <CardDescription>
                Configure your AI phone receptionist
              </CardDescription>
            </div>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Set Up
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Agent ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Find this in your ElevenLabs dashboard under Conversational AI → Your Agent → Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Input
              id="agentId"
              value={config.agentId}
              onChange={(e) => updateField("agentId", e.target.value)}
              placeholder="e.g., agent_abc123xyz..."
              className="font-mono text-sm"
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0"
            >
              <a 
                href="https://elevenlabs.io/app/conversational-ai" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Dashboard
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This single Agent ID is shared across all tenants. Per-tenant customization happens through dynamic overrides.
          </p>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label>Voice</Label>
          </div>
          <Select
            value={showCustomVoiceInput ? "custom" : (config.voiceId || "")}
            onValueChange={handleVoiceChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Use agent's default voice" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  {voice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {showCustomVoiceInput && (
            <Input
              value={config.voiceId || ""}
              onChange={(e) => updateField("voiceId", e.target.value)}
              placeholder="Enter custom voice ID..."
              className="mt-2 font-mono text-sm"
              disabled={disabled}
            />
          )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label>Language</Label>
          </div>
          <Select
            value={config.language || "en"}
            onValueChange={(val) => updateField("language", val)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* First Message Override */}
        <div className="space-y-2">
          <Label htmlFor="firstMessage">First Message (Greeting)</Label>
          <Textarea
            id="firstMessage"
            value={config.firstMessageOverride || ""}
            onChange={(e) => updateField("firstMessageOverride", e.target.value)}
            placeholder="Hello, thank you for calling. How can I help you today?"
            rows={2}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the greeting from your business settings
          </p>
        </div>

        {/* Custom Prompt Override */}
        <div className="space-y-2">
          <Label htmlFor="promptOverride">Custom System Prompt</Label>
          <Textarea
            id="promptOverride"
            value={config.customPromptOverride || ""}
            onChange={(e) => updateField("customPromptOverride", e.target.value)}
            placeholder="You are a helpful phone receptionist for {{business_name}}..."
            rows={4}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to auto-generate from business name, services, and AI instructions
          </p>
        </div>

        {/* Enable Tools */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="enableTools" className="cursor-pointer">Enable Agent Tools</Label>
              <p className="text-xs text-muted-foreground">
                Allow AI to book appointments, check availability, etc.
              </p>
            </div>
          </div>
          <Switch
            id="enableTools"
            checked={config.enableTools ?? true}
            onCheckedChange={(checked) => updateField("enableTools", checked)}
            disabled={disabled}
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertDescription className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Button */}
        {onTest && isConfigured && (
          <Button
            variant="outline"
            onClick={onTest}
            disabled={disabled || isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>Testing connection...</>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Test ElevenLabs Connection
              </>
            )}
          </Button>
        )}

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-primary">Multi-tenant mode:</span> One ElevenLabs agent handles all businesses. 
            Each call dynamically receives business-specific greetings, instructions, and personality from your database configuration.
          </p>
        </div>

        {/* Voice Demo Section */}
        {businessId && (
          <>
            <Separator className="my-4" />
            <VoiceAgentDemo 
              businessId={businessId} 
              agentId={config.agentId} 
              disabled={disabled}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
