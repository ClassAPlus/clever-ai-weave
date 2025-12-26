import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addMinutes, parseISO, isWithinInterval, areIntervalsOverlapping } from "date-fns";

export interface ConflictingAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  service_type: string | null;
  contact: {
    name: string | null;
    phone_number: string;
  } | null;
}

export function useAppointmentConflictDetection(businessId: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictingAppointment[]>([]);

  const checkConflicts = useCallback(async (
    scheduledAt: Date,
    durationMinutes: number,
    excludeAppointmentId?: string
  ): Promise<ConflictingAppointment[]> => {
    if (!businessId) return [];

    setIsChecking(true);
    try {
      const newStart = scheduledAt;
      const newEnd = addMinutes(scheduledAt, durationMinutes);

      // Fetch appointments for the same day with a buffer
      const dayStart = new Date(scheduledAt);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(scheduledAt);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: existingAppointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          service_type,
          status,
          contacts (
            name,
            phone_number
          )
        `)
        .eq("business_id", businessId)
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .neq("status", "cancelled");

      if (error) {
        console.error("Error checking conflicts:", error);
        return [];
      }

      const conflicting = (existingAppointments || []).filter((apt) => {
        // Skip the appointment being edited
        if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;

        const existingStart = parseISO(apt.scheduled_at);
        const existingEnd = addMinutes(existingStart, apt.duration_minutes || 60);

        // Check if intervals overlap
        return areIntervalsOverlapping(
          { start: newStart, end: newEnd },
          { start: existingStart, end: existingEnd }
        );
      }).map((apt) => ({
        id: apt.id,
        scheduled_at: apt.scheduled_at,
        duration_minutes: apt.duration_minutes || 60,
        service_type: apt.service_type,
        contact: apt.contacts as { name: string | null; phone_number: string } | null,
      }));

      setConflicts(conflicting);
      return conflicting;
    } catch (error) {
      console.error("Error in conflict detection:", error);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [businessId]);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return {
    isChecking,
    conflicts,
    checkConflicts,
    clearConflicts,
  };
}
