import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Bell,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_type: string | null;
  status: string | null;
  notes: string | null;
  reminder_sent_at: string | null;
  reminder_response: string | null;
  contact: {
    id: string;
    name: string | null;
    phone_number: string;
  } | null;
}

interface SelectableAppointmentProps {
  appointment: Appointment;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (appointment: Appointment) => void;
  compact?: boolean;
}

export function SelectableAppointment({
  appointment,
  isSelected,
  isSelectionMode,
  onSelect,
  onClick,
  compact = false,
}: SelectableAppointmentProps) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getReminderBadge = () => {
    if (!appointment.reminder_sent_at) return null;

    if (appointment.reminder_response === "confirmed") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          Customer Confirmed
        </Badge>
      );
    }

    if (appointment.reminder_response === "cancelled") {
      return (
        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          Customer Cancelled
        </Badge>
      );
    }

    return (
      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
        <Bell className="h-3 w-3 mr-1" />
        Reminder Sent
      </Badge>
    );
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelect(appointment.id, !isSelected);
    } else {
      onClick(appointment);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-2 p-3 bg-gray-700/30 rounded-lg transition-all cursor-pointer",
        "hover:bg-gray-700/50 hover:ring-1 hover:ring-purple-400",
        isSelected && "bg-purple-500/20 ring-1 ring-purple-500",
        compact && "text-xs"
      )}
      onClick={handleCardClick}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "flex-shrink-0 transition-all",
          isSelectionMode ? "opacity-100 w-6" : "opacity-0 w-0 overflow-hidden"
        )}
        onClick={handleCheckboxClick}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(appointment.id, !!checked)}
          className="border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={cn("font-medium text-white", compact && "text-xs truncate")}>
            {appointment.contact?.name || appointment.contact?.phone_number || "Unknown"}
          </span>
          {!compact && getStatusBadge(appointment.status)}
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(appointment.scheduled_at), "h:mm a")}</span>
          {appointment.duration_minutes && <span>({appointment.duration_minutes}m)</span>}
        </div>
        {appointment.service_type && (
          <Badge variant="outline" className="border-gray-600 text-gray-300 mt-2 w-fit text-xs">
            {appointment.service_type}
          </Badge>
        )}
        {!compact && <div className="flex items-center gap-2 mt-2 flex-wrap">{getReminderBadge()}</div>}
        {compact && (
          <div
            className={cn(
              "mt-1 h-1 rounded-full",
              appointment.status === "confirmed"
                ? "bg-green-500"
                : appointment.status === "cancelled"
                ? "bg-red-500"
                : appointment.status === "completed"
                ? "bg-blue-500"
                : "bg-yellow-500"
            )}
          />
        )}
      </div>
    </div>
  );
}
