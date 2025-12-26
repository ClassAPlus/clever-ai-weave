import { useState, useEffect, useCallback } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAppointmentConflictDetection } from "@/hooks/useAppointmentConflictDetection";
import { ConflictWarning } from "@/components/appointments/ConflictWarning";
import { DuplicateAppointmentDialog } from "@/components/appointments/DuplicateAppointmentDialog";
import { QuickReschedule } from "@/components/appointments/QuickReschedule";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Bell,
  Send,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  status: string | null;
  notes: string | null;
  confirmation_code: string | null;
  created_at: string | null;
  reminder_sent_at: string | null;
  reminder_response: string | null;
  reminder_response_at: string | null;
  contact: {
    id: string;
    name: string | null;
    phone_number: string;
  } | null;
}

interface AppointmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onAppointmentUpdated: () => void;
  businessId?: string;
}

export function AppointmentDetailsDialog({
  open,
  onOpenChange,
  appointment,
  onAppointmentUpdated,
  businessId,
}: AppointmentDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isQuickReschedule, setIsQuickReschedule] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");

  const { conflicts, checkConflicts, clearConflicts } = useAppointmentConflictDetection(businessId || "");

  // Check for conflicts when date, time, or duration changes in edit mode
  const triggerConflictCheck = useCallback(() => {
    if (!isEditing || !selectedDate || !appointment) return;
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);
    checkConflicts(scheduledAt, parseInt(duration), appointment.id);
    setConflictAcknowledged(false);
  }, [isEditing, selectedDate, time, duration, appointment, checkConflicts]);

  useEffect(() => {
    triggerConflictCheck();
  }, [triggerConflictCheck]);

  useEffect(() => {
    if (appointment && open) {
      const date = new Date(appointment.scheduled_at);
      setSelectedDate(date);
      setTime(format(date, "HH:mm"));
      setDuration(appointment.duration_minutes?.toString() || "60");
      setServiceType(appointment.service_type || "");
      setNotes(appointment.notes || "");
      setStatus(appointment.status || "pending");
      setIsEditing(false);
      setIsQuickReschedule(false);
      setConflictAcknowledged(false);
      clearConflicts();
    }
  }, [appointment, open, clearConflicts]);

  const handleSave = async () => {
    if (!appointment || !selectedDate) return;

    // Validate inputs
    if (serviceType.length > 100) {
      toast.error("Service type must be less than 100 characters");
      return;
    }
    if (notes.length > 1000) {
      toast.error("Notes must be less than 1000 characters");
      return;
    }

    setIsSaving(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: parseInt(duration),
          service_type: serviceType.trim() || null,
          notes: notes.trim() || null,
          status,
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Appointment updated!");
      setIsEditing(false);
      onAppointmentUpdated();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Appointment deleted");
      onOpenChange(false);
      onAppointmentUpdated();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointment.id);

      if (error) throw error;

      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
      onAppointmentUpdated();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const sendReminder = async () => {
    if (!appointment) return;

    setIsSendingReminder(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-appointment-reminder",
        {
          body: { appointmentId: appointment.id },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success("Reminder sent!");
        onAppointmentUpdated();
      } else {
        toast.error(data?.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder");
    } finally {
      setIsSendingReminder(false);
    }
  };

  const timeSlots = Array.from({ length: 28 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7;
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      confirmed: {
        className: "bg-green-500/20 text-green-300 border-green-500/30",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: "Confirmed",
      },
      completed: {
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: <CalendarCheck className="h-3 w-3 mr-1" />,
        label: "Completed",
      },
      cancelled: {
        className: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: <XCircle className="h-3 w-3 mr-1" />,
        label: "Cancelled",
      },
      pending: {
        className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        label: "Pending",
      },
    };

    const badge = badges[status] || badges.pending;
    return (
      <Badge className={badge.className}>
        {badge.icon}
        {badge.label}
      </Badge>
    );
  };

  if (!appointment) return null;

  const isPastAppointment = new Date(appointment.scheduled_at) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Appointment Details
            </span>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-white"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isEditing ? "Edit appointment details" : "View and manage this appointment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Conflict Warning when editing */}
          {isEditing && (
            <ConflictWarning
              conflicts={conflicts}
              acknowledged={conflictAcknowledged}
              onAcknowledge={() => setConflictAcknowledged(true)}
            />
          )}

          {/* Contact Info */}
          <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
            <div className="p-2 bg-purple-500/20 rounded-full">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">
                {appointment.contact?.name || "Unknown Contact"}
              </p>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {appointment.contact?.phone_number || "No phone"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-gray-300">Status</Label>
            {isEditing ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="pending" className="text-white hover:bg-gray-700">
                    Pending
                  </SelectItem>
                  <SelectItem value="confirmed" className="text-white hover:bg-gray-700">
                    Confirmed
                  </SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-gray-700">
                    Completed
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-white hover:bg-gray-700">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {getStatusBadge(status)}
                {status === "pending" && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                      onClick={() => handleStatusChange("confirmed")}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={() => handleStatusChange("cancelled")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CalendarCheck className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              {isEditing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      )}
                    >
                      {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="text-white">
                  {format(new Date(appointment.scheduled_at), "EEEE, MMM d, yyyy")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              {isEditing ? (
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                    {timeSlots.map((slot) => (
                      <SelectItem
                        key={slot}
                        value={slot}
                        className="text-white hover:bg-gray-700"
                      >
                        {format(
                          setMinutes(
                            setHours(new Date(), parseInt(slot.split(":")[0])),
                            parseInt(slot.split(":")[1])
                          ),
                          "h:mm a"
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white">
                  {format(new Date(appointment.scheduled_at), "h:mm a")}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-gray-300">Duration</Label>
            {isEditing ? (
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="15" className="text-white hover:bg-gray-700">
                    15 minutes
                  </SelectItem>
                  <SelectItem value="30" className="text-white hover:bg-gray-700">
                    30 minutes
                  </SelectItem>
                  <SelectItem value="45" className="text-white hover:bg-gray-700">
                    45 minutes
                  </SelectItem>
                  <SelectItem value="60" className="text-white hover:bg-gray-700">
                    1 hour
                  </SelectItem>
                  <SelectItem value="90" className="text-white hover:bg-gray-700">
                    1.5 hours
                  </SelectItem>
                  <SelectItem value="120" className="text-white hover:bg-gray-700">
                    2 hours
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-white">
                {appointment.duration_minutes} minutes
              </p>
            )}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label className="text-gray-300">Service Type</Label>
            {isEditing ? (
              <Input
                placeholder="e.g., Consultation, Haircut, Meeting..."
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                maxLength={100}
              />
            ) : (
              <p className="text-white">
                {appointment.service_type || (
                  <span className="text-gray-500">Not specified</span>
                )}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-gray-300">Notes</Label>
            {isEditing ? (
              <Textarea
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
                maxLength={1000}
              />
            ) : (
              <p className="text-white whitespace-pre-wrap">
                {appointment.notes || (
                  <span className="text-gray-500">No notes</span>
                )}
              </p>
            )}
          </div>

          {/* Quick Reschedule */}
          {isQuickReschedule && businessId && (
            <QuickReschedule
              appointmentId={appointment.id}
              businessId={businessId}
              currentScheduledAt={appointment.scheduled_at}
              duration={appointment.duration_minutes || 60}
              onRescheduled={() => {
                setIsQuickReschedule(false);
                onAppointmentUpdated();
              }}
              onCancel={() => setIsQuickReschedule(false)}
            />
          )}

          {/* Reminder Status */}
          {!isEditing && !isQuickReschedule && (
            <div className="p-3 bg-gray-700/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Reminder Status</span>
                {appointment.reminder_sent_at ? (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    <Bell className="h-3 w-3 mr-1" />
                    Sent {format(new Date(appointment.reminder_sent_at), "MMM d, h:mm a")}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                    Not sent
                  </Badge>
                )}
              </div>
              {appointment.reminder_response && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Customer Response</span>
                  <Badge
                    className={
                      appointment.reminder_response === "confirmed"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                    }
                  >
                    {appointment.reminder_response === "confirmed"
                      ? "Confirmed"
                      : "Cancelled"}
                  </Badge>
                </div>
              )}
              {!isPastAppointment &&
                status !== "completed" &&
                status !== "cancelled" && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                      onClick={() => setIsQuickReschedule(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Quick Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                      onClick={sendReminder}
                      disabled={isSendingReminder}
                    >
                      {isSendingReminder ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {appointment.reminder_sent_at ? "Resend" : "Remind"}
                    </Button>
                  </div>
                )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || (conflicts.length > 0 && !conflictAcknowledged)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : isQuickReschedule ? null : (
            <>
              <Button
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                onClick={() => setIsDuplicateOpen(true)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Delete Appointment?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This action cannot be undone. This will permanently delete
                      this appointment.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Duplicate Appointment Dialog */}
      {businessId && (
        <DuplicateAppointmentDialog
          open={isDuplicateOpen}
          onOpenChange={setIsDuplicateOpen}
          appointment={appointment ? {
            id: appointment.id,
            scheduled_at: appointment.scheduled_at,
            duration_minutes: appointment.duration_minutes,
            service_type: appointment.service_type,
            notes: appointment.notes,
            contact_id: appointment.contact?.id || null,
          } : null}
          businessId={businessId}
          onDuplicated={onAppointmentUpdated}
        />
      )}
    </Dialog>
  );
}
