-- Add auto_confirm column to appointment_templates
ALTER TABLE public.appointment_templates
ADD COLUMN auto_confirm BOOLEAN DEFAULT false;