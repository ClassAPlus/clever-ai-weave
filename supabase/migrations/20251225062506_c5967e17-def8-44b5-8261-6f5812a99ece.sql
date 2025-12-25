-- Create storage bucket for port request documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('port-documents', 'port-documents', false);

-- Allow authenticated users to upload to their business folders
CREATE POLICY "Users can upload port documents for their businesses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'port-documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.port_requests pr ON pr.business_id = b.id
    WHERE b.owner_user_id = auth.uid()
    AND (storage.foldername(name))[1] = pr.id::text
  )
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their port documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'port-documents' AND
  EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.port_requests pr ON pr.business_id = b.id
    WHERE b.owner_user_id = auth.uid()
    AND (storage.foldername(name))[1] = pr.id::text
  )
);

-- Allow admins full access
CREATE POLICY "Admins can manage all port documents"
ON storage.objects FOR ALL
USING (bucket_id = 'port-documents' AND public.is_admin())
WITH CHECK (bucket_id = 'port-documents' AND public.is_admin());

-- Add uploaded_documents column to port_requests
ALTER TABLE public.port_requests
ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '[]'::jsonb;