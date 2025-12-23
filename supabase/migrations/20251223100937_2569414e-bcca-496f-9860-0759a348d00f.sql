-- Add new columns to businesses table for specialized messaging
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS industry_type TEXT,
ADD COLUMN IF NOT EXISTS ai_personality JSONB DEFAULT '{"tone": "friendly", "style": "conversational", "emoji_usage": "moderate", "response_length": "medium"}'::jsonb,
ADD COLUMN IF NOT EXISTS greeting_messages JSONB DEFAULT '{"new_conversation": "", "missed_call": "", "returning_customer": "", "after_hours": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_tools TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS knowledge_base JSONB DEFAULT '{"faqs": [], "policies": {}, "pricing": [], "staff": []}'::jsonb;

-- Create message_templates table
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  variables TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_templates
CREATE POLICY "Admins can manage all templates"
ON public.message_templates
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can manage own business templates"
ON public.message_templates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = message_templates.business_id
  AND businesses.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = message_templates.business_id
  AND businesses.owner_user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_message_templates_business_id ON public.message_templates(business_id);
CREATE INDEX idx_message_templates_category ON public.message_templates(category);