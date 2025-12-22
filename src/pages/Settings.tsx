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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Bot, Clock, Bell, Phone, Save } from "lucide-react";
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

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [forwardPhones, setForwardPhones] = useState("");
  const [services, setServices] = useState("");
  const [aiLanguage, setAiLanguage] = useState("hebrew");
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
      setAiLanguage(data.ai_language || "hebrew");
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
          ai_language: aiLanguage,
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
        <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
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
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+972501234567"
                  className="bg-gray-700 border-gray-600 text-white"
                />
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
              <Label className="text-gray-300">AI Language</Label>
              <Select value={aiLanguage} onValueChange={setAiLanguage}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hebrew">עברית (Hebrew)</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="arabic">العربية (Arabic)</SelectItem>
                  <SelectItem value="russian">Русский (Russian)</SelectItem>
                  <SelectItem value="spanish">Español (Spanish)</SelectItem>
                  <SelectItem value="french">Français (French)</SelectItem>
                  <SelectItem value="german">Deutsch (German)</SelectItem>
                  <SelectItem value="portuguese">Português (Portuguese)</SelectItem>
                  <SelectItem value="italian">Italiano (Italian)</SelectItem>
                  <SelectItem value="dutch">Nederlands (Dutch)</SelectItem>
                  <SelectItem value="polish">Polski (Polish)</SelectItem>
                  <SelectItem value="turkish">Türkçe (Turkish)</SelectItem>
                  <SelectItem value="chinese">中文 (Chinese)</SelectItem>
                  <SelectItem value="japanese">日本語 (Japanese)</SelectItem>
                  <SelectItem value="korean">한국어 (Korean)</SelectItem>
                  <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="thai">ไทย (Thai)</SelectItem>
                  <SelectItem value="vietnamese">Tiếng Việt (Vietnamese)</SelectItem>
                </SelectContent>
              </Select>
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
                onChange={(e) => setForwardPhones(e.target.value)}
                placeholder="+972501234567, +972509876543"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500">
                Incoming calls will first try these numbers. If no answer, AI takes over.
              </p>
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
