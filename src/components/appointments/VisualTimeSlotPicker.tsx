import { useMemo } from "react";
import { format, setHours, setMinutes, parseISO, addMinutes, areIntervalsOverlapping } from "date-fns";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  contact?: {
    name: string | null;
    phone_number: string;
  } | null;
}

interface VisualTimeSlotPickerProps {
  selectedDate: Date;
  selectedTime: string;
  duration: number;
  existingAppointments: Appointment[];
  onTimeSelect: (time: string) => void;
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

export function VisualTimeSlotPicker({
  selectedDate,
  selectedTime,
  duration,
  existingAppointments,
  onTimeSelect,
  startHour = 7,
  endHour = 21,
  intervalMinutes = 30,
}: VisualTimeSlotPickerProps) {
  const timeSlots = useMemo(() => {
    const slots: { time: string; label: string; hour: number; minute: number }[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const slotDate = setMinutes(setHours(selectedDate, hour), minute);
        slots.push({
          time: timeStr,
          label: format(slotDate, "h:mm a"),
          hour,
          minute,
        });
      }
    }
    
    return slots;
  }, [selectedDate, startHour, endHour, intervalMinutes]);

  const getSlotStatus = useMemo(() => {
    return (time: string): { status: "available" | "busy" | "partial"; conflictWith?: Appointment[] } => {
      const [hours, minutes] = time.split(":").map(Number);
      const slotStart = setMinutes(setHours(selectedDate, hours), minutes);
      const slotEnd = addMinutes(slotStart, duration);

      const conflicts = existingAppointments.filter(apt => {
        if (apt.status === "cancelled") return false;
        
        const aptStart = parseISO(apt.scheduled_at);
        const aptEnd = addMinutes(aptStart, apt.duration_minutes || 60);

        return areIntervalsOverlapping(
          { start: slotStart, end: slotEnd },
          { start: aptStart, end: aptEnd }
        );
      });

      if (conflicts.length === 0) {
        return { status: "available" };
      }

      // Check if slot is fully covered or partially
      const totalConflictMinutes = conflicts.reduce((sum, apt) => sum + (apt.duration_minutes || 60), 0);
      if (totalConflictMinutes >= duration) {
        return { status: "busy", conflictWith: conflicts };
      }

      return { status: "partial", conflictWith: conflicts };
    };
  }, [selectedDate, duration, existingAppointments]);

  // Group slots by hour for better visual organization
  const slotsByHour = useMemo(() => {
    const grouped: Record<number, typeof timeSlots> = {};
    timeSlots.forEach(slot => {
      if (!grouped[slot.hour]) {
        grouped[slot.hour] = [];
      }
      grouped[slot.hour].push(slot);
    });
    return grouped;
  }, [timeSlots]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Clock className="h-4 w-4" />
        <span>Select a time slot</span>
        <div className="flex items-center gap-3 ml-auto text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
            <span>Busy</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[200px] rounded-lg border border-gray-700 bg-gray-900/50">
        <TooltipProvider>
          <div className="p-2 space-y-2">
            {Object.entries(slotsByHour).map(([hour, slots]) => (
              <div key={hour} className="flex items-center gap-2">
                <div className="w-12 text-xs text-gray-500 text-right flex-shrink-0">
                  {format(setHours(new Date(), parseInt(hour)), "h a")}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {slots.map(slot => {
                    const { status, conflictWith } = getSlotStatus(slot.time);
                    const isSelected = selectedTime === slot.time;

                    return (
                      <Tooltip key={slot.time}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onTimeSelect(slot.time)}
                            className={cn(
                              "relative px-2 py-1 text-xs rounded transition-all",
                              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:ring-offset-gray-900",
                              isSelected && "ring-2 ring-purple-500",
                              status === "available" && !isSelected && "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30",
                              status === "partial" && !isSelected && "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30",
                              status === "busy" && !isSelected && "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30",
                              isSelected && "bg-purple-600 text-white border border-purple-500"
                            )}
                          >
                            {slot.minute === 0 ? format(setHours(new Date(), slot.hour), "h") : `:${slot.minute.toString().padStart(2, "0")}`}
                            {isSelected && (
                              <Check className="absolute -top-1 -right-1 h-3 w-3 bg-purple-600 rounded-full p-0.5" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 border-gray-700 max-w-[200px]">
                          <div className="text-xs">
                            <p className="font-medium">{slot.label}</p>
                            {status === "available" && (
                              <p className="text-green-400">Available</p>
                            )}
                            {(status === "busy" || status === "partial") && conflictWith && (
                              <div className="mt-1 text-gray-400">
                                <p className={status === "busy" ? "text-red-400" : "text-amber-400"}>
                                  {status === "busy" ? "Conflicts with:" : "May overlap with:"}
                                </p>
                                {conflictWith.slice(0, 2).map(apt => (
                                  <p key={apt.id} className="truncate">
                                    {format(parseISO(apt.scheduled_at), "h:mm a")} - {apt.contact?.name || "Unknown"}
                                  </p>
                                ))}
                                {conflictWith.length > 2 && (
                                  <p>+{conflictWith.length - 2} more</p>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
}
