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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, Copy, MessageSquare, Calendar, Gift, Bell, Users } from "lucide-react";

interface MessageTemplate {
  id: string;
  business_id: string;
  name: string;
  content: string;
  category: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "greeting", label: "Greeting", icon: MessageSquare },
  { value: "appointment", label: "Appointment", icon: Calendar },
  { value: "promotion", label: "Promotion", icon: Gift },
  { value: "reminder", label: "Reminder", icon: Bell },
  { value: "follow_up", label: "Follow Up", icon: Users },
];

const SAMPLE_TEMPLATES = [
  {
    name: "Welcome Message",
    category: "greeting",
    content: "שלום {name}! ברוכים הבאים ל{business_name}. איך אוכל לעזור?",
    variables: ["name", "business_name"],
  },
  {
    name: "Appointment Confirmation",
    category: "appointment",
    content: "התור שלך אושר ל{date} בשעה {time}. נתראה!",
    variables: ["date", "time"],
  },
  {
    name: "Appointment Reminder",
    category: "reminder",
    content: "תזכורת: יש לך תור מחר ב{time}. אם צריך לשנות, ספר לנו!",
    variables: ["time"],
  },
  {
    name: "Thank You",
    category: "follow_up",
    content: "תודה שביקרת אצלנו! נשמח לראות אותך שוב. יש לך שאלות? אנחנו כאן.",
    variables: [],
  },
  {
    name: "Special Offer",
    category: "promotion",
    content: "🎉 מבצע מיוחד! {offer}. תקף עד {expiry}. התקשר להזמנת תור!",
    variables: ["offer", "expiry"],
  },
];

export default function Templates() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("greeting");
  const [isActive, setIsActive] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      // First get business
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user?.id)
        .single();

      if (bizError) {
        if (bizError.code === "PGRST116") {
          navigate("/onboarding");
          return;
        }
        throw bizError;
      }

      setBusinessId(business.id);

      // Then get templates
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load templates",
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
      fetchTemplates();
    }
  }, [user, fetchTemplates]);

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{(\w+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  };

  const resetForm = () => {
    setName("");
    setContent("");
    setCategory("greeting");
    setIsActive(true);
    setEditingTemplate(null);
  };

  const openDialog = (template?: MessageTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setContent(template.content);
      setCategory(template.category || "greeting");
      setIsActive(template.is_active);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!businessId || !name || !content) return;

    setIsSaving(true);
    try {
      const variables = extractVariables(content);

      if (editingTemplate) {
        const { error } = await supabase
          .from("message_templates")
          .update({
            name,
            content,
            category,
            variables,
            is_active: isActive,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast({ title: "Template updated" });
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({
            business_id: businessId,
            name,
            content,
            category,
            variables,
            is_active: isActive,
          });

        if (error) throw error;
        toast({ title: "Template created" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save template",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Template deleted" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete template",
      });
    }
  };

  const handleAddSampleTemplates = async () => {
    if (!businessId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("message_templates")
        .insert(
          SAMPLE_TEMPLATES.map(t => ({
            business_id: businessId,
            name: t.name,
            content: t.content,
            category: t.category,
            variables: t.variables,
            is_active: true,
          }))
        );

      if (error) throw error;
      toast({ title: "Sample templates added" });
      fetchTemplates();
    } catch (error) {
      console.error("Error adding samples:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add sample templates",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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
          <h1 className="text-2xl font-bold text-white">Message Templates</h1>
          <p className="text-gray-400">Create reusable message templates with variables</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button
              variant="outline"
              onClick={handleAddSampleTemplates}
              disabled={isSaving}
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Sample Templates
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingTemplate ? "Edit Template" : "Create Template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Template Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome Message"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Message Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Use {variable} for dynamic content..."
                    className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    dir="auto"
                  />
                  <p className="text-xs text-gray-500">
                    Available variables: {"{name}"}, {"{business_name}"}, {"{date}"}, {"{time}"}, etc.
                  </p>
                </div>

                {content && extractVariables(content).length > 0 && (
                  <div className="p-2 bg-gray-900/50 rounded border border-gray-700">
                    <p className="text-xs text-gray-400">
                      <span className="text-purple-400">Variables detected:</span>{" "}
                      {extractVariables(content).map(v => (
                        <code key={v} className="bg-gray-700 px-1 rounded mx-1">{`{${v}}`}</code>
                      ))}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Active</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name || !content}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No templates yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create message templates to quickly send common responses
            </p>
            <Button
              onClick={handleAddSampleTemplates}
              disabled={isSaving}
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              Add Sample Templates
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const categoryInfo = CATEGORIES.find(c => c.value === template.category);
            const CategoryIcon = categoryInfo?.icon || MessageSquare;

            return (
              <Card
                key={template.id}
                className={`bg-gray-800/50 border-gray-700 ${!template.is_active ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <CategoryIcon className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {categoryInfo?.label || "Uncategorized"}
                        </CardDescription>
                      </div>
                    </div>
                    {!template.is_active && (
                      <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-300 line-clamp-3" dir="auto">
                    {template.content}
                  </p>

                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(v => (
                        <span
                          key={v}
                          className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded"
                        >
                          {`{${v}}`}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(template.content)}
                      className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(template)}
                      className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
