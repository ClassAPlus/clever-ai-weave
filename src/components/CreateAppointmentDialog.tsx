import { useState, useEffect, useCallback } from "react";
import { format, setHours, setMinutes, addDays, addWeeks, addMonths, isBefore, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { useAppointmentConflictDetection } from "@/hooks/useAppointmentConflictDetection";
import { ConflictWarning } from "@/components/appointments/ConflictWarning";
import { VisualTimeSlotPicker } from "@/components/appointments/VisualTimeSlotPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Loader2, Plus, Phone, Repeat, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppointmentTemplate {
  id: string;
  name: string;
  service_type: string | null;
  duration_minutes: number;
  notes: string | null;
  default_recurrence_pattern: string | null;
  color: string | null;
  auto_confirm: boolean | null;
}

interface Contact {
  id: string;
  name: string | null;
  phone_number: string;
}

type RecurrencePattern = "none" | "daily" | "weekly" | "monthly";

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  businessId: string;
  onAppointmentCreated: () => void;
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  businessId,
  onAppointmentCreated,
}: CreateAppointmentDialogProps) {
  const { syncAppointment, syncMultipleAppointments } = useGoogleCalendarSync();
  const { isChecking, conflicts, checkConflicts, clearConflicts } = useAppointmentConflictDetection(businessId);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number | null;
    status: string | null;
    contact: { name: string | null; phone_number: string } | null;
  }>>([]);
  const [templates, setTemplates] = useState<AppointmentTemplate[]>([]);
  
  // Form state
  const [contactId, setContactId] = useState<string>("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  // Check for conflicts when time or duration changes
  const triggerConflictCheck = useCallback(() => {
    if (!open) return;
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);
    checkConflicts(scheduledAt, parseInt(duration));
    setConflictAcknowledged(false); // Reset acknowledgment when time/duration changes
  }, [open, time, duration, selectedDate, checkConflicts]);

  useEffect(() => {
    triggerConflictCheck();
  }, [triggerConflictCheck]);

  useEffect(() => {
    if (open && businessId) {
      fetchContacts();
      fetchExistingAppointments();
      fetchTemplates();
    }
  }, [open, businessId, selectedDate]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("appointment_templates")
        .select("id, name, service_type, duration_minutes, notes, default_recurrence_pattern, color, auto_confirm")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const applyTemplate = (template: AppointmentTemplate) => {
    setSelectedTemplateId(template.id);
    setDuration(template.duration_minutes.toString());
    setServiceType(template.service_type || "");
    setNotes(template.notes || "");
    setRecurrencePattern((template.default_recurrence_pattern || "none") as RecurrencePattern);
  };

  useEffect(() => {
    // Reset form when dialog opens
    if (open) {
      setContactId("");
      setNewContactName("");
      setNewContactPhone("");
      setTime("09:00");
      setDuration("60");
      setServiceType("");
      setNotes("");
      setShowNewContact(false);
      setRecurrencePattern("none");
      setRecurrenceEndDate(undefined);
      setConflictAcknowledged(false);
      setSelectedTemplateId(null);
      clearConflicts();
    }
  }, [open, clearConflicts]);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, phone_number")
        .eq("business_id", businessId)
        .order("name", { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchExistingAppointments = async () => {
    try {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          contacts (name, phone_number)
        `)
        .eq("business_id", businessId)
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;
      
      setExistingAppointments(
        (data || []).map(apt => ({
          id: apt.id,
          scheduled_at: apt.scheduled_at,
          duration_minutes: apt.duration_minutes,
          status: apt.status,
          contact: apt.contacts as { name: string | null; phone_number: string } | null,
        }))
      );
    } catch (error) {
      console.error("Error fetching existing appointments:", error);
    }
  };

  const createContact = async (): Promise<string | null> => {
    if (!newContactPhone.trim()) {
      toast.error("Phone number is required");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          business_id: businessId,
          name: newContactName.trim() || null,
          phone_number: newContactPhone.trim(),
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
      return null;
    }
  };

  const generateRecurringDates = (startDate: Date, pattern: RecurrencePattern, endDate: Date): Date[] => {
    const dates: Date[] = [startDate];
    let currentDate = startDate;

    while (true) {
      let nextDate: Date;
      switch (pattern) {
        case "daily":
          nextDate = addDays(currentDate, 1);
          break;
        case "weekly":
          nextDate = addWeeks(currentDate, 1);
          break;
        case "monthly":
          nextDate = addMonths(currentDate, 1);
          break;
        default:
          return dates;
      }

      if (isBefore(nextDate, endDate) || nextDate.toDateString() === endDate.toDateString()) {
        dates.push(nextDate);
        currentDate = nextDate;
      } else {
        break;
      }

      // Safety limit to prevent infinite loops
      if (dates.length >= 365) break;
    }

    return dates;
  };

  const handleSubmit = async () => {
    let finalContactId = contactId;

    // If creating new contact, create it first
    if (showNewContact) {
      const newId = await createContact();
      if (!newId) return;
      finalContactId = newId;
    }

    if (!finalContactId) {
      toast.error("Please select or create a contact");
      return;
    }

    if (recurrencePattern !== "none" && !recurrenceEndDate) {
      toast.error("Please select an end date for recurring appointments");
      return;
    }

    setIsCreating(true);
    try {
      // Parse time and combine with selected date
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      // Check if selected template has auto_confirm enabled
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      const appointmentStatus = selectedTemplate?.auto_confirm ? "confirmed" : "pending";

      if (recurrencePattern === "none") {
        // Single appointment
        const { data: newAppointment, error } = await supabase
          .from("appointments")
          .insert({
            business_id: businessId,
            contact_id: finalContactId,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: parseInt(duration),
            service_type: serviceType.trim() || null,
            notes: notes.trim() || null,
            status: appointmentStatus,
            recurrence_pattern: "none",
          })
          .select("id")
          .single();

        if (error) throw error;
        
        // Sync to Google Calendar in background
        if (newAppointment) {
          syncAppointment(newAppointment.id);
          
          // Send email notification for auto-confirmed appointments
          if (appointmentStatus === "confirmed" && selectedTemplate) {
            const contact = contacts.find(c => c.id === finalContactId);
            supabase.functions.invoke("send-auto-confirm-notification", {
              body: {
                appointmentId: newAppointment.id,
                businessId,
                contactName: showNewContact ? newContactName : (contact?.name || null),
                contactPhone: showNewContact ? newContactPhone : (contact?.phone_number || ""),
                scheduledAt: scheduledAt.toISOString(),
                serviceType: serviceType.trim() || undefined,
                templateName: selectedTemplate.name,
              },
            }).catch((err) => console.error("Failed to send auto-confirm notification:", err));
          }
        }
        
        toast.success(appointmentStatus === "confirmed" ? "Appointment created and confirmed!" : "Appointment created!");
      } else {
        // Recurring appointments
        const recurringDates = generateRecurringDates(scheduledAt, recurrencePattern, recurrenceEndDate!);
        
        // Create parent appointment first
        const { data: parentAppointment, error: parentError } = await supabase
          .from("appointments")
          .insert({
            business_id: businessId,
            contact_id: finalContactId,
            scheduled_at: recurringDates[0].toISOString(),
            duration_minutes: parseInt(duration),
            service_type: serviceType.trim() || null,
            notes: notes.trim() || null,
            status: appointmentStatus,
            recurrence_pattern: recurrencePattern,
            recurrence_end_date: recurrenceEndDate!.toISOString().split('T')[0],
          })
          .select("id")
          .single();

        if (parentError) throw parentError;

        const allAppointmentIds = [parentAppointment.id];

        // Create child appointments
        if (recurringDates.length > 1) {
          const childAppointments = recurringDates.slice(1).map(date => ({
            business_id: businessId,
            contact_id: finalContactId,
            scheduled_at: setMinutes(setHours(date, hours), minutes).toISOString(),
            duration_minutes: parseInt(duration),
            service_type: serviceType.trim() || null,
            notes: notes.trim() || null,
            status: appointmentStatus,
            recurrence_pattern: recurrencePattern,
            recurrence_end_date: recurrenceEndDate!.toISOString().split('T')[0],
            recurrence_parent_id: parentAppointment.id,
          }));

          const { data: childData, error: childError } = await supabase
            .from("appointments")
            .insert(childAppointments)
            .select("id");

          if (childError) throw childError;
          
          if (childData) {
            allAppointmentIds.push(...childData.map(c => c.id));
          }
        }

        // Sync all appointments to Google Calendar in background
        syncMultipleAppointments(allAppointmentIds);

        // Send email notification for auto-confirmed recurring appointments (for the first one)
        if (appointmentStatus === "confirmed" && selectedTemplate) {
          const contact = contacts.find(c => c.id === finalContactId);
          supabase.functions.invoke("send-auto-confirm-notification", {
            body: {
              appointmentId: parentAppointment.id,
              businessId,
              contactName: showNewContact ? newContactName : (contact?.name || null),
              contactPhone: showNewContact ? newContactPhone : (contact?.phone_number || ""),
              scheduledAt: recurringDates[0].toISOString(),
              serviceType: serviceType.trim() || undefined,
              templateName: `${selectedTemplate.name} (${recurringDates.length} recurring)`,
            },
          }).catch((err) => console.error("Failed to send auto-confirm notification:", err));
        }

        toast.success(
          appointmentStatus === "confirmed" 
            ? `Created and confirmed ${recurringDates.length} recurring appointments!`
            : `Created ${recurringDates.length} recurring appointments!`
        );
      }

      onAppointmentCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to create appointment");
    } finally {
      setIsCreating(false);
    }
  };

  const timeSlots = Array.from({ length: 28 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7; // Start at 7 AM
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  const getRecurrenceLabel = (pattern: RecurrencePattern) => {
    switch (pattern) {
      case "none": return "Does not repeat";
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-400" />
            New Appointment
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create an appointment for {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Quick Select */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Quick Templates
              </Label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Badge
                    key={template.id}
                    variant={selectedTemplateId === template.id ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedTemplateId === template.id
                        ? "bg-purple-600 text-white border-purple-500"
                        : "border-gray-600 text-gray-300 hover:border-purple-500 hover:bg-purple-500/20"
                    )}
                    style={{
                      borderLeftWidth: "3px",
                      borderLeftColor: template.color || "#8b5cf6",
                    }}
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                    <span className="ml-1 text-xs opacity-70">
                      ({template.duration_minutes}m)
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          <ConflictWarning 
            conflicts={conflicts} 
            acknowledged={conflictAcknowledged}
            onAcknowledge={() => setConflictAcknowledged(true)}
          />

          {/* Contact Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-purple-400 hover:text-purple-300"
                onClick={() => setShowNewContact(!showNewContact)}
              >
                {showNewContact ? "Select existing" : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    New contact
                  </>
                )}
              </Button>
            </Label>
            
            {showNewContact ? (
              <div className="space-y-2">
                <Input
                  placeholder="Contact name (optional)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Phone number *"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white pl-10"
                  />
                </div>
              </div>
            ) : (
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={isLoadingContacts ? "Loading..." : "Select a contact"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {contacts.map((contact) => (
                    <SelectItem
                      key={contact.id}
                      value={contact.id}
                      className="text-white hover:bg-gray-700"
                    >
                      {contact.name || contact.phone_number}
                      {contact.name && (
                        <span className="ml-2 text-gray-400 text-xs">
                          {contact.phone_number}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                  {contacts.length === 0 && !isLoadingContacts && (
                    <div className="p-2 text-sm text-gray-400 text-center">
                      No contacts found. Create a new one.
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Duration - moved before time picker so it affects the visual display */}
          <div className="space-y-2">
            <Label className="text-gray-300">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="15" className="text-white hover:bg-gray-700">15 minutes</SelectItem>
                <SelectItem value="30" className="text-white hover:bg-gray-700">30 minutes</SelectItem>
                <SelectItem value="45" className="text-white hover:bg-gray-700">45 minutes</SelectItem>
                <SelectItem value="60" className="text-white hover:bg-gray-700">1 hour</SelectItem>
                <SelectItem value="90" className="text-white hover:bg-gray-700">1.5 hours</SelectItem>
                <SelectItem value="120" className="text-white hover:bg-gray-700">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visual Time Slot Picker */}
          <VisualTimeSlotPicker
            selectedDate={selectedDate}
            selectedTime={time}
            duration={parseInt(duration)}
            existingAppointments={existingAppointments}
            onTimeSelect={setTime}
          />

          {/* Recurrence */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Repeat
            </Label>
            <Select value={recurrencePattern} onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="none" className="text-white hover:bg-gray-700">Does not repeat</SelectItem>
                <SelectItem value="daily" className="text-white hover:bg-gray-700">Daily</SelectItem>
                <SelectItem value="weekly" className="text-white hover:bg-gray-700">Weekly</SelectItem>
                <SelectItem value="monthly" className="text-white hover:bg-gray-700">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence End Date */}
          {recurrencePattern !== "none" && (
            <div className="space-y-2">
              <Label className="text-gray-300">Repeat until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                      !recurrenceEndDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={recurrenceEndDate}
                    onSelect={setRecurrenceEndDate}
                    disabled={(date) => isBefore(date, selectedDate)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {recurrenceEndDate && (
                <p className="text-xs text-gray-400">
                  This will create approximately {
                    generateRecurringDates(selectedDate, recurrencePattern, recurrenceEndDate).length
                  } appointments
                </p>
              )}
            </div>
          )}

          {/* Service Type */}
          <div className="space-y-2">
            <Label className="text-gray-300">Service Type (optional)</Label>
            <Input
              placeholder="e.g., Consultation, Haircut, Meeting..."
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-gray-300">Notes (optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isCreating || 
              (!contactId && !showNewContact) || 
              (showNewContact && !newContactPhone.trim()) || 
              (recurrencePattern !== "none" && !recurrenceEndDate) ||
              (conflicts.length > 0 && !conflictAcknowledged)
            }
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              recurrencePattern !== "none" ? "Create Series" : "Create Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
