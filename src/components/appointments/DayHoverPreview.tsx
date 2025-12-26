import { format, parseISO } from "date-fns";
import { Clock, User, Calendar } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface DayHoverPreviewProps {
  day: Date;
  appointments: Appointment[];
  children: React.ReactNode;
}

export function DayHoverPreview({ day, appointments, children }: DayHoverPreviewProps) {
  const dayAppointments = appointments
    .filter(apt => apt.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  if (dayAppointments.length === 0) {
    return <>{children}</>;
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-500",
    completed: "bg-blue-500",
    pending: "bg-amber-500",
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start"
        className="w-72 p-0 bg-gray-800 border-gray-700"
      >
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-white">
              {format(day, "EEEE, MMM d")}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {dayAppointments.length} appointment{dayAppointments.length !== 1 ? "s" : ""}
          </p>
        </div>
        
        <ScrollArea className="max-h-[240px]">
          <div className="p-2 space-y-2">
            {dayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div 
                    className={`w-1 h-full min-h-[32px] rounded-full flex-shrink-0 ${
                      statusColors[apt.status || "pending"] || statusColors.pending
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-white">
                        {format(parseISO(apt.scheduled_at), "h:mm a")}
                      </span>
                      {apt.duration_minutes && (
                        <span className="text-xs text-gray-500">
                          ({apt.duration_minutes}m)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate">
                        {apt.contact?.name || apt.contact?.phone_number || "Unknown"}
                      </span>
                    </div>
                    {apt.service_type && (
                      <Badge 
                        variant="outline" 
                        className="mt-1.5 text-[10px] border-gray-600 text-gray-400"
                      >
                        {apt.service_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t border-gray-700">
          <p className="text-[10px] text-gray-500 text-center">
            Click to view full day or add appointment
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
