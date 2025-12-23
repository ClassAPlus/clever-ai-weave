-- Add tags column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN tags text[] DEFAULT '{}'::text[];