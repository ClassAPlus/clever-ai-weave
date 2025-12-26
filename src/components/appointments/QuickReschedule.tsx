import { useState, useEffect } from "react";
import { format, addDays, setHours, setMinutes, parseISO, addMinutes, areIntervalsOverlapping, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExistingAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
}

interface QuickRescheduleProps {
  appointmentId: string;
  businessId: string;
  currentScheduledAt: string;
  duration: number;
  onRescheduled: () => void;
  onCancel: () => void;
}

const TIME_SLOTS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00"
];

export function QuickReschedule({
  appointmentId,
  businessId,
  currentScheduledAt,
  duration,
  onRescheduled,
  onCancel,
}: QuickRescheduleProps) {
  const [startDayOffset, setStartDayOffset] = useState(0);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const daysToShow = 5;
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(new Date(), startDayOffset + i));

  useEffect(() => {
    fetchAppointments();
  }, [businessId, startDayOffset]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    const startDate = days[0];
    const endDate = addDays(days[days.length - 1], 1);

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration_minutes")
        .eq("business_id", businessId)
        .neq("status", "cancelled")
        .gte("scheduled_at", startDate.toISOString())
        .lt("scheduled_at", endDate.toISOString());

      if (error) throw error;
      setExistingAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSlotBusy = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = setMinutes(setHours(date, hours), minutes);
    const slotEnd = addMinutes(slotStart, duration);

    return existingAppointments.some((apt) => {
      if (apt.id === appointmentId) return false;
      
      const aptStart = parseISO(apt.scheduled_at);
      const aptEnd = addMinutes(aptStart, apt.duration_minutes || 60);

      return areIntervalsOverlapping(
        { start: slotStart, end: slotEnd },
        { start: aptStart, end: aptEnd }
      );
    });
  };

  const isPastSlot = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotTime = setMinutes(setHours(date, hours), minutes);
    return slotTime < new Date();
  };

  const isCurrentSlot = (date: Date, time: string): boolean => {
    const currentDate = parseISO(currentScheduledAt);
    if (!isSameDay(date, currentDate)) return false;
    return format(currentDate, "HH:mm") === time;
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setIsRescheduling(true);
    try {
      const [hours, minutes] = selectedSlot.time.split(":").map(Number);
      const newScheduledAt = setMinutes(setHours(selectedSlot.date, hours), minutes);

      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: newScheduledAt.toISOString() })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success(`Rescheduled to ${format(newScheduledAt, "MMM d 'at' h:mm a")}`);
      onRescheduled();
    } catch (error) {
      console.error("Error rescheduling:", error);
      toast.error("Failed to reschedule appointment");
    } finally {
      setIsRescheduling(false);
    }
  };

  const getAvailableCount = (date: Date): number => {
    return TIME_SLOTS.filter((time) => !isSlotBusy(date, time) && !isPastSlot(date, time)).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Quick Reschedule
        </h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setStartDayOffset(Math.max(0, startDayOffset - daysToShow))}
            disabled={startDayOffset === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setStartDayOffset(startDayOffset + daysToShow)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-5 gap-1">
            {days.map((day, i) => {
              const availableCount = getAvailableCount(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  className={cn(
                    "text-center p-2 rounded-lg",
                    isToday && "bg-primary/10 border border-primary/20"
                  )}
                >
                  <p className="text-xs text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p className={cn(
                    "text-sm font-medium",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, "MMM d")}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1 py-0 mt-1",
                      availableCount > 10
                        ? "border-green-500/30 text-green-400"
                        : availableCount > 5
                        ? "border-yellow-500/30 text-yellow-400"
                        : "border-red-500/30 text-red-400"
                    )}
                  >
                    {availableCount} open
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Time slots grid */}
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="grid grid-cols-5 gap-1">
                  {days.map((day, dayIndex) => {
                    const isBusy = isSlotBusy(day, time);
                    const isPast = isPastSlot(day, time);
                    const isCurrent = isCurrentSlot(day, time);
                    const isSelected =
                      selectedSlot &&
                      isSameDay(selectedSlot.date, day) &&
                      selectedSlot.time === time;
                    const isDisabled = isBusy || isPast || isCurrent;

                    return (
                      <button
                        key={dayIndex}
                        disabled={isDisabled}
                        onClick={() => setSelectedSlot({ date: day, time })}
                        className={cn(
                          "text-xs py-1.5 px-1 rounded transition-colors",
                          isDisabled
                            ? "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-muted/50 text-foreground hover:bg-primary/20",
                          isCurrent && "ring-1 ring-primary/50 bg-primary/10"
                        )}
                      >
                        {dayIndex === 0 ? format(setHours(setMinutes(new Date(), 0), parseInt(time.split(":")[0])), "h:mm a").replace(":00", "") : (isCurrent ? "Now" : isBusy ? "•" : "✓")}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Selected slot summary */}
          {selectedSlot && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  {format(selectedSlot.date, "EEEE, MMM d")} at{" "}
                  {format(
                    setMinutes(
                      setHours(new Date(), parseInt(selectedSlot.time.split(":")[0])),
                      parseInt(selectedSlot.time.split(":")[1])
                    ),
                    "h:mm a"
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedSlot || isRescheduling}
              onClick={handleReschedule}
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
