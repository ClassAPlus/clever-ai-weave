import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Bot, Clock, Bell, Phone, Save, Send } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface BusinessHours {
  [key: string]: { start: string; end: string } | undefined;
}

interface Business {
  id: string;
  name: string;
  owner_email: string | null;
  owner_phone: string | null;
  forward_to_phones: string[];
  owner_notification_channels: string[] | null;
  ai_instructions: string | null;
  ai_language: string | null;
  services: string[] | null;
  business_hours: BusinessHours | null;
  timezone: string | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  twilio_phone_number: string | null;
}

const DAYS = [
  { key: "sun", label: "Sunday" },
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
];

const TIMEZONES = [
  { value: "Asia/Jerusalem", label: "Israel (Jerusalem)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "Europe/Paris", label: "Central Europe (Paris)" },
];

const LANGUAGES = [
  { value: "hebrew", label: "עברית (Hebrew)" },
  { value: "english", label: "English" },
  { value: "arabic", label: "العربية (Arabic)" },
  { value: "russian", label: "Русский (Russian)" },
  { value: "spanish", label: "Español (Spanish)" },
  { value: "french", label: "Français (French)" },
  { value: "german", label: "Deutsch (German)" },
  { value: "portuguese", label: "Português (Portuguese)" },
  { value: "italian", label: "Italiano (Italian)" },
  { value: "dutch", label: "Nederlands (Dutch)" },
  { value: "polish", label: "Polski (Polish)" },
  { value: "turkish", label: "Türkçe (Turkish)" },
  { value: "chinese", label: "中文 (Chinese)" },
  { value: "japanese", label: "日本語 (Japanese)" },
  { value: "korean", label: "한국어 (Korean)" },
  { value: "hindi", label: "हिन्दी (Hindi)" },
  { value: "thai", label: "ไทย (Thai)" },
  { value: "vietnamese", label: "Tiếng Việt (Vietnamese)" },
];

// Validate E.164 phone format: +[country code][number], 8-15 digits total
const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
  if (!phone) return { isValid: true, message: "" }; // Empty is allowed
  
  const cleanPhone = phone.replace(/\s/g, "");
  
  if (!cleanPhone.startsWith("+")) {
    return { isValid: false, message: "Must start with + (e.g., +1234567890)" };
  }
  
  const phoneRegex = /^\+[1-9]\d{7,14}$/;
  if (!phoneRegex.test(cleanPhone)) {
    if (cleanPhone.length < 9) {
      return { isValid: false, message: "Phone number too short" };
    }
    if (cleanPhone.length > 16) {
      return { isValid: false, message: "Phone number too long" };
    }
    return { isValid: false, message: "Invalid format (e.g., +972501234567)" };
  }
  
  return { isValid: true, message: "" };
};

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPhoneError, setOwnerPhoneError] = useState("");
  const [forwardPhones, setForwardPhones] = useState("");
  const [forwardPhonesError, setForwardPhonesError] = useState("");
  const [services, setServices] = useState("");
  const [aiLanguages, setAiLanguages] = useState<string[]>(["hebrew"]);
  const [primaryLanguage, setPrimaryLanguage] = useState("hebrew");
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [aiInstructions, setAiInstructions] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jerusalem");
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    sun: { start: "09:00", end: "18:00" },
    mon: { start: "09:00", end: "18:00" },
    tue: { start: "09:00", end: "18:00" },
    wed: { start: "09:00", end: "18:00" },
    thu: { start: "09:00", end: "18:00" },
    fri: { start: "09:00", end: "14:00" },
    sat: undefined,
  });

  // Handle owner phone change with validation
  const handleOwnerPhoneChange = (value: string) => {
    setOwnerPhone(value);
    const { isValid, message } = validatePhoneNumber(value);
    setOwnerPhoneError(isValid ? "" : message);
  };

  // Handle forward phones change with validation (comma-separated)
  const handleForwardPhonesChange = (value: string) => {
    setForwardPhones(value);
    
    if (!value.trim()) {
      setForwardPhonesError("");
      return;
    }
    
    const phones = value.split(",").map(p => p.trim()).filter(Boolean);
    const invalidPhones: string[] = [];
    
    for (const phone of phones) {
      const { isValid } = validatePhoneNumber(phone);
      if (!isValid) {
        invalidPhones.push(phone);
      }
    }
    
    if (invalidPhones.length > 0) {
      setForwardPhonesError(`Invalid: ${invalidPhones.join(", ")} - Use international format (+1234567890)`);
    } else {
      setForwardPhonesError("");
    }
  };

  const fetchBusiness = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_user_id", user?.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          navigate("/onboarding");
          return;
        }
        throw error;
      }

      setBusiness({
        ...data,
        business_hours: data.business_hours as BusinessHours | null,
      });

      // Populate form
      setName(data.name || "");
      setOwnerEmail(data.owner_email || "");
      setOwnerPhone(data.owner_phone || "");
      setForwardPhones(data.forward_to_phones?.join(", ") || "");
      setServices(data.services?.join(", ") || "");
      // Parse ai_language - format: "primary:lang1,lang2,lang3:autodetect" or legacy formats
      const languageData = data.ai_language || "hebrew";
      const parts = languageData.split(":");
      if (parts.length >= 2) {
        setPrimaryLanguage(parts[0]);
        setAiLanguages(parts[1].split(",").map((l: string) => l.trim()).filter(Boolean));
        setAutoDetectLanguage(parts[2] !== "false");
      } else {
        const langs = languageData.split(",").map((l: string) => l.trim()).filter(Boolean);
        setAiLanguages(langs);
        setPrimaryLanguage(langs[0] || "hebrew");
        setAutoDetectLanguage(true);
      }
      setAiInstructions(data.ai_instructions || "");
      setTimezone(data.timezone || "Asia/Jerusalem");
      setQuietHoursStart(data.quiet_hours_start || "22:00");
      setQuietHoursEnd(data.quiet_hours_end || "07:00");
      setNotifySms(data.owner_notification_channels?.includes("sms") ?? true);
      setNotifyEmail(data.owner_notification_channels?.includes("email") ?? false);
      
      if (data.business_hours) {
        setBusinessHours(data.business_hours as BusinessHours);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, navigate, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBusiness();
    }
  }, [user, fetchBusiness]);

  const handleSave = async () => {
    if (!business) return;

    setIsSaving(true);
    try {
      const notificationChannels: string[] = [];
      if (notifySms) notificationChannels.push("sms");
      if (notifyEmail) notificationChannels.push("email");

      const { error } = await supabase
        .from("businesses")
        .update({
          name,
          owner_email: ownerEmail || null,
          owner_phone: ownerPhone || null,
          forward_to_phones: forwardPhones.split(",").map(p => p.trim()).filter(Boolean),
          services: services.split(",").map(s => s.trim()).filter(Boolean),
          ai_language: `${primaryLanguage}:${aiLanguages.join(",")}:${autoDetectLanguage}`,
          ai_instructions: aiInstructions || null,
          timezone,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
          owner_notification_channels: notificationChannels,
          business_hours: businessHours as unknown as Json,
        })
        .eq("id", business.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your business settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!business) return;

    setIsSendingTestSms(true);
    try {
      // Generate the greeting based on current settings
      const isRTL = ["hebrew", "arabic"].includes(primaryLanguage);
      const businessName = name || (isRTL ? (primaryLanguage === "hebrew" ? "העסק שלנו" : "عملنا") : "our business");
      
      const greetings: Record<string, string> = {
        hebrew: `שלום! ברוכים הבאים ל${businessName}. איך אוכל לעזור לך היום?`,
        english: `Hello! Welcome to ${businessName}. How can I help you today?`,
        arabic: `مرحباً! أهلاً بك في ${businessName}. كيف يمكنني مساعدتك اليوم؟`,
        russian: `Здравствуйте! Добро пожаловать в ${businessName}. Чем могу помочь?`,
        spanish: `¡Hola! Bienvenido a ${businessName}. ¿Cómo puedo ayudarte hoy?`,
        french: `Bonjour! Bienvenue chez ${businessName}. Comment puis-je vous aider?`,
        german: `Hallo! Willkommen bei ${businessName}. Wie kann ich Ihnen helfen?`,
        portuguese: `Olá! Bem-vindo a ${businessName}. Como posso ajudá-lo hoje?`,
        italian: `Ciao! Benvenuto da ${businessName}. Come posso aiutarti oggi?`,
        dutch: `Hallo! Welkom bij ${businessName}. Hoe kan ik u helpen?`,
        polish: `Cześć! Witamy w ${businessName}. Jak mogę pomóc?`,
        turkish: `Merhaba! ${businessName} hoş geldiniz. Size nasıl yardımcı olabilirim?`,
        chinese: `您好！欢迎来到${businessName}。今天我能为您做些什么？`,
        japanese: `こんにちは！${businessName}へようこそ。本日はどのようなご用件でしょうか？`,
        korean: `안녕하세요! ${businessName}에 오신 것을 환영합니다. 무엇을 도와드릴까요?`,
        hindi: `नमस्ते! ${businessName} में आपका स्वागत है। आज मैं आपकी कैसे मदद कर सकता हूं?`,
        thai: `สวัสดีครับ! ยินดีต้อนรับสู่${businessName} วันนี้ให้ช่วยอะไรได้บ้างครับ?`,
        vietnamese: `Xin chào! Chào mừng đến với ${businessName}. Tôi có thể giúp gì cho bạn?`,
      };
      
      const greeting = greetings[primaryLanguage] || greetings.english;

      const { data, error } = await supabase.functions.invoke('send-test-sms', {
        body: { businessId: business.id, greeting }
      });

      if (error) throw error;

      toast({
        title: "Test SMS Sent",
        description: `Greeting sent to ${ownerPhone}`,
      });
    } catch (error) {
      console.error("Error sending test SMS:", error);
      toast({
        variant: "destructive",
        title: "Failed to send test SMS",
        description: error instanceof Error ? error.message : "Please check your phone number and try again",
      });
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const updateBusinessHours = (day: string, field: "start" | "end", value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        start: field === "start" ? value : (prev[day]?.start || "09:00"),
        end: field === "end" ? value : (prev[day]?.end || "18:00"),
      }
    }));
  };

  const toggleDayEnabled = (day: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: prev[day] ? undefined : { start: "09:00", end: "18:00" }
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your business configuration</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !!ownerPhoneError || !!forwardPhonesError} className="bg-purple-600 hover:bg-purple-700">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Business Information */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              Business Information
            </CardTitle>
            <CardDescription className="text-gray-400">
              Basic details about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Business Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Owner Email</Label>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Owner Phone</Label>
                <Input
                  value={ownerPhone}
                  onChange={(e) => handleOwnerPhoneChange(e.target.value)}
                  placeholder="+972501234567"
                  className={`bg-gray-700 border-gray-600 text-white ${ownerPhoneError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {ownerPhoneError && (
                  <p className="text-xs text-red-400">{ownerPhoneError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Services (comma-separated)</Label>
                <Input
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  placeholder="Haircut, Coloring, Styling"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            {business?.twilio_phone_number && (
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-400">AI Phone Number:</span>
                  <span className="text-purple-400 font-mono">{business.twilio_phone_number}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-400" />
              AI Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Customize how your AI assistant behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">AI Languages</Label>
              <p className="text-xs text-gray-500 mb-2">
                Select the languages your AI should understand and respond in
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    {aiLanguages.length === 0 
                      ? "Select languages..." 
                      : aiLanguages.length === 1
                        ? LANGUAGES.find(l => l.value === aiLanguages[0])?.label || aiLanguages[0]
                        : `${aiLanguages.length} languages selected`
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-80 overflow-y-auto bg-gray-800 border-gray-700">
                  <div className="space-y-2">
                    {LANGUAGES.map(lang => (
                      <div key={lang.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${lang.value}`}
                          checked={aiLanguages.includes(lang.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAiLanguages(prev => [...prev, lang.value]);
                            } else {
                              setAiLanguages(prev => prev.filter(l => l !== lang.value));
                            }
                          }}
                          className="border-gray-500 data-[state=checked]:bg-purple-600"
                        />
                        <label 
                          htmlFor={`lang-${lang.value}`}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {lang.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {aiLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {aiLanguages.map(langValue => {
                    const lang = LANGUAGES.find(l => l.value === langValue);
                    return (
                      <span 
                        key={langValue}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                      >
                        {lang?.label || langValue}
                        <button
                          type="button"
                          onClick={() => setAiLanguages(prev => prev.filter(l => l !== langValue))}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            
            {aiLanguages.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-gray-700">
                <Label className="text-gray-300">Primary Language</Label>
                <p className="text-xs text-gray-500 mb-2">
                  The language AI uses when initiating conversations
                </p>
                <Select 
                  value={primaryLanguage} 
                  onValueChange={setPrimaryLanguage}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiLanguages.map(langValue => {
                      const lang = LANGUAGES.find(l => l.value === langValue);
                      return (
                        <SelectItem key={langValue} value={langValue}>
                          {lang?.label || langValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div>
                <Label className="text-gray-300">Auto-Detect Language</Label>
                <p className="text-xs text-gray-500">
                  AI will detect and switch to the customer's language automatically
                </p>
              </div>
              <Switch 
                checked={autoDetectLanguage} 
                onCheckedChange={setAutoDetectLanguage} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Custom AI Instructions</Label>
              <Textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Special instructions for the AI assistant..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                Provide specific guidelines for how the AI should handle calls and messages.
              </p>
            </div>
            
            {/* Greeting Preview */}
            <div className="pt-4 border-t border-gray-700">
              <Label className="text-gray-300 mb-3 block">Greeting Preview</Label>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const isRTL = ["hebrew", "arabic"].includes(primaryLanguage);
                      const businessName = name || (isRTL ? (primaryLanguage === "hebrew" ? "העסק שלנו" : "عملنا") : "our business");
                      
                      const greetings: Record<string, string> = {
                        hebrew: `שלום! ברוכים הבאים ל${businessName}. איך אוכל לעזור לך היום?`,
                        english: `Hello! Welcome to ${businessName}. How can I help you today?`,
                        arabic: `مرحباً! أهلاً بك في ${businessName}. كيف يمكنني مساعدتك اليوم؟`,
                        russian: `Здравствуйте! Добро пожаловать в ${businessName}. Чем могу помочь?`,
                        spanish: `¡Hola! Bienvenido a ${businessName}. ¿Cómo puedo ayudarte hoy?`,
                        french: `Bonjour! Bienvenue chez ${businessName}. Comment puis-je vous aider?`,
                        german: `Hallo! Willkommen bei ${businessName}. Wie kann ich Ihnen helfen?`,
                        portuguese: `Olá! Bem-vindo a ${businessName}. Como posso ajudá-lo hoje?`,
                        italian: `Ciao! Benvenuto da ${businessName}. Come posso aiutarti oggi?`,
                        dutch: `Hallo! Welkom bij ${businessName}. Hoe kan ik u helpen?`,
                        polish: `Cześć! Witamy w ${businessName}. Jak mogę pomóc?`,
                        turkish: `Merhaba! ${businessName} hoş geldiniz. Size nasıl yardımcı olabilirim?`,
                        chinese: `您好！欢迎来到${businessName}。今天我能为您做些什么？`,
                        japanese: `こんにちは！${businessName}へようこそ。本日はどのようなご用件でしょうか？`,
                        korean: `안녕하세요! ${businessName}에 오신 것을 환영합니다. 무엇을 도와드릴까요?`,
                        hindi: `नमस्ते! ${businessName} में आपका स्वागत है। आज मैं आपकी कैसे मदद कर सकता हूं?`,
                        thai: `สวัสดีครับ! ยินดีต้อนรับสู่${businessName} วันนี้ให้ช่วยอะไรได้บ้างครับ?`,
                        vietnamese: `Xin chào! Chào mừng đến với ${businessName}. Tôi có thể giúp gì cho bạn?`,
                      };
                      
                      return (
                        <p 
                          className="text-sm text-gray-300" 
                          dir={isRTL ? "rtl" : "ltr"}
                          style={{ textAlign: isRTL ? "right" : "left" }}
                        >
                          {greetings[primaryLanguage] || greetings.english}
                        </p>
                      );
                    })()}
                    {autoDetectLanguage && aiLanguages.length > 1 && (
                      <p className="text-xs text-gray-500 italic">
                        Will automatically switch to customer&apos;s language when detected
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    <span className="text-purple-400">Primary:</span> {LANGUAGES.find(l => l.value === primaryLanguage)?.label || primaryLanguage}
                    {aiLanguages.length > 1 && (
                      <span className="ml-3">
                        <span className="text-purple-400">Also speaks:</span> {aiLanguages.filter(l => l !== primaryLanguage).map(l => LANGUAGES.find(lang => lang.value === l)?.label.split(" ")[0] || l).join(", ")}
                      </span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestSms}
                    disabled={isSendingTestSms || !business?.twilio_phone_number || !ownerPhone}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  >
                    {isSendingTestSms ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Send Test SMS
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Forwarding */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="h-5 w-5 text-purple-400" />
              Call Forwarding
            </CardTitle>
            <CardDescription className="text-gray-400">
              Phone numbers to forward calls to before AI takes over
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Forward to Phones (comma-separated)</Label>
              <Input
                value={forwardPhones}
                onChange={(e) => handleForwardPhonesChange(e.target.value)}
                placeholder="+972501234567, +972509876543"
                className={`bg-gray-700 border-gray-600 text-white ${forwardPhonesError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {forwardPhonesError ? (
                <p className="text-xs text-red-400">{forwardPhonesError}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Incoming calls will first try these numbers. If no answer, AI takes over.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              Business Hours
            </CardTitle>
            <CardDescription className="text-gray-400">
              Set your operating hours for each day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {DAYS.map(day => (
                <div key={day.key} className="flex items-center gap-4">
                  <div className="w-24 flex items-center gap-2">
                    <Switch
                      checked={!!businessHours[day.key]}
                      onCheckedChange={() => toggleDayEnabled(day.key)}
                    />
                    <span className="text-sm text-gray-300">{day.label.slice(0, 3)}</span>
                  </div>
                  {businessHours[day.key] ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={businessHours[day.key]?.start || "09:00"}
                        onChange={(e) => updateBusinessHours(day.key, "start", e.target.value)}
                        className="w-28 bg-gray-700 border-gray-600 text-white"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={businessHours[day.key]?.end || "18:00"}
                        onChange={(e) => updateBusinessHours(day.key, "end", e.target.value)}
                        className="w-28 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Closed</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-700">
              <Label className="text-gray-300 mb-3 block">Quiet Hours (no notifications)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-28 bg-gray-700 border-gray-600 text-white"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-28 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-400" />
              Notifications
            </CardTitle>
            <CardDescription className="text-gray-400">
              How you want to receive alerts about inquiries and appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">SMS Notifications</Label>
                <p className="text-xs text-gray-500">Receive text messages for new inquiries</p>
              </div>
              <Switch checked={notifySms} onCheckedChange={setNotifySms} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive email summaries and alerts</p>
              </div>
              <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
