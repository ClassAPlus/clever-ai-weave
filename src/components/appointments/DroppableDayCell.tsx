import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Plus, Ban, Clock } from "lucide-react";
import { ReactNode } from "react";

interface DroppableDayCellProps {
  day: Date;
  isCurrentDay?: boolean;
  isCurrentMonth?: boolean;
  isClosed?: boolean;
  businessHours?: { start: string; end: string } | null;
  children: ReactNode;
  onClick?: () => void;
  variant?: "week" | "month";
}

// Format time from 24h to 12h format (e.g., "09:00" -> "9a", "18:00" -> "6p")
function formatBusinessTime(time: string): string {
  const [hourStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

export function DroppableDayCell({
  day,
  isCurrentDay = false,
  isCurrentMonth = true,
  isClosed = false,
  businessHours,
  children,
  onClick,
  variant = "week",
}: DroppableDayCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${day.toISOString()}`,
    data: {
      day,
    },
  });

  const hoursLabel = businessHours
    ? `${formatBusinessTime(businessHours.start)}–${formatBusinessTime(businessHours.end)}`
    : null;

  if (variant === "month") {
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[100px] p-1 border-b border-r border-gray-700 cursor-pointer transition-all relative ${
          !isCurrentMonth ? "bg-gray-900/50" : ""
        } ${isCurrentDay ? "bg-purple-500/10" : ""} ${
          isClosed ? "bg-red-950/30" : ""
        } ${
          isOver ? "bg-purple-500/30 ring-2 ring-purple-500 ring-inset" : "hover:bg-gray-700/30"
        }`}
        onClick={onClick}
      >
        {/* Closed indicator */}
        {isClosed && (
          <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 bg-red-500/20 rounded text-[10px] text-red-400 border border-red-500/30">
            <Ban className="h-2.5 w-2.5" />
            <span>Closed</span>
          </div>
        )}
        
        <div
          className={`text-sm font-medium mb-1 flex items-center justify-between ${
            isCurrentDay
              ? "text-purple-300"
              : isCurrentMonth
              ? "text-white"
              : "text-gray-600"
          } ${isClosed ? "text-red-300/70" : ""}`}
        >
          <div className="flex items-center gap-1">
            <span>{format(day, "d")}</span>
            {hoursLabel && !isClosed && (
              <span className="text-[9px] text-gray-500 font-normal">{hoursLabel}</span>
            )}
          </div>
          {!isClosed && <Plus className="h-3 w-3 opacity-0 hover:opacity-100 text-purple-400" />}
        </div>
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-lg border cursor-pointer transition-all relative ${
        isCurrentDay
          ? "border-purple-500 bg-purple-500/10"
          : isClosed
          ? "border-red-500/30 bg-red-950/20"
          : "border-gray-700 bg-gray-800/50"
      } ${
        isOver
          ? "bg-purple-500/30 ring-2 ring-purple-500"
          : isCurrentDay
          ? "hover:bg-purple-500/20"
          : isClosed
          ? "hover:bg-red-950/30"
          : "hover:bg-gray-700/50"
      }`}
      onClick={onClick}
    >
      <div
        className={`p-2 border-b flex items-center justify-between ${
          isCurrentDay ? "border-purple-500/50" : isClosed ? "border-red-500/30" : "border-gray-700"
        }`}
      >
        <div>
          <p className={`text-xs ${isCurrentDay ? "text-purple-300" : isClosed ? "text-red-400" : "text-gray-400"}`}>
            {format(day, "EEE")}
          </p>
          <p className={`text-lg font-bold ${isCurrentDay ? "text-purple-300" : isClosed ? "text-red-300/70" : "text-white"}`}>
            {format(day, "d")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isClosed ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded text-[10px] text-red-400 border border-red-500/30">
              <Ban className="h-3 w-3" />
              <span>Closed</span>
            </div>
          ) : hoursLabel ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] text-gray-400">
              <Clock className="h-2.5 w-2.5" />
              <span>{hoursLabel}</span>
            </div>
          ) : (
            <Plus className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-purple-400" />
          )}
        </div>
      </div>
      <div
        className="p-2 space-y-2 max-h-[300px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}