import { useState, useEffect } from "react";
import { format, setHours, setMinutes, addDays, parseISO, addMinutes, areIntervalsOverlapping } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { VisualTimeSlotPicker } from "@/components/appointments/VisualTimeSlotPicker";
import { Calendar as CalendarIcon, Clock, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OriginalAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  notes: string | null;
  contact_id: string | null;
}

interface ExistingAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  contact?: {
    name: string | null;
    phone_number: string;
  } | null;
}

interface DuplicateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: OriginalAppointment | null;
  businessId: string;
  onDuplicated: () => void;
}

export function DuplicateAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  businessId,
  onDuplicated,
}: DuplicateAppointmentDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const duration = appointment?.duration_minutes || 60;

  useEffect(() => {
    if (open && appointment) {
      // Default to tomorrow at the same time
      const originalDate = parseISO(appointment.scheduled_at);
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
      setSelectedDate(tomorrow);
      setSelectedTime(format(originalDate, "HH:mm"));
    }
  }, [open, appointment]);

  useEffect(() => {
    if (selectedDate && businessId) {
      fetchExistingAppointments();
    }
  }, [selectedDate, businessId]);

  const fetchExistingAppointments = async () => {
    if (!selectedDate) return;

    setIsLoadingAppointments(true);
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration_minutes, status")
        .eq("business_id", businessId)
        .neq("status", "cancelled")
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString());

      if (error) throw error;
      setExistingAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const checkForConflict = (): boolean => {
    if (!selectedDate || !selectedTime) return false;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const newStart = setMinutes(setHours(selectedDate, hours), minutes);
    const newEnd = addMinutes(newStart, duration);

    return existingAppointments.some((apt) => {
      const aptStart = parseISO(apt.scheduled_at);
      const aptEnd = addMinutes(aptStart, apt.duration_minutes || 60);
      return areIntervalsOverlapping(
        { start: newStart, end: newEnd },
        { start: aptStart, end: aptEnd }
      );
    });
  };

  const handleDuplicate = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;

    setIsDuplicating(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, hours), minutes);

      const { error } = await supabase.from("appointments").insert({
        business_id: businessId,
        contact_id: appointment.contact_id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: appointment.duration_minutes,
        service_type: appointment.service_type,
        notes: appointment.notes,
        status: "pending",
      });

      if (error) throw error;

      toast.success(`Appointment duplicated to ${format(scheduledAt, "MMM d 'at' h:mm a")}`);
      onOpenChange(false);
      onDuplicated();
    } catch (error) {
      console.error("Error duplicating appointment:", error);
      toast.error("Failed to duplicate appointment");
    } finally {
      setIsDuplicating(false);
    }
  };

  const hasConflict = checkForConflict();

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-purple-400" />
            Duplicate Appointment
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a copy of this appointment at a new date and time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original appointment info */}
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Original appointment</p>
            <p className="text-sm text-white">
              {format(parseISO(appointment.scheduled_at), "EEEE, MMM d 'at' h:mm a")}
            </p>
            {appointment.service_type && (
              <p className="text-xs text-gray-400 mt-1">
                {appointment.service_type} • {duration} min
              </p>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              New Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  )}
                >
                  {selectedDate ? format(selectedDate, "EEEE, MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time picker */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              New Time
            </Label>
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : selectedDate ? (
              <VisualTimeSlotPicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
                duration={duration}
                existingAppointments={existingAppointments}
              />
            ) : (
              <p className="text-sm text-gray-400">Select a date first</p>
            )}
          </div>

          {/* Conflict warning */}
          {hasConflict && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ This time slot conflicts with an existing appointment
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={isDuplicating || !selectedDate || !selectedTime}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isDuplicating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Appointment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
