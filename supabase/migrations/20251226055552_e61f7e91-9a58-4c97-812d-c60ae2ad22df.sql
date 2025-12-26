-- Create table to store user's Google Calendar tokens
CREATE TABLE public.google_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- Add google_calendar_event_id to appointments for tracking synced events
ALTER TABLE public.appointments
ADD COLUMN google_calendar_event_id TEXT;

-- Create index for faster lookups
CREATE INDEX idx_appointments_google_event_id ON public.appointments(google_calendar_event_id);

-- Enable RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own business tokens"
ON public.google_calendar_tokens
FOR ALL
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = google_calendar_tokens.business_id
  AND businesses.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = google_calendar_tokens.business_id
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all tokens"
ON public.google_calendar_tokens
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_google_calendar_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();