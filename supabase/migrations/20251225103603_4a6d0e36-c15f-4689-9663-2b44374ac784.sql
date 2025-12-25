-- Add reminder tracking columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_response TEXT,
ADD COLUMN IF NOT EXISTS reminder_response_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of pending reminders
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_pending 
ON public.appointments (scheduled_at, reminder_sent_at) 
WHERE status = 'pending' AND reminder_sent_at IS NULL;