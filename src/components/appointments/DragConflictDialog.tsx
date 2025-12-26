import { format, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConflictingAppointment } from "@/hooks/useAppointmentConflictDetection";

interface DragConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictingAppointment[];
  newDate: Date;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DragConflictDialog({
  open,
  onOpenChange,
  conflicts,
  newDate,
  onConfirm,
  onCancel,
}: DragConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gray-800 border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Scheduling Conflict Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            <p className="mb-3">
              Moving this appointment to{" "}
              <span className="font-medium text-white">
                {format(newDate, "EEEE, MMM d 'at' h:mm a")}
              </span>{" "}
              will overlap with:
            </p>
            <ul className="space-y-2 bg-amber-950/30 border border-amber-600/30 rounded-lg p-3">
              {conflicts.map((conflict) => (
                <li key={conflict.id} className="flex items-center gap-2 text-amber-200">
                  <span className="font-medium">
                    {format(parseISO(conflict.scheduled_at), "h:mm a")}
                  </span>
                  <span className="text-amber-300/60">•</span>
                  <span>
                    {conflict.contact?.name || conflict.contact?.phone_number || "Unknown"}
                  </span>
                  {conflict.service_type && (
                    <>
                      <span className="text-amber-300/60">•</span>
                      <span className="text-amber-300/70">{conflict.service_type}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-gray-400">
              Do you want to proceed with this reschedule anyway?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Reschedule Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
