-- Create business_role enum for business-level staff
CREATE TYPE public.business_role AS ENUM ('manager', 'staff');

-- Create business_staff table for business-level team members
CREATE TABLE public.business_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role business_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(business_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.business_staff ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user owns or is staff of a business
CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE id = _business_id
      AND owner_user_id = _user_id
  )
$$;

-- RLS Policies for business_staff

-- Business owners can manage their own staff
CREATE POLICY "Business owners can manage their staff"
ON public.business_staff
FOR ALL
USING (public.is_business_owner(auth.uid(), business_id))
WITH CHECK (public.is_business_owner(auth.uid(), business_id));

-- Staff members can view their own staff entry
CREATE POLICY "Staff can view their own entry"
ON public.business_staff
FOR SELECT
USING (user_id = auth.uid());

-- Platform admins can manage all staff
CREATE POLICY "Platform admins can manage all staff"
ON public.business_staff
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());