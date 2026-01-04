import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ShieldX,
  ArrowLeft,
  Bot,
  Building2,
  Save,
  CheckCircle2,
  XCircle,
  Search,
  Zap,
  FlaskConical,
  Phone,
  Send,
  RotateCcw,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { z } from "zod";

import { Json } from "@/integrations/supabase/types";

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Voiceflow ID validation schema
const voiceflowProjectIdSchema = z
  .string()
  .trim()
  .min(1, "Project ID is required")
  .max(100, "Project ID must be less than 100 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Project ID must only contain letters, numbers, hyphens, and underscores");

const voiceflowVersionIdSchema = z
  .string()
  .trim()
  .max(50, "Version ID must be less than 50 characters")
  .regex(/^[a-zA-Z0-9_-]*$/, "Version ID must only contain letters, numbers, hyphens, and underscores")
  .optional()
  .or(z.literal(""));

const voiceflowSettingsSchema = z.object({
  voiceflowProjectId: voiceflowProjectIdSchema,
  voiceflowVersionId: voiceflowVersionIdSchema,
});

// For individual edits where project ID can be empty (to clear config)
const voiceflowSettingsOptionalSchema = z.object({
  voiceflowProjectId: z
    .string()
    .trim()
    .max(100, "Project ID must be less than 100 characters")
    .regex(/^[a-zA-Z0-9_-]*$/, "Project ID must only contain letters, numbers, hyphens, and underscores"),
  voiceflowVersionId: voiceflowVersionIdSchema,
});

interface TwilioSettings {
  voiceflowProjectId?: string;
  voiceflowVersionId?: string;
  enableAiReceptionist?: boolean;
  [key: string]: unknown;
}

interface Business {
  id: string;
  name: string;
  owner_email: string | null;
  twilio_phone_number: string | null;
  twilio_settings: TwilioSettings | null;
}

interface SimulationMessage {
  role: "assistant" | "user";
  content: string;
}

const AdminVoiceflow = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBusiness, setEditingBusiness] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    voiceflowProjectId: "",
    voiceflowVersionId: ""
  });
  const [bulkForm, setBulkForm] = useState({
    voiceflowProjectId: "",
    voiceflowVersionId: ""
  });
  const [bulkSaving, setBulkSaving] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ businessId: string; success: boolean; message: string } | null>(null);
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkTestResults, setBulkTestResults] = useState<Map<string, { success: boolean; message: string }>>(new Map());
  const [showBulkTestSummary, setShowBulkTestSummary] = useState(false);
  
  // Call simulation state
  const [simulatingBusiness, setSimulatingBusiness] = useState<Business | null>(null);
  const [simulationSessionId, setSimulationSessionId] = useState<string | null>(null);
  const [simulationMessages, setSimulationMessages] = useState<SimulationMessage[]>([]);
  const [simulationInput, setSimulationInput] = useState("");
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [simulationButtons, setSimulationButtons] = useState<string[]>([]);
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Text-to-speech state
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);
  
  // Speak text using Web Speech API
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser"
      });
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };
  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser"
      });
      return;
    }
    
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSimulationInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'aborted') {
        toast({
          variant: "destructive",
          title: "Speech Error",
          description: `Could not recognize speech: ${event.error}`
        });
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
        
        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      }
      
      setCheckingRole(false);
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchBusinesses();
    }
  }, [isAdmin]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, owner_email, twilio_phone_number, twilio_settings')
        .order('name');

      if (error) throw error;
      setBusinesses((data || []).map(b => ({
        ...b,
        twilio_settings: b.twilio_settings as TwilioSettings | null
      })));
    } catch (err) {
      console.error('Error fetching businesses:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load businesses"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (business: Business) => {
    setEditingBusiness(business.id);
    setEditForm({
      voiceflowProjectId: business.twilio_settings?.voiceflowProjectId || "",
      voiceflowVersionId: business.twilio_settings?.voiceflowVersionId || ""
    });
  };

  const cancelEditing = () => {
    setEditingBusiness(null);
    setEditForm({ voiceflowProjectId: "", voiceflowVersionId: "" });
  };

  const saveVoiceflowSettings = async (businessId: string) => {
    // Validate with zod
    const validation = voiceflowSettingsOptionalSchema.safeParse(editForm);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid input";
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage
      });
      return;
    }

    setSaving(businessId);
    
    try {
      const business = businesses.find(b => b.id === businessId);
      if (!business) return;

      const updatedSettings = {
        ...(business.twilio_settings || {}),
        voiceflowProjectId: validation.data.voiceflowProjectId || null,
        voiceflowVersionId: validation.data.voiceflowVersionId || "production"
      };

      const { error } = await supabase
        .from('businesses')
        .update({ twilio_settings: updatedSettings })
        .eq('id', businessId);

      if (error) throw error;

      // Update local state
      setBusinesses(prev => prev.map(b => 
        b.id === businessId 
          ? { ...b, twilio_settings: updatedSettings }
          : b
      ));

      toast({
        title: "Saved",
        description: "Voiceflow settings updated successfully"
      });

      setEditingBusiness(null);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings"
      });
    } finally {
      setSaving(null);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.twilio_phone_number?.includes(searchQuery)
  );

  const handleBulkApplyClick = () => {
    // Validate with zod (bulk requires project ID)
    const validation = voiceflowSettingsSchema.safeParse(bulkForm);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid input";
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage
      });
      return;
    }
    setShowBulkConfirm(true);
  };

  const applyBulkSettings = async () => {
    // Re-validate before applying (client-side)
    const validation = voiceflowSettingsSchema.safeParse(bulkForm);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Invalid Voiceflow settings",
      });
      setShowBulkConfirm(false);
      return;
    }

    setShowBulkConfirm(false);
    setBulkSaving(true);

    try {
      const validatedData = voiceflowSettingsSchema.parse(bulkForm);

      const { data, error } = await supabase.functions.invoke("admin-voiceflow-settings", {
        body: {
          voiceflowProjectId: validatedData.voiceflowProjectId,
          voiceflowVersionId: validatedData.voiceflowVersionId || "production",
          applyToAll: true,
        },
      });

      if (error) throw error;

      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => ({
          ...b,
          twilio_settings: {
            ...(b.twilio_settings || {}),
            voiceflowProjectId: validatedData.voiceflowProjectId,
            voiceflowVersionId: validatedData.voiceflowVersionId || "production",
          },
        }))
      );

      toast({
        title: "Bulk Update Complete",
        description: `Updated ${data?.updated ?? businesses.length} businesses with new Voiceflow settings`,
      });

      setBulkForm({ voiceflowProjectId: "", voiceflowVersionId: "" });
    } catch (err) {
      console.error("Error applying bulk settings:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof z.ZodError
            ? err.errors[0]?.message || "Validation failed"
            : "Failed to apply bulk settings",
      });
    } finally {
      setBulkSaving(false);
    }
  };

  const testVoiceflowConfig = async (business: Business) => {
    const projectId = business.twilio_settings?.voiceflowProjectId;
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "No Project ID",
        description: "Configure a Voiceflow Project ID first",
      });
      return;
    }

    setTestingConfig(business.id);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("test-voiceflow-config", {
        body: {
          projectId,
          versionId: business.twilio_settings?.voiceflowVersionId || "production",
        },
      });

      if (error) throw error;

      setTestResult({
        businessId: business.id,
        success: data.success,
        message: data.success ? data.message : data.error,
      });

      toast({
        variant: data.success ? "default" : "destructive",
        title: data.success ? "Config Valid ✓" : "Config Invalid",
        description: data.success ? data.message : data.error,
      });
    } catch (err) {
      console.error("Test failed:", err);
      setTestResult({
        businessId: business.id,
        success: false,
        message: err instanceof Error ? err.message : "Test failed",
      });
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setTestingConfig(null);
    }
  };

  const testAllConfigs = async () => {
    const businessesWithConfig = businesses.filter(b => b.twilio_settings?.voiceflowProjectId);
    
    if (businessesWithConfig.length === 0) {
      toast({
        variant: "destructive",
        title: "No Configurations",
        description: "No businesses have Voiceflow Project IDs configured",
      });
      return;
    }

    setBulkTesting(true);
    setBulkTestResults(new Map());
    setShowBulkTestSummary(false);

    const results = new Map<string, { success: boolean; message: string }>();

    // Run all tests in parallel
    const testPromises = businessesWithConfig.map(async (business) => {
      try {
        const { data, error } = await supabase.functions.invoke("test-voiceflow-config", {
          body: {
            projectId: business.twilio_settings?.voiceflowProjectId,
            versionId: business.twilio_settings?.voiceflowVersionId || "production",
          },
        });

        if (error) throw error;

        results.set(business.id, {
          success: data.success,
          message: data.success ? data.message : data.error,
        });
      } catch (err) {
        results.set(business.id, {
          success: false,
          message: err instanceof Error ? err.message : "Test failed",
        });
      }
    });

    await Promise.all(testPromises);

    setBulkTestResults(results);
    setShowBulkTestSummary(true);
    setBulkTesting(false);

    const passCount = Array.from(results.values()).filter(r => r.success).length;
    const failCount = results.size - passCount;

    toast({
      variant: failCount > 0 ? "destructive" : "default",
      title: "Bulk Test Complete",
      description: `${passCount} passed, ${failCount} failed out of ${results.size} tested`,
    });
  };

  const bulkTestPassCount = Array.from(bulkTestResults.values()).filter(r => r.success).length;
  const bulkTestFailCount = bulkTestResults.size - bulkTestPassCount;

  // Call simulation functions
  const startSimulation = async (business: Business) => {
    if (!business.twilio_settings?.voiceflowProjectId) {
      toast({
        variant: "destructive",
        title: "No Configuration",
        description: "Configure Voiceflow Project ID first",
      });
      return;
    }

    setSimulatingBusiness(business);
    setSimulationSessionId(null);
    setSimulationMessages([]);
    setSimulationInput("");
    setSimulationEnded(false);
    setSimulationButtons([]);
    setSimulationLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("simulate-voiceflow-call", {
        body: {
          businessId: business.id,
          action: "launch",
        },
      });

      if (error) throw error;

      if (data.success) {
        setSimulationSessionId(data.sessionId);
        const turns = data.turns.map((t: { role: string; content: string }) => ({
          role: t.role,
          content: t.content,
        }));
        setSimulationMessages(turns);
        setSimulationEnded(data.hasEnded);
        setSimulationButtons(data.buttons || []);
        
        // Auto-speak assistant responses
        if (autoSpeak) {
          const assistantMessages = turns.filter((t: SimulationMessage) => t.role === "assistant");
          if (assistantMessages.length > 0) {
            const textToSpeak = assistantMessages.map((m: SimulationMessage) => m.content).join(". ");
            speakText(textToSpeak);
          }
        }
      } else {
        throw new Error(data.error || "Failed to start simulation");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      toast({
        variant: "destructive",
        title: "Simulation Failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setSimulatingBusiness(null);
    } finally {
      setSimulationLoading(false);
    }
  };

  const sendSimulationMessage = async (message?: string) => {
    const inputToSend = message || simulationInput.trim();
    if (!inputToSend || !simulatingBusiness || !simulationSessionId) return;

    // Add user message to chat
    setSimulationMessages(prev => [...prev, { role: "user", content: inputToSend }]);
    setSimulationInput("");
    setSimulationLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("simulate-voiceflow-call", {
        body: {
          businessId: simulatingBusiness.id,
          sessionId: simulationSessionId,
          userInput: inputToSend,
        },
      });

      if (error) throw error;

      if (data.success) {
        const newTurns = data.turns.map((t: { role: string; content: string }) => ({
          role: t.role as "assistant" | "user",
          content: t.content,
        }));
        setSimulationMessages(prev => [...prev, ...newTurns]);
        setSimulationEnded(data.hasEnded);
        setSimulationButtons(data.buttons || []);
        
        // Auto-speak assistant responses
        if (autoSpeak) {
          const assistantMessages = newTurns.filter((t: SimulationMessage) => t.role === "assistant");
          if (assistantMessages.length > 0) {
            const textToSpeak = assistantMessages.map((m: SimulationMessage) => m.content).join(". ");
            speakText(textToSpeak);
          }
        }
      } else {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send message",
      });
    } finally {
      setSimulationLoading(false);
    }
  };

  const resetSimulation = () => {
    if (simulatingBusiness) {
      startSimulation(simulatingBusiness);
    }
  };

  const closeSimulation = () => {
    stopSpeaking();
    setSimulatingBusiness(null);
    setSimulationSessionId(null);
    setSimulationMessages([]);
    setSimulationInput("");
    setSimulationEnded(false);
    setSimulationButtons([]);
  };

  // Loading state
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 w-full max-w-md text-center">
          <ShieldX className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-gray-300 mb-6">Please sign in to access this page.</p>
          <Button onClick={() => navigate("/auth")} className="bg-purple-600 hover:bg-purple-700 text-white">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 w-full max-w-md text-center">
          <ShieldX className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-6">You don't have admin privileges.</p>
          <Button onClick={() => navigate("/dashboard")} className="bg-purple-600 hover:bg-purple-700 text-white">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-8 w-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Voiceflow Configuration</h1>
            </div>
            <p className="text-gray-400">
              Configure Voiceflow AI settings for each business
            </p>
          </div>

          {/* Bulk Configuration */}
          <Card className="bg-purple-900/30 border-purple-500/30 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-purple-400" />
                Bulk Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Apply the same Voiceflow settings to all {businesses.length} businesses at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-gray-300">Voiceflow Project ID</Label>
                  <Input
                    value={bulkForm.voiceflowProjectId}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, voiceflowProjectId: e.target.value }))}
                    placeholder="Enter Project ID..."
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Version ID</Label>
                  <Input
                    value={bulkForm.voiceflowVersionId}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, voiceflowVersionId: e.target.value }))}
                    placeholder="production"
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApplyClick}
                    disabled={bulkSaving || businesses.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {bulkSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Apply to All ({businesses.length})
                  </Button>
                  <Button
                    onClick={testAllConfigs}
                    disabled={bulkTesting || businesses.length === 0}
                    variant="outline"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                  >
                    {bulkTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FlaskConical className="h-4 w-4 mr-2" />
                    )}
                    Test All
                  </Button>
                </div>
              </div>
              
              {/* Bulk Test Summary */}
              {showBulkTestSummary && bulkTestResults.size > 0 && (
                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Test Results Summary</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkTestSummary(false)}
                      className="text-gray-400 hover:text-white h-6 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-semibold">{bulkTestPassCount} Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span className="text-red-400 font-semibold">{bulkTestFailCount} Failed</span>
                    </div>
                    <span className="text-gray-400">
                      ({businesses.filter(b => !b.twilio_settings?.voiceflowProjectId).length} not configured)
                    </span>
                  </div>
                  {bulkTestFailCount > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-400 mb-2">Failed businesses:</p>
                      {businesses
                        .filter(b => bulkTestResults.get(b.id)?.success === false)
                        .map(b => (
                          <div key={b.id} className="text-sm text-red-300 flex items-start gap-2">
                            <span className="font-medium">{b.name}:</span>
                            <span className="text-red-400/80">{bulkTestResults.get(b.id)?.message}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Confirmation Dialog */}
          <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
            <AlertDialogContent className="bg-gray-900 border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Confirm Bulk Update</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  This will update Voiceflow settings for <span className="text-white font-semibold">{businesses.length} businesses</span>. 
                  Any existing configurations will be overwritten.
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg font-mono text-sm">
                    <div><span className="text-gray-500">Project ID:</span> <span className="text-purple-400">{bulkForm.voiceflowProjectId}</span></div>
                    <div><span className="text-gray-500">Version:</span> <span className="text-purple-400">{bulkForm.voiceflowVersionId || "production"}</span></div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={applyBulkSettings}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Yes, Apply to All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Business List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBusinesses.length === 0 ? (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No businesses found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredBusinesses.map((business) => (
                  <Card key={business.id} className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-purple-400" />
                            {business.name}
                          </CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            {business.owner_email || "No email"} 
                            {business.twilio_phone_number && ` • ${business.twilio_phone_number}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {business.twilio_settings?.enableAiReceptionist !== false ? (
                            <Badge variant="outline" className="text-green-400 border-green-400/50">
                              AI Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 border-gray-500">
                              AI Disabled
                            </Badge>
                          )}
                          {business.twilio_settings?.voiceflowProjectId ? (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Configured
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Configured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingBusiness === business.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-gray-300">Voiceflow Project ID</Label>
                              <Input
                                value={editForm.voiceflowProjectId}
                                onChange={(e) => setEditForm(prev => ({ ...prev, voiceflowProjectId: e.target.value }))}
                                placeholder="Enter Project ID..."
                                className="bg-gray-700 border-gray-600 text-white font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-gray-300">Version ID</Label>
                              <Input
                                value={editForm.voiceflowVersionId}
                                onChange={(e) => setEditForm(prev => ({ ...prev, voiceflowVersionId: e.target.value }))}
                                placeholder="production"
                                className="bg-gray-700 border-gray-600 text-white font-mono"
                              />
                              <p className="text-xs text-gray-500">Leave empty for "production"</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveVoiceflowSettings(business.id)}
                              disabled={saving === business.id}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {saving === business.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelEditing}
                              className="border-gray-600 text-gray-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">
                              <span className="text-gray-500">Project ID:</span>{" "}
                              <span className="font-mono text-gray-300">
                                {business.twilio_settings?.voiceflowProjectId || "—"}
                              </span>
                            </p>
                            <p className="text-sm text-gray-400">
                              <span className="text-gray-500">Version:</span>{" "}
                              <span className="font-mono text-gray-300">
                                {business.twilio_settings?.voiceflowVersionId || "production"}
                              </span>
                            </p>
                            {(testResult?.businessId === business.id || bulkTestResults.has(business.id)) && (
                              <p className={`text-sm font-medium ${
                                (testResult?.businessId === business.id ? testResult.success : bulkTestResults.get(business.id)?.success) 
                                  ? "text-green-400" : "text-red-400"
                              }`}>
                                {(testResult?.businessId === business.id ? testResult.success : bulkTestResults.get(business.id)?.success) ? "✓ " : "✗ "}
                                {testResult?.businessId === business.id 
                                  ? testResult.message 
                                  : bulkTestResults.get(business.id)?.message}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {business.twilio_settings?.voiceflowProjectId && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startSimulation(business)}
                                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Simulate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => testVoiceflowConfig(business)}
                                  disabled={testingConfig === business.id}
                                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                >
                                  {testingConfig === business.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FlaskConical className="h-4 w-4 mr-1" />
                                  )}
                                  Test
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(business)}
                              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                            >
                              Configure
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Call Simulation Dialog */}
      <Dialog open={!!simulatingBusiness} onOpenChange={(open) => !open && closeSimulation()}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-400" />
              Call Simulation - {simulatingBusiness?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Test the Voiceflow conversation without using phone minutes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-[300px] bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="space-y-3">
                {simulationMessages.length === 0 && !simulationLoading && (
                  <p className="text-gray-500 text-center text-sm">
                    Starting call simulation...
                  </p>
                )}
                
                {simulationMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.role === "assistant" && (
                          <Bot className="h-4 w-4 mt-0.5 text-purple-400 flex-shrink-0" />
                        )}
                        {msg.role === "user" && (
                          <User className="h-4 w-4 mt-0.5 text-blue-200 flex-shrink-0" />
                        )}
                        <p className="text-sm flex-1">{msg.content}</p>
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => speakText(msg.content)}
                            className="text-purple-400 hover:text-purple-300 flex-shrink-0 opacity-60 hover:opacity-100"
                            title="Play this message"
                          >
                            <Volume2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {simulationLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    </div>
                  </div>
                )}
                
                {simulationEnded && (
                  <div className="text-center text-sm text-gray-500 mt-4">
                    — Call ended —
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Quick Reply Buttons */}
            {simulationButtons.length > 0 && !simulationEnded && (
              <div className="flex flex-wrap gap-2">
                {simulationButtons.map((btn, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => sendSimulationMessage(btn)}
                    disabled={simulationLoading}
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                  >
                    {btn}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Input Area */}
            {!simulationEnded && (
              <div className="flex gap-2">
                <Input
                  value={simulationInput}
                  onChange={(e) => setSimulationInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Type or speak your response..."}
                  className="bg-gray-800 border-gray-600 text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendSimulationMessage();
                    }
                  }}
                  disabled={simulationLoading || isListening}
                />
                {speechSupported && (
                  <Button
                    onClick={toggleSpeechRecognition}
                    disabled={simulationLoading}
                    variant="outline"
                    className={`border-gray-600 ${
                      isListening 
                        ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  onClick={() => sendSimulationMessage()}
                  disabled={simulationLoading || !simulationInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSimulation}
                  disabled={simulationLoading}
                  className="border-gray-600 text-gray-300"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      setAutoSpeak(!autoSpeak);
                    }
                  }}
                  className={`border-gray-600 ${
                    isSpeaking 
                      ? "bg-purple-500/20 border-purple-500 text-purple-400" 
                      : autoSpeak 
                        ? "text-purple-400" 
                        : "text-gray-500"
                  }`}
                  title={isSpeaking ? "Stop speaking" : autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                Session: {simulationSessionId?.slice(0, 12)}...
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default AdminVoiceflow;
