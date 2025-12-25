import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Clock, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface DraggableAppointmentProps {
  appointment: Appointment;
  compact?: boolean;
}

export function DraggableAppointment({ appointment, compact = false }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: {
      appointment,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const statusColors = {
    confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };

  const statusColor = statusColors[appointment.status as keyof typeof statusColors] || statusColors.pending;

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`text-xs p-1.5 rounded cursor-grab active:cursor-grabbing select-none ${statusColor} ${
          isDragging ? 'shadow-lg ring-2 ring-purple-500' : ''
        }`}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 opacity-50 flex-shrink-0" />
          <div className="truncate flex-1">
            <span className="font-medium">
              {format(new Date(appointment.scheduled_at), "h:mm a")}
            </span>
            <span className="mx-1">-</span>
            <span>{appointment.contact?.name || "Unknown"}</span>
          </div>
        </div>
        {appointment.service_type && (
          <div className="text-[10px] opacity-75 mt-0.5 truncate pl-4">
            {appointment.service_type}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col p-3 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all ${statusColor} ${
        isDragging ? 'shadow-xl ring-2 ring-purple-500' : 'hover:ring-1 hover:ring-gray-500'
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-2 mb-1">
        <GripVertical className="h-4 w-4 opacity-50 flex-shrink-0" />
        <span className="font-medium text-white truncate">
          {appointment.contact?.name || appointment.contact?.phone_number || "Unknown"}
        </span>
      </div>
      <div className="flex items-center gap-2 text-gray-400 pl-6">
        <Clock className="h-3 w-3" />
        <span>{format(new Date(appointment.scheduled_at), "h:mm a")}</span>
        {appointment.duration_minutes && <span>({appointment.duration_minutes}m)</span>}
      </div>
      {appointment.service_type && (
        <Badge variant="outline" className="border-gray-600 text-gray-300 mt-2 w-fit text-xs ml-6">
          {appointment.service_type}
        </Badge>
      )}
    </div>
  );
}
