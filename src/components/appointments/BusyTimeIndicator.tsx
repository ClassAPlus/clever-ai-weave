import { useMemo } from "react";
import { format, parseISO, addMinutes, getHours, getMinutes, isSameDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  status: string | null;
  contact: {
    id: string;
    name: string | null;
    phone_number: string;
  } | null;
}

interface BusyTimeIndicatorProps {
  day: Date;
  appointments: Appointment[];
  startHour?: number;
  endHour?: number;
}

export function BusyTimeIndicator({ 
  day, 
  appointments, 
  startHour = 7, 
  endHour = 21 
}: BusyTimeIndicatorProps) {
  const dayAppointments = appointments.filter(apt => 
    isSameDay(parseISO(apt.scheduled_at), day) && 
    apt.status !== "cancelled"
  );

  const busySlots = useMemo(() => {
    const totalMinutes = (endHour - startHour) * 60;
    
    return dayAppointments.map(apt => {
      const aptStart = parseISO(apt.scheduled_at);
      const aptHour = getHours(aptStart);
      const aptMinute = getMinutes(aptStart);
      const duration = apt.duration_minutes || 60;
      
      // Calculate position as percentage
      const startMinutesFromBeginning = (aptHour - startHour) * 60 + aptMinute;
      const leftPercent = Math.max(0, (startMinutesFromBeginning / totalMinutes) * 100);
      const widthPercent = Math.min((duration / totalMinutes) * 100, 100 - leftPercent);
      
      return {
        id: apt.id,
        left: leftPercent,
        width: widthPercent,
        appointment: apt,
        time: format(aptStart, "h:mm a"),
        endTime: format(addMinutes(aptStart, duration), "h:mm a"),
      };
    }).filter(slot => slot.left >= 0 && slot.left < 100);
  }, [dayAppointments, startHour, endHour]);

  if (busySlots.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="relative h-2 bg-gray-700/50 rounded-full overflow-hidden mt-1">
        {/* Hour markers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: endHour - startHour }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 border-r border-gray-600/30 last:border-r-0"
            />
          ))}
        </div>
        
        {/* Busy slots */}
        {busySlots.map(slot => (
          <Tooltip key={slot.id}>
            <TooltipTrigger asChild>
              <div
                className={`absolute top-0 h-full rounded-sm cursor-pointer transition-all hover:brightness-125 ${
                  slot.appointment.status === "confirmed" 
                    ? "bg-green-500" 
                    : slot.appointment.status === "completed"
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{
                  left: `${slot.left}%`,
                  width: `${Math.max(slot.width, 2)}%`,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-800 border-gray-700">
              <div className="text-xs">
                <p className="font-medium">
                  {slot.appointment.contact?.name || slot.appointment.contact?.phone_number || "Unknown"}
                </p>
                <p className="text-gray-400">
                  {slot.time} - {slot.endTime}
                </p>
                {slot.appointment.service_type && (
                  <p className="text-purple-400">{slot.appointment.service_type}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

interface BusyHourIndicatorProps {
  hour: number;
  appointments: Appointment[];
  currentDate: Date;
}

export function BusyHourIndicator({ hour, appointments, currentDate }: BusyHourIndicatorProps) {
  const busyMinutes = useMemo(() => {
    let totalBusy = 0;
    
    appointments.forEach(apt => {
      if (apt.status === "cancelled") return;
      
      const aptStart = parseISO(apt.scheduled_at);
      const aptHour = getHours(aptStart);
      const aptMinute = getMinutes(aptStart);
      const duration = apt.duration_minutes || 60;
      const aptEndMinute = aptMinute + duration;
      
      // Check if this appointment overlaps with this hour
      if (aptHour === hour) {
        // Appointment starts in this hour
        totalBusy += Math.min(60 - aptMinute, duration);
      } else if (aptHour < hour) {
        // Check if appointment extends into this hour
        const minutesFromStart = (hour - aptHour) * 60 - aptMinute;
        if (minutesFromStart < duration) {
          totalBusy += Math.min(60, duration - minutesFromStart);
        }
      }
    });
    
    return Math.min(totalBusy, 60);
  }, [hour, appointments]);

  if (busyMinutes === 0) return null;

  const busyPercent = (busyMinutes / 60) * 100;
  
  return (
    <div 
      className="absolute left-0 top-0 bottom-0 pointer-events-none"
      style={{ width: `${busyPercent}%` }}
    >
      <div className={`h-full ${
        busyPercent >= 80 ? 'bg-red-500/20' : 
        busyPercent >= 50 ? 'bg-amber-500/15' : 
        'bg-purple-500/10'
      }`} />
    </div>
  );
}

interface DayBusyBadgeProps {
  appointments: Appointment[];
}

export function DayBusyBadge({ appointments }: DayBusyBadgeProps) {
  const activeAppointments = appointments.filter(apt => apt.status !== "cancelled");
  
  if (activeAppointments.length === 0) return null;

  // Calculate total busy time
  const totalMinutes = activeAppointments.reduce((sum, apt) => 
    sum + (apt.duration_minutes || 60), 0
  );
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let busyLevel: "low" | "medium" | "high" = "low";
  if (totalMinutes >= 360) busyLevel = "high"; // 6+ hours
  else if (totalMinutes >= 180) busyLevel = "medium"; // 3+ hours
  
  const colors = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[busyLevel]}`}>
            <span>{activeAppointments.length}</span>
            <span className="opacity-70">appts</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-800 border-gray-700">
          <p className="text-xs">
            {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m`} scheduled
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
