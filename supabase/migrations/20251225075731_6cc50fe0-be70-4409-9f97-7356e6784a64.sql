-- Fix: add test port request for the business currently used in Settings
-- (observed in network requests as business_id 52193b9a-d5f2-420f-beaf-c44b2dd5e5c3)

-- Remove previous test row (if it exists) that used the wrong business id
DELETE FROM public.port_requests
WHERE business_id = 'fe6dd510-b1a9-4adc-a4bd-37f199d36f93'
  AND phone_number = '+1 (555) 123-4567'
  AND customer_name = 'Test Customer';

-- Insert correct test row
INSERT INTO public.port_requests (
  business_id,
  phone_number,
  status,
  target_port_date,
  customer_name,
  authorized_representative,
  authorized_rep_email,
  created_at
) VALUES (
  '52193b9a-d5f2-420f-beaf-c44b2dd5e5c3',
  '+1 (555) 123-4567',
  'in_progress',
  CURRENT_DATE + INTERVAL '7 days',
  'Test Customer',
  'John Doe',
  'john@example.com',
  now()
);
