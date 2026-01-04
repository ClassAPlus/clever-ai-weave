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
  Zap
} from "lucide-react";
import { z } from "zod";

import { Json } from "@/integrations/supabase/types";

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
              </div>
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
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(business)}
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                          >
                            Configure
                          </Button>
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
      
      <Footer />
    </div>
  );
};

export default AdminVoiceflow;
