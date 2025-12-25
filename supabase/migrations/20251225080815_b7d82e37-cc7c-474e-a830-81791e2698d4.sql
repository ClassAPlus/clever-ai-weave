-- Add column for per-business sender email address for notifications
ALTER TABLE public.businesses
ADD COLUMN notification_email_from text DEFAULT NULL;