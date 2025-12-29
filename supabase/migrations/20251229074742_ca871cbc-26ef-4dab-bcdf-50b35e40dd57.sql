-- Create audit log table for AI availability quotes
CREATE TABLE public.ai_availability_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  caller_phone TEXT,
  requested_date DATE NOT NULL,
  quoted_slots TEXT[] NOT NULL,
  slot_count INTEGER NOT NULL,
  time_format TEXT DEFAULT '12h',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_availability_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for business owners/staff to view logs
CREATE POLICY "Business owners can view their availability logs"
ON public.ai_availability_logs
FOR SELECT
USING (
  is_business_owner(business_id, auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.business_staff
    WHERE business_staff.business_id = ai_availability_logs.business_id
    AND business_staff.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_ai_availability_logs_business_date ON public.ai_availability_logs(business_id, created_at DESC);