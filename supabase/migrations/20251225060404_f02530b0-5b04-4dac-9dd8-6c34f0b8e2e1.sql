-- Add call summary fields to the calls table
ALTER TABLE public.calls
ADD COLUMN IF NOT EXISTS call_summary JSONB DEFAULT NULL;

-- Add comment to explain the structure
COMMENT ON COLUMN public.calls.call_summary IS 'JSON object containing: reason (why caller called), outcome (what was resolved/done), next_steps (follow-up actions needed)';