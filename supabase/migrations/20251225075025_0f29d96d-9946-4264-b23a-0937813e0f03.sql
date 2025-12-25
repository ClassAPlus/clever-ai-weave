-- Insert a test port request for CLASS A PLUS business
INSERT INTO port_requests (
  business_id,
  phone_number,
  status,
  target_port_date,
  customer_name,
  authorized_representative,
  authorized_rep_email,
  created_at
) VALUES (
  'fe6dd510-b1a9-4adc-a4bd-37f199d36f93',
  '+1 (555) 123-4567',
  'in_progress',
  CURRENT_DATE + INTERVAL '7 days',
  'Test Customer',
  'John Doe',
  'john@example.com',
  now()
);