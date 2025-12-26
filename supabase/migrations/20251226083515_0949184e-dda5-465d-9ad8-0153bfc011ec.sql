-- Create appointment_templates table for storing reusable appointment types
CREATE TABLE public.appointment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  default_recurrence_pattern TEXT DEFAULT 'none',
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own business templates"
ON public.appointment_templates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = appointment_templates.business_id
  AND businesses.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = appointment_templates.business_id
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all templates"
ON public.appointment_templates
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_appointment_templates_updated_at
BEFORE UPDATE ON public.appointment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();