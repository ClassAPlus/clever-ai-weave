-- Add twilio_settings JSONB column to businesses table
ALTER TABLE public.businesses
ADD COLUMN twilio_settings jsonb DEFAULT '{
  "voiceLanguage": "he-IL",
  "voiceGender": "female",
  "ringTimeout": 30,
  "dailyMessageLimit": 10,
  "rateLimitWindow": 5
}'::jsonb;