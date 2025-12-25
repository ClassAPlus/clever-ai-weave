-- Add recurrence fields to appointments table
ALTER TABLE public.appointments 
ADD COLUMN recurrence_pattern text DEFAULT 'none',
ADD COLUMN recurrence_end_date date,
ADD COLUMN recurrence_parent_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Add index for finding recurring appointment series
CREATE INDEX idx_appointments_recurrence_parent ON public.appointments(recurrence_parent_id);

-- Add comment for clarity
COMMENT ON COLUMN public.appointments.recurrence_pattern IS 'none, daily, weekly, monthly';
COMMENT ON COLUMN public.appointments.recurrence_parent_id IS 'Links child appointments to the parent recurring appointment';