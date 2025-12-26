import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Bot, Clock, Bell, Phone, Save, Send, Sparkles, MessageSquare, Wrench, BookOpen, Code, ArrowRightLeft, Mail, Pencil, X, PhoneCall } from "lucide-react";
import { PortNumberDialog } from "@/components/PortNumberDialog";
import { PortRequestStatus } from "@/components/PortRequestStatus";
import { Json } from "@/integrations/supabase/types";
import { IndustryTemplateSelector, INDUSTRY_TEMPLATES } from "@/components/settings/IndustryTemplateSelector";
import { AIPersonalitySettings, AIPersonality } from "@/components/settings/AIPersonalitySettings";
import { CustomGreetingsEditor, GreetingMessages } from "@/components/settings/CustomGreetingsEditor";
import { CustomToolsToggle } from "@/components/settings/CustomToolsToggle";
import { KnowledgeBaseEditor, KnowledgeBase } from "@/components/settings/KnowledgeBaseEditor";
import { AIResponsePreview } from "@/components/settings/AIResponsePreview";
import { APIStatusDashboard } from "@/components/settings/APIStatusDashboard";
import { WebhookURLs } from "@/components/settings/WebhookURLs";
import { DebugTools } from "@/components/settings/DebugTools";
import { DataExport } from "@/components/settings/DataExport";
import { TwilioAdvancedSettings } from "@/components/settings/TwilioAdvancedSettings";
import { AdminRoleManager } from "@/components/settings/AdminRoleManager";
import { BusinessStaffManager } from "@/components/settings/BusinessStaffManager";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { GoogleCalendarSync } from "@/components/settings/GoogleCalendarSync";
import { AppointmentTemplateManager } from "@/components/appointments/AppointmentTemplateManager";
import { Badge } from "@/components/ui/badge";
import { AITestCall } from "@/components/settings/AITestCall";

interface BusinessHours {
  [key: string]: { start: string; end: string } | undefined;
}

interface TwilioSettings {
  voiceLanguage: string;
  voiceGender: string;
  voiceId: string;
  googleVoiceName?: string;
  ringTimeout: number;
  dailyMessageLimit: number;
  rateLimitWindow: number;
  enableAiReceptionist?: boolean;
  enableAppointmentReminders?: boolean;
  appointmentReminderTemplate?: string;
  appointmentReminderTiming?: 'same_day' | '1_day' | '2_days';
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
  industry_type: string | null;
  ai_personality: AIPersonality | null;
  greeting_messages: GreetingMessages | null;
  custom_tools: string[] | null;
  knowledge_base: KnowledgeBase | null;
  twilio_settings: TwilioSettings | null;
  notification_email_from: string | null;
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

// Validate email format
const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) return { isValid: true, message: "" }; // Empty is allowed
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }
  
  if (email.length > 255) {
    return { isValid: false, message: "Email too long (max 255 characters)" };
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
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isTestingForwardPhones, setIsTestingForwardPhones] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPortDialogOpen, setIsPortDialogOpen] = useState(false);

  // Edit mode states for each section
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingForwarding, setIsEditingForwarding] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [isEditingPersonality, setIsEditingPersonality] = useState(false);
  const [isEditingGreetings, setIsEditingGreetings] = useState(false);
  const [isEditingTools, setIsEditingTools] = useState(false);
  const [isEditingKnowledge, setIsEditingKnowledge] = useState(false);

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

  // New specialized messaging state
  const [industryType, setIndustryType] = useState<string>("");
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>({
    tone: "friendly",
    style: "conversational",
    emoji_usage: "minimal",
    response_length: "medium",
  });
  const [greetingMessages, setGreetingMessages] = useState<GreetingMessages>({
    new_conversation: "",
    missed_call: "",
    returning_customer: "",
    after_hours: "",
  });
  const [customTools, setCustomTools] = useState<string[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>({
    faqs: [],
    policies: {},
    pricing: [],
    staff: [],
  });
  const [twilioSettings, setTwilioSettings] = useState<TwilioSettings>({
    voiceLanguage: "he-IL",
    voiceGender: "female",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    ringTimeout: 30,
    dailyMessageLimit: 10,
    rateLimitWindow: 5,
    enableAiReceptionist: true,
    enableAppointmentReminders: true,
  });
  const [notificationEmailFrom, setNotificationEmailFrom] = useState("");
  const [notificationEmailError, setNotificationEmailError] = useState("");

  // Track initial values for dirty checking
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialValues || !business) return false;
    
    return (
      name !== initialValues.name ||
      ownerEmail !== initialValues.ownerEmail ||
      ownerPhone !== initialValues.ownerPhone ||
      forwardPhones !== initialValues.forwardPhones ||
      services !== initialValues.services ||
      primaryLanguage !== initialValues.primaryLanguage ||
      JSON.stringify(aiLanguages) !== JSON.stringify(initialValues.aiLanguages) ||
      autoDetectLanguage !== initialValues.autoDetectLanguage ||
      aiInstructions !== initialValues.aiInstructions ||
      timezone !== initialValues.timezone ||
      quietHoursStart !== initialValues.quietHoursStart ||
      quietHoursEnd !== initialValues.quietHoursEnd ||
      notifySms !== initialValues.notifySms ||
      notifyEmail !== initialValues.notifyEmail ||
      JSON.stringify(businessHours) !== JSON.stringify(initialValues.businessHours) ||
      industryType !== initialValues.industryType ||
      JSON.stringify(aiPersonality) !== JSON.stringify(initialValues.aiPersonality) ||
      JSON.stringify(greetingMessages) !== JSON.stringify(initialValues.greetingMessages) ||
      JSON.stringify(customTools) !== JSON.stringify(initialValues.customTools) ||
      JSON.stringify(knowledgeBase) !== JSON.stringify(initialValues.knowledgeBase) ||
      JSON.stringify(twilioSettings) !== JSON.stringify(initialValues.twilioSettings) ||
      notificationEmailFrom !== initialValues.notificationEmailFrom
    );
  }, [
    initialValues, business, name, ownerEmail, ownerPhone, forwardPhones, services,
    primaryLanguage, aiLanguages, autoDetectLanguage, aiInstructions, timezone,
    quietHoursStart, quietHoursEnd, notifySms, notifyEmail, businessHours,
    industryType, aiPersonality, greetingMessages, customTools, knowledgeBase,
    twilioSettings, notificationEmailFrom
  ]);

  // Handle browser beforeunload event (warns when closing/refreshing browser)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  // Handle notification email change with validation
  const handleNotificationEmailChange = (value: string) => {
    setNotificationEmailFrom(value);
    const { isValid, message } = validateEmail(value);
    setNotificationEmailError(isValid ? "" : message);
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
        ai_personality: data.ai_personality as unknown as AIPersonality | null,
        greeting_messages: data.greeting_messages as unknown as GreetingMessages | null,
        knowledge_base: data.knowledge_base as unknown as KnowledgeBase | null,
        twilio_settings: data.twilio_settings as unknown as TwilioSettings | null,
        notification_email_from: data.notification_email_from,
      });
      // Populate form fields from database
      setName(data.name || "");
      setOwnerEmail(data.owner_email || "");
      setOwnerPhone(data.owner_phone || "");
      setNotificationEmailFrom(data.notification_email_from || "");
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

      // Load new specialized messaging fields
      setIndustryType(data.industry_type || "");
      if (data.ai_personality) {
        setAiPersonality(data.ai_personality as unknown as AIPersonality);
      }
      if (data.greeting_messages) {
        setGreetingMessages(data.greeting_messages as unknown as GreetingMessages);
      }
      setCustomTools(data.custom_tools || []);
      if (data.knowledge_base) {
        setKnowledgeBase(data.knowledge_base as unknown as KnowledgeBase);
      }
      if (data.twilio_settings) {
        setTwilioSettings(data.twilio_settings as unknown as TwilioSettings);
      }

      // Set initial values for dirty checking
      const parsedLanguageData = data.ai_language || "hebrew";
      const parsedParts = parsedLanguageData.split(":");
      let parsedPrimaryLang = "hebrew";
      let parsedAiLangs = ["hebrew"];
      let parsedAutoDetect = true;
      
      if (parsedParts.length >= 2) {
        parsedPrimaryLang = parsedParts[0];
        parsedAiLangs = parsedParts[1].split(",").map((l: string) => l.trim()).filter(Boolean);
        parsedAutoDetect = parsedParts[2] !== "false";
      } else {
        const langs = parsedLanguageData.split(",").map((l: string) => l.trim()).filter(Boolean);
        parsedAiLangs = langs;
        parsedPrimaryLang = langs[0] || "hebrew";
      }

      setInitialValues({
        name: data.name || "",
        ownerEmail: data.owner_email || "",
        ownerPhone: data.owner_phone || "",
        forwardPhones: data.forward_to_phones?.join(", ") || "",
        services: data.services?.join(", ") || "",
        primaryLanguage: parsedPrimaryLang,
        aiLanguages: parsedAiLangs,
        autoDetectLanguage: parsedAutoDetect,
        aiInstructions: data.ai_instructions || "",
        timezone: data.timezone || "Asia/Jerusalem",
        quietHoursStart: data.quiet_hours_start || "22:00",
        quietHoursEnd: data.quiet_hours_end || "07:00",
        notifySms: data.owner_notification_channels?.includes("sms") ?? true,
        notifyEmail: data.owner_notification_channels?.includes("email") ?? false,
        businessHours: data.business_hours || {},
        industryType: data.industry_type || "",
        aiPersonality: data.ai_personality || { tone: "friendly", style: "conversational", emoji_usage: "minimal", response_length: "medium" },
        greetingMessages: data.greeting_messages || { new_conversation: "", missed_call: "", returning_customer: "", after_hours: "" },
        customTools: data.custom_tools || [],
        knowledgeBase: data.knowledge_base || { faqs: [], policies: {}, pricing: [], staff: [] },
        twilioSettings: data.twilio_settings || { voiceLanguage: "he-IL", voiceGender: "female", voiceId: "EXAVITQu4vr4xnSDxMaL", ringTimeout: 30, dailyMessageLimit: 10, rateLimitWindow: 5, enableAiReceptionist: true },
        notificationEmailFrom: data.notification_email_from || "",
      });
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
      // Check if user is admin
      const checkAdminStatus = async () => {
        const { data } = await supabase.rpc('is_admin', { user_id: user.id });
        setIsAdmin(data === true);
      };
      checkAdminStatus();
    }
  }, [user, fetchBusiness]);

  const handleSave = async () => {
    if (!business) return;

    // Validate email before saving
    if (notificationEmailFrom && notificationEmailError) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the sender email format before saving.",
      });
      return;
    }

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
          industry_type: industryType || null,
          ai_personality: aiPersonality as unknown as Json,
          greeting_messages: greetingMessages as unknown as Json,
          custom_tools: customTools,
          knowledge_base: knowledgeBase as unknown as Json,
          twilio_settings: twilioSettings as unknown as Json,
          notification_email_from: notificationEmailFrom || null,
        })
        .eq("id", business.id);

      if (error) throw error;

      // Update initial values to current values after successful save
      setInitialValues({
        name,
        ownerEmail,
        ownerPhone,
        forwardPhones,
        services,
        primaryLanguage,
        aiLanguages,
        autoDetectLanguage,
        aiInstructions,
        timezone,
        quietHoursStart,
        quietHoursEnd,
        notifySms,
        notifyEmail,
        businessHours,
        industryType,
        aiPersonality,
        greetingMessages,
        customTools,
        knowledgeBase,
        twilioSettings,
        notificationEmailFrom,
      });

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

  const handleSendTestEmail = async () => {
    if (!business || !ownerEmail) {
      toast({
        variant: "destructive",
        title: "Missing email",
        description: "Please enter an owner email address to receive the test email",
      });
      return;
    }

    if (notificationEmailError) {
      toast({
        variant: "destructive",
        title: "Invalid sender email",
        description: "Please fix the sender email format before testing",
      });
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          to_email: ownerEmail,
          from_email: notificationEmailFrom || undefined,
          business_name: name || 'Your Business',
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Test Email Sent",
        description: `Check your inbox at ${ownerEmail}`,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        variant: "destructive",
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : "Please check your email configuration and try again",
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleTestForwardPhones = async () => {
    if (!business) return;

    const phones = forwardPhones.split(",").map(p => p.trim()).filter(Boolean);
    if (phones.length === 0) {
      toast({
        variant: "destructive",
        title: "No phone numbers",
        description: "Please enter at least one forward phone number",
      });
      return;
    }

    if (forwardPhonesError) {
      toast({
        variant: "destructive",
        title: "Invalid phone numbers",
        description: "Please fix the phone format errors before testing",
      });
      return;
    }

    setIsTestingForwardPhones(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-sms', {
        body: { 
          businessId: business.id, 
          testType: 'forward_phones',
          targetPhones: phones
        }
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
      const totalCount = phones.length;

      if (successCount === totalCount) {
        toast({
          title: "All test SMS sent",
          description: `Successfully sent to ${successCount} number${successCount > 1 ? 's' : ''}`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial success",
          description: `${successCount}/${totalCount} messages sent. Check phone formats.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send",
          description: "Could not send to any numbers. Please check formats.",
        });
      }
    } catch (error) {
      console.error("Error testing forward phones:", error);
      toast({
        variant: "destructive",
        title: "Failed to send test SMS",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsTestingForwardPhones(false);
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
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Manage your business configuration</p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
              Unsaved changes
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !!ownerPhoneError || !!forwardPhonesError}
          className={hasUnsavedChanges ? "bg-yellow-600 hover:bg-yellow-700" : "bg-purple-600 hover:bg-purple-700"}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {hasUnsavedChanges ? "Save Changes" : "Saved"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="developer" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Code className="h-4 w-4 mr-2" />
            Developer
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Business Information */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-400" />
                  Business Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Basic details about your business
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditingBusiness && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSave();
                      setIsEditingBusiness(false);
                    }}
                    disabled={isSaving || !!ownerPhoneError}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBusiness(!isEditingBusiness)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  {isEditingBusiness ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Business Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditingBusiness}
                    className={`bg-gray-700 border-gray-600 text-white ${!isEditingBusiness ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Owner Email</Label>
                  <Input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    disabled={!isEditingBusiness}
                    className={`bg-gray-700 border-gray-600 text-white ${!isEditingBusiness ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Owner Phone</Label>
                  <Input
                    value={ownerPhone}
                    onChange={(e) => handleOwnerPhoneChange(e.target.value)}
                    placeholder="+972501234567"
                    disabled={!isEditingBusiness}
                    className={`bg-gray-700 border-gray-600 text-white ${ownerPhoneError ? "border-red-500 focus-visible:ring-red-500" : ""} ${!isEditingBusiness ? "opacity-70 cursor-not-allowed" : ""}`}
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
                    disabled={!isEditingBusiness}
                    className={`bg-gray-700 border-gray-600 text-white ${!isEditingBusiness ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>
              {business?.twilio_phone_number ? (
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-400">AI Phone Number:</span>
                    <span className="text-purple-400 font-mono">{business.twilio_phone_number}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-400 mb-3">No AI phone number configured yet.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsPortDialogOpen(true)}
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Port My Number
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Forwarding */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="h-5 w-5 text-purple-400" />
                  Call Forwarding
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Phone numbers to forward calls to before AI takes over
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditingForwarding && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSave();
                      setIsEditingForwarding(false);
                    }}
                    disabled={isSaving || !!forwardPhonesError}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingForwarding(!isEditingForwarding)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  {isEditingForwarding ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Forward to Phones (comma-separated)</Label>
                <Input
                  value={forwardPhones}
                  onChange={(e) => handleForwardPhonesChange(e.target.value)}
                  placeholder="+972501234567, +972509876543"
                  disabled={!isEditingForwarding}
                  className={`bg-gray-700 border-gray-600 text-white ${forwardPhonesError ? "border-red-500 focus-visible:ring-red-500" : ""} ${!isEditingForwarding ? "opacity-70 cursor-not-allowed" : ""}`}
                />
                {forwardPhonesError ? (
                  <p className="text-xs text-red-400">{forwardPhonesError}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Incoming calls will first try these numbers. If no answer, AI takes over.
                  </p>
                )}
              </div>
              {forwardPhones.trim() && !forwardPhonesError && business?.twilio_phone_number ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestForwardPhones}
                  disabled={isTestingForwardPhones}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  {isTestingForwardPhones ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Test Forward Phones
                </Button>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  {!business?.twilio_phone_number
                    ? "To test forward phones, first configure an AI phone number in your business setup."
                    : !forwardPhones.trim()
                      ? "Enter phone numbers above to enable testing."
                      : forwardPhonesError
                        ? "Fix the phone format errors above to enable testing."
                        : null}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Business Hours
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Set your operating hours for each day
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditingHours && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSave();
                      setIsEditingHours(false);
                    }}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingHours(!isEditingHours)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  {isEditingHours ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone} disabled={!isEditingHours}>
                  <SelectTrigger className={`bg-gray-700 border-gray-600 text-white ${!isEditingHours ? "opacity-70 cursor-not-allowed" : ""}`}>
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
                        disabled={!isEditingHours}
                      />
                      <span className={`text-sm text-gray-300 ${!isEditingHours ? "opacity-70" : ""}`}>{day.label.slice(0, 3)}</span>
                    </div>
                    {businessHours[day.key] ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={businessHours[day.key]?.start || "09:00"}
                          onChange={(e) => updateBusinessHours(day.key, "start", e.target.value)}
                          disabled={!isEditingHours}
                          className={`w-28 bg-gray-700 border-gray-600 text-white ${!isEditingHours ? "opacity-70 cursor-not-allowed" : ""}`}
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={businessHours[day.key]?.end || "18:00"}
                          onChange={(e) => updateBusinessHours(day.key, "end", e.target.value)}
                          disabled={!isEditingHours}
                          className={`w-28 bg-gray-700 border-gray-600 text-white ${!isEditingHours ? "opacity-70 cursor-not-allowed" : ""}`}
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
                    disabled={!isEditingHours}
                    className={`w-28 bg-gray-700 border-gray-600 text-white ${!isEditingHours ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    disabled={!isEditingHours}
                    className={`w-28 bg-gray-700 border-gray-600 text-white ${!isEditingHours ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-400" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">
                  How you want to receive alerts about inquiries and appointments
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditingNotifications && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSave();
                      setIsEditingNotifications(false);
                    }}
                    disabled={isSaving || !!notificationEmailError}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingNotifications(!isEditingNotifications)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  {isEditingNotifications ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">SMS Notifications</Label>
                  <p className="text-xs text-gray-500">Receive text messages for new inquiries</p>
                </div>
                <Switch checked={notifySms} onCheckedChange={setNotifySms} disabled={!isEditingNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive email summaries and alerts</p>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} disabled={!isEditingNotifications} />
              </div>
              
              <div className="pt-4 border-t border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Appointment Reminders</Label>
                    <p className="text-xs text-gray-500">Send SMS reminders before appointments</p>
                  </div>
                  <Switch 
                    checked={twilioSettings.enableAppointmentReminders ?? true} 
                    onCheckedChange={(checked) => setTwilioSettings(prev => ({ ...prev, enableAppointmentReminders: checked }))} 
                    disabled={!isEditingNotifications} 
                  />
                </div>
                
                {(twilioSettings.enableAppointmentReminders ?? true) && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Reminder Timing</Label>
                      <Select
                        value={twilioSettings.appointmentReminderTiming || "1_day"}
                        onValueChange={(value) => setTwilioSettings(prev => ({ 
                          ...prev, 
                          appointmentReminderTiming: value as 'same_day' | '1_day' | '2_days' 
                        }))}
                        disabled={!isEditingNotifications}
                      >
                        <SelectTrigger className={`w-full bg-gray-700 border-gray-600 text-white ${!isEditingNotifications ? "opacity-70 cursor-not-allowed" : ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="same_day" className="text-white hover:bg-gray-700">Same day (morning of appointment)</SelectItem>
                          <SelectItem value="1_day" className="text-white hover:bg-gray-700">1 day before</SelectItem>
                          <SelectItem value="2_days" className="text-white hover:bg-gray-700">2 days before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reminder-template" className="text-gray-300">
                        Custom Reminder Message
                      </Label>
                      <Textarea
                        id="reminder-template"
                        placeholder="Hi {name}! Reminder from {business}: You have an appointment for {service} tomorrow at {time}. Reply YES to confirm or CANCEL to cancel."
                        value={twilioSettings.appointmentReminderTemplate || ""}
                        onChange={(e) => setTwilioSettings(prev => ({ ...prev, appointmentReminderTemplate: e.target.value }))}
                        disabled={!isEditingNotifications}
                        className={`bg-gray-700 border-gray-600 text-white min-h-[80px] ${!isEditingNotifications ? "opacity-70 cursor-not-allowed" : ""}`}
                      />
                      <p className="text-xs text-gray-500">
                        Available placeholders: <code className="bg-gray-700 px-1 rounded">{"{name}"}</code> <code className="bg-gray-700 px-1 rounded">{"{business}"}</code> <code className="bg-gray-700 px-1 rounded">{"{service}"}</code> <code className="bg-gray-700 px-1 rounded">{"{time}"}</code> <code className="bg-gray-700 px-1 rounded">{"{date}"}</code>
                      </p>
                      
                      {/* Message Preview */}
                      <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-600">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          <span className="text-xs font-medium text-gray-400">Message Preview</span>
                        </div>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">
                          {(() => {
                            const template = twilioSettings.appointmentReminderTemplate || 
                              (primaryLanguage === "hebrew" 
                                ? "שלום {name}! תזכורת מ{business}: יש לך {service} מחר ב-{time}. השב \"כן\" לאישור או \"ביטול\" לביטול התור."
                                : "Hi {name}! Reminder from {business}: You have an {service} tomorrow at {time}. Reply YES to confirm or CANCEL to cancel.");
                            
                            const sampleData = {
                              name: primaryLanguage === "hebrew" ? "ישראל ישראלי" : "John Smith",
                              business: name || "Your Business",
                              service: primaryLanguage === "hebrew" ? "תספורת" : "Haircut",
                              time: primaryLanguage === "hebrew" ? "14:30" : "2:30 PM",
                              date: primaryLanguage === "hebrew" ? "יום שלישי, 15 בינואר" : "Tuesday, January 15"
                            };
                            
                            return template
                              .replace(/\{name\}/gi, sampleData.name)
                              .replace(/\{business\}/gi, sampleData.business)
                              .replace(/\{service\}/gi, sampleData.service)
                              .replace(/\{time\}/gi, sampleData.time)
                              .replace(/\{date\}/gi, sampleData.date);
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-700 space-y-2">
                <Label htmlFor="notification-email-from" className="text-gray-300">
                  Sender Email Address
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="notification-email-from"
                    type="email"
                    placeholder="notifications@yourdomain.com"
                    value={notificationEmailFrom}
                    onChange={(e) => handleNotificationEmailChange(e.target.value)}
                    disabled={!isEditingNotifications}
                    className={`bg-gray-700 border-gray-600 text-white flex-1 ${notificationEmailError ? 'border-red-500' : ''} ${!isEditingNotifications ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail || !ownerEmail || !!notificationEmailError}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 shrink-0 disabled:opacity-50"
                    title={!ownerEmail ? "Set an Owner Email in Business Information first" : notificationEmailError ? "Fix sender email format first" : "Send a test email to your owner email address"}
                  >
                    {isSendingTestEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-1" />
                        Test
                      </>
                    )}
                  </Button>
                </div>
                {notificationEmailError && (
                  <p className="text-xs text-red-400">{notificationEmailError}</p>
                )}
                <p className="text-xs text-gray-500">
                  Email address used to send port status notifications. Must be verified in your Resend account. 
                  If left empty, uses Resend default sender. Test sends to your owner email.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          {business && <GoogleCalendarSync businessId={business.id} />}

          {/* Appointment Templates */}
          {business && <AppointmentTemplateManager businessId={business.id} />}

          {/* Port Request Status */}
          {business && <PortRequestStatus businessId={business.id} onPortNumberClick={() => setIsPortDialogOpen(true)} />}

          {/* Business Team Members */}
          {business && <BusinessStaffManager businessId={business.id} />}
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-6">
          {/* AI Configuration */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  AI Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize how your AI assistant behaves
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditingAI && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSave();
                      setIsEditingAI(false);
                    }}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingAI(!isEditingAI)}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  {isEditingAI ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
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
                      disabled={!isEditingAI}
                      className={`w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600 ${!isEditingAI ? "opacity-70 cursor-not-allowed" : ""}`}
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
                          {isEditingAI && (
                            <button
                              type="button"
                              onClick={() => setAiLanguages(prev => prev.filter(l => l !== langValue))}
                              className="hover:text-white"
                            >
                              ×
                            </button>
                          )}
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
                    disabled={!isEditingAI}
                  >
                    <SelectTrigger className={`bg-gray-700 border-gray-600 text-white ${!isEditingAI ? "opacity-70 cursor-not-allowed" : ""}`}>
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
                  disabled={!isEditingAI}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Custom AI Instructions</Label>
                <Textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="Special instructions for the AI assistant..."
                  disabled={!isEditingAI}
                  className={`bg-gray-700 border-gray-600 text-white min-h-[100px] ${!isEditingAI ? "opacity-70 cursor-not-allowed" : ""}`}
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

          {/* Industry Template */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Industry Template
              </CardTitle>
              <CardDescription className="text-gray-400">
                Quick-start with industry-specific settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndustryTemplateSelector
                value={industryType}
                onChange={(industry, template) => {
                  setIndustryType(industry || "");
                  if (template) {
                    setAiPersonality(template.personality);
                    setCustomTools(template.defaultTools);
                    setGreetingMessages(template.greetings);
                    setKnowledgeBase({
                      faqs: template.sampleKnowledge.faqs,
                      policies: template.sampleKnowledge.policies,
                      pricing: [],
                      staff: [],
                    });
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* AI Personality */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                AI Personality
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize how your AI assistant communicates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AIPersonalitySettings
                personality={aiPersonality}
                onChange={setAiPersonality}
              />
              
              {/* Live Preview */}
              <div className="pt-4 border-t border-gray-700">
                <Label className="text-gray-300 mb-3 block">Live Response Preview</Label>
                <AIResponsePreview
                  businessName={name}
                  personality={aiPersonality}
                  knowledgeBase={knowledgeBase}
                  industryType={industryType}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Greetings */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" />
                Custom Greetings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Personalized messages for different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomGreetingsEditor
                greetings={greetingMessages}
                onChange={setGreetingMessages}
                businessName={name}
              />
            </CardContent>
          </Card>

          {/* Custom Tools */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-400" />
                AI Tools & Actions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable specific AI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomToolsToggle
                enabledTools={customTools}
                onChange={setCustomTools}
              />
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-400" />
                Knowledge Base
              </CardTitle>
              <CardDescription className="text-gray-400">
                FAQs, pricing, policies, and staff info for your AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeBaseEditor
                knowledgeBase={knowledgeBase}
                onChange={setKnowledgeBase}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-6">
          {/* AI Test Call */}
          {business && twilioSettings?.enableAiReceptionist && (
            <AITestCall
              businessId={business.id}
              businessName={name}
            />
          )}

          {/* API Status Dashboard - Admin Only */}
          {isAdmin && business && <APIStatusDashboard businessId={business.id} />}

          {/* Webhook URLs - Admin Only */}
          {isAdmin && <WebhookURLs />}

          {/* Debug Tools */}
          {business && (
            <DebugTools
              businessId={business.id}
              businessName={name}
              ownerPhone={ownerPhone}
              twilioPhoneNumber={business.twilio_phone_number}
            />
          )}

          {/* Data Export */}
          {business && <DataExport businessId={business.id} />}

          {/* Advanced Twilio Settings */}
          <TwilioAdvancedSettings
            settings={twilioSettings}
            onChange={setTwilioSettings}
            primaryLanguage={primaryLanguage}
          />

          {/* Admin Role Management - Admin Only */}
          {isAdmin && <AdminRoleManager />}
        </TabsContent>
      </Tabs>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>

      {/* Port Number Dialog - rendered outside conditionals so it's always available */}
      <PortNumberDialog 
        businessId={business?.id || ""} 
        onUpdate={fetchBusiness} 
        open={isPortDialogOpen} 
        onOpenChange={setIsPortDialogOpen}
        trigger={<span />}
      />
    </div>
  );
}
