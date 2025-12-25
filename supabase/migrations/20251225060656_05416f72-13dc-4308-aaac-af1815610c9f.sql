-- Add manual notes field to calls table
ALTER TABLE public.calls
ADD COLUMN IF NOT EXISTS manual_notes TEXT DEFAULT NULL;

COMMENT ON COLUMN public.calls.manual_notes IS 'Manual notes added by the user after the call';