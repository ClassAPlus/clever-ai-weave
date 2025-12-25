-- Create port_requests table for tracking number porting
CREATE TABLE public.port_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  port_in_request_sid TEXT,
  status TEXT DEFAULT 'draft',
  -- Losing carrier information
  customer_name TEXT,
  authorized_representative TEXT,
  authorized_rep_email TEXT,
  account_number TEXT,
  account_pin TEXT,
  -- Service address (must match carrier records)
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  -- Tracking
  target_port_date DATE,
  actual_port_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  document_sids TEXT[] DEFAULT '{}',
  notification_emails TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.port_requests ENABLE ROW LEVEL SECURITY;

-- Policy for business owners to manage their port requests
CREATE POLICY "Users can manage own business port requests"
  ON public.port_requests
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = port_requests.business_id
    AND businesses.owner_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = port_requests.business_id
    AND businesses.owner_user_id = auth.uid()
  ));

-- Policy for admins
CREATE POLICY "Admins can manage all port requests"
  ON public.port_requests
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_port_requests_updated_at
  BEFORE UPDATE ON public.port_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();