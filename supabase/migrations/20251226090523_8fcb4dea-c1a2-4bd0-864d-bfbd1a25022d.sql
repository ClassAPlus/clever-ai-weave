-- Add preferred_language column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN preferred_language text NULL;

-- Add a comment explaining the field
COMMENT ON COLUMN public.contacts.preferred_language IS 'Contact preferred language for communications (e.g., hebrew, english, arabic). Falls back to business primary language if not set.';