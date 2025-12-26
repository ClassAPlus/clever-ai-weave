import { format, parseISO } from "date-fns";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ConflictingAppointment } from "@/hooks/useAppointmentConflictDetection";

interface ConflictWarningProps {
  conflicts: ConflictingAppointment[];
  acknowledged?: boolean;
  onAcknowledge?: () => void;
}

export function ConflictWarning({ conflicts, acknowledged, onAcknowledge }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  if (acknowledged) {
    return (
      <Alert className="bg-green-950/30 border-green-600/50">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-400">Conflict Acknowledged</AlertTitle>
        <AlertDescription className="text-green-200/80">
          You've chosen to proceed despite the scheduling conflict.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="bg-amber-950/50 border-amber-600/50">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-400">Scheduling Conflict</AlertTitle>
      <AlertDescription className="text-amber-200/80">
        <p className="mb-2">
          This time overlaps with {conflicts.length === 1 ? "an existing appointment" : `${conflicts.length} existing appointments`}:
        </p>
        <ul className="space-y-1 text-sm mb-3">
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
        {onAcknowledge && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className="border-amber-600/50 text-amber-300 hover:bg-amber-900/30 hover:text-amber-200"
          >
            Proceed anyway
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
