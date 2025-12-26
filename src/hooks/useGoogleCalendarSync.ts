import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGoogleCalendarSync() {
  const syncAppointment = useCallback(async (appointmentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { success: false, error: "Not authenticated" };

      // First check if Google Calendar is connected
      const statusResponse = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-calendar?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      if (!statusData.connected) {
        // Google Calendar not connected, skip silently
        return { success: false, skipped: true };
      }

      // Sync the appointment
      const response = await fetch(
        `https://wqhakzywmqirucmetnuo.supabase.co/functions/v1/google-calendar?action=sync-appointment`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appointmentId }),
        }
      );

      const data = await response.json();
      if (data.error) {
        console.error("Google Calendar sync error:", data.error);
        return { success: false, error: data.error };
      }

      return { success: true, eventId: data.eventId, eventLink: data.eventLink };
    } catch (error: any) {
      console.error("Error syncing to Google Calendar:", error);
      return { success: false, error: error.message };
    }
  }, []);

  const syncMultipleAppointments = useCallback(async (appointmentIds: string[]) => {
    const results = await Promise.all(
      appointmentIds.map(id => syncAppointment(id))
    );
    
    const synced = results.filter(r => r.success).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success && !r.skipped).length;
    
    return { synced, skipped, failed, total: appointmentIds.length };
  }, [syncAppointment]);

  return { syncAppointment, syncMultipleAppointments };
}
