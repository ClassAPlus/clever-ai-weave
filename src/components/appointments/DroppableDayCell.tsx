import { useDroppable } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import { Plus } from "lucide-react";
import { ReactNode } from "react";

interface DroppableDayCellProps {
  day: Date;
  isCurrentDay?: boolean;
  isCurrentMonth?: boolean;
  children: ReactNode;
  onClick?: () => void;
  variant?: "week" | "month";
}

export function DroppableDayCell({
  day,
  isCurrentDay = false,
  isCurrentMonth = true,
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

  if (variant === "month") {
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[100px] p-1 border-b border-r border-gray-700 cursor-pointer transition-all ${
          !isCurrentMonth ? "bg-gray-900/50" : ""
        } ${isCurrentDay ? "bg-purple-500/10" : ""} ${
          isOver ? "bg-purple-500/30 ring-2 ring-purple-500 ring-inset" : "hover:bg-gray-700/30"
        }`}
        onClick={onClick}
      >
        <div
          className={`text-sm font-medium mb-1 flex items-center justify-between ${
            isCurrentDay
              ? "text-purple-300"
              : isCurrentMonth
              ? "text-white"
              : "text-gray-600"
          }`}
        >
          <span>{format(day, "d")}</span>
          <Plus className="h-3 w-3 opacity-0 hover:opacity-100 text-purple-400" />
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
      className={`min-h-[200px] rounded-lg border cursor-pointer transition-all ${
        isCurrentDay
          ? "border-purple-500 bg-purple-500/10"
          : "border-gray-700 bg-gray-800/50"
      } ${
        isOver
          ? "bg-purple-500/30 ring-2 ring-purple-500"
          : isCurrentDay
          ? "hover:bg-purple-500/20"
          : "hover:bg-gray-700/50"
      }`}
      onClick={onClick}
    >
      <div
        className={`p-2 border-b flex items-center justify-between ${
          isCurrentDay ? "border-purple-500/50" : "border-gray-700"
        }`}
      >
        <div>
          <p className={`text-xs ${isCurrentDay ? "text-purple-300" : "text-gray-400"}`}>
            {format(day, "EEE")}
          </p>
          <p className={`text-lg font-bold ${isCurrentDay ? "text-purple-300" : "text-white"}`}>
            {format(day, "d")}
          </p>
        </div>
        <Plus className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-purple-400" />
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
