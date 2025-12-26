import { format, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ConflictingAppointment } from "@/hooks/useAppointmentConflictDetection";

interface ConflictWarningProps {
  conflicts: ConflictingAppointment[];
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <Alert variant="destructive" className="bg-amber-950/50 border-amber-600/50">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-400">Scheduling Conflict</AlertTitle>
      <AlertDescription className="text-amber-200/80">
        <p className="mb-2">
          This time overlaps with {conflicts.length === 1 ? "an existing appointment" : `${conflicts.length} existing appointments`}:
        </p>
        <ul className="space-y-1 text-sm">
          {conflicts.map((conflict) => (
            <li key={conflict.id} className="flex items-center gap-2">
              <span className="font-medium">
                {format(parseISO(conflict.scheduled_at), "h:mm a")}
              </span>
              <span className="text-amber-300/60">•</span>
              <span>{conflict.contact?.name || conflict.contact?.phone_number || "Unknown"}</span>
              {conflict.service_type && (
                <>
                  <span className="text-amber-300/60">•</span>
                  <span className="text-amber-300/70">{conflict.service_type}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
