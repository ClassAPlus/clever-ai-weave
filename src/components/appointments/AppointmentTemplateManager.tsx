import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Clock, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AppointmentTemplate {
  id: string;
  name: string;
  service_type: string | null;
  duration_minutes: number;
  notes: string | null;
  default_recurrence_pattern: string | null;
  is_active: boolean | null;
  color: string | null;
}

interface AppointmentTemplateManagerProps {
  businessId: string;
}

export function AppointmentTemplateManager({ businessId }: AppointmentTemplateManagerProps) {
  const [templates, setTemplates] = useState<AppointmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AppointmentTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    service_type: "",
    duration_minutes: 60,
    notes: "",
    default_recurrence_pattern: "none",
    color: "#8b5cf6",
  });

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("appointment_templates")
        .select("*")
        .eq("business_id", businessId)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [businessId]);

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      service_type: "",
      duration_minutes: 60,
      notes: "",
      default_recurrence_pattern: "none",
      color: "#8b5cf6",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (template: AppointmentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      service_type: template.service_type || "",
      duration_minutes: template.duration_minutes,
      notes: template.notes || "",
      default_recurrence_pattern: template.default_recurrence_pattern || "none",
      color: template.color || "#8b5cf6",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("appointment_templates")
          .update({
            name: formData.name,
            service_type: formData.service_type || null,
            duration_minutes: formData.duration_minutes,
            notes: formData.notes || null,
            default_recurrence_pattern: formData.default_recurrence_pattern,
            color: formData.color,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated");
      } else {
        const { error } = await supabase
          .from("appointment_templates")
          .insert({
            business_id: businessId,
            name: formData.name,
            service_type: formData.service_type || null,
            duration_minutes: formData.duration_minutes,
            notes: formData.notes || null,
            default_recurrence_pattern: formData.default_recurrence_pattern,
            color: formData.color,
          });

        if (error) throw error;
        toast.success("Template created");
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (template: AppointmentTemplate) => {
    try {
      const { error } = await supabase
        .from("appointment_templates")
        .update({ is_active: !template.is_active })
        .eq("id", template.id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error("Error toggling template:", error);
      toast.error("Failed to update template");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("appointment_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const colorOptions = [
    { value: "#8b5cf6", label: "Purple" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#10b981", label: "Green" },
    { value: "#f59e0b", label: "Amber" },
    { value: "#ef4444", label: "Red" },
    { value: "#ec4899", label: "Pink" },
    { value: "#6366f1", label: "Indigo" },
    { value: "#14b8a6", label: "Teal" },
  ];

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Appointment Templates
          </CardTitle>
          <Button onClick={openCreateDialog} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No templates yet. Create one to quickly schedule common appointment types.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.color || "#8b5cf6" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{template.name}</span>
                        {!template.is_active && (
                          <Badge variant="outline" className="text-gray-400 border-gray-500 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.duration_minutes} min
                        </span>
                        {template.service_type && (
                          <Badge variant="outline" className="text-xs border-gray-600">
                            {template.service_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active ?? true}
                      onCheckedChange={() => handleToggleActive(template)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update this appointment template"
                : "Create a reusable template for quick scheduling"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Consultation"
              />
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Input
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder="e.g., Consultation, Follow-up"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select
                  value={formData.duration_minutes.toString()}
                  onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(v) => setFormData({ ...formData, color: v })}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: formData.color }}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Recurrence</Label>
              <Select
                value={formData.default_recurrence_pattern}
                onValueChange={(v) => setFormData({ ...formData, default_recurrence_pattern: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recurrence</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any default notes for this appointment type..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
