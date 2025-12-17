-- =============================================
-- PHASE 1: Multi-Tenant AI Missed Call System
-- =============================================

-- Businesses table (multi-tenant - each customer gets one)
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Twilio phone number (purchased per business)
  twilio_phone_number TEXT UNIQUE,
  twilio_phone_number_sid TEXT,
  -- Where to forward calls
  forward_to_phones TEXT[] NOT NULL DEFAULT '{}',
  -- Owner contact info for notifications
  owner_email TEXT,
  owner_phone TEXT,
  owner_notification_channels TEXT[] DEFAULT ARRAY['sms'],
  -- AI configuration
  ai_instructions TEXT,
  ai_language TEXT DEFAULT 'hebrew',
  services TEXT[] DEFAULT '{}',
  -- Business hours (Israel timezone - Sun-Thu default)
  business_hours JSONB DEFAULT '{"sun":{"start":"09:00","end":"18:00"},"mon":{"start":"09:00","end":"18:00"},"tue":{"start":"09:00","end":"18:00"},"wed":{"start":"09:00","end":"18:00"},"thu":{"start":"09:00","end":"18:00"}}',
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  -- Subscription/billing
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'basic',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table (callers/leads)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  opted_out BOOLEAN DEFAULT FALSE,
  opted_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, phone_number)
);

-- Calls table
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  twilio_call_sid TEXT UNIQUE,
  caller_phone TEXT NOT NULL,
  call_status TEXT NOT NULL,
  was_answered BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER DEFAULT 0,
  textback_sent BOOLEAN DEFAULT FALSE,
  textback_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table (SMS threads)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL,
  content TEXT NOT NULL,
  twilio_message_sid TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  service_type TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  confirmation_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries table
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'new',
  owner_notified BOOLEAN DEFAULT FALSE,
  owner_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner notifications log
CREATE TABLE public.owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  related_call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  related_inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Enable Row Level Security
-- =============================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for businesses
-- =============================================

-- Business owners can view their own businesses
CREATE POLICY "Users can view own businesses"
ON public.businesses FOR SELECT
USING (auth.uid() = owner_user_id);

-- Business owners can create businesses
CREATE POLICY "Users can create businesses"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

-- Business owners can update their own businesses
CREATE POLICY "Users can update own businesses"
ON public.businesses FOR UPDATE
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Business owners can delete their own businesses
CREATE POLICY "Users can delete own businesses"
ON public.businesses FOR DELETE
USING (auth.uid() = owner_user_id);

-- Admins can manage all businesses
CREATE POLICY "Admins can manage all businesses"
ON public.businesses FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for contacts
-- =============================================

-- Business owners can view contacts for their businesses
CREATE POLICY "Users can view own business contacts"
ON public.contacts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = contacts.business_id 
  AND businesses.owner_user_id = auth.uid()
));

-- Business owners can create contacts for their businesses
CREATE POLICY "Users can create contacts for own businesses"
ON public.contacts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = contacts.business_id 
  AND businesses.owner_user_id = auth.uid()
));

-- Business owners can update contacts for their businesses
CREATE POLICY "Users can update own business contacts"
ON public.contacts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = contacts.business_id 
  AND businesses.owner_user_id = auth.uid()
));

-- Admins can manage all contacts
CREATE POLICY "Admins can manage all contacts"
ON public.contacts FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for calls
-- =============================================

CREATE POLICY "Users can view own business calls"
ON public.calls FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = calls.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all calls"
ON public.calls FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for conversations
-- =============================================

CREATE POLICY "Users can view own business conversations"
ON public.conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = conversations.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Users can update own business conversations"
ON public.conversations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = conversations.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all conversations"
ON public.conversations FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for messages
-- =============================================

CREATE POLICY "Users can view own business messages"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations
  JOIN public.businesses ON businesses.id = conversations.business_id
  WHERE conversations.id = messages.conversation_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all messages"
ON public.messages FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for appointments
-- =============================================

CREATE POLICY "Users can view own business appointments"
ON public.appointments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = appointments.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Users can manage own business appointments"
ON public.appointments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = appointments.business_id 
  AND businesses.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = appointments.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for inquiries
-- =============================================

CREATE POLICY "Users can view own business inquiries"
ON public.inquiries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = inquiries.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Users can manage own business inquiries"
ON public.inquiries FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = inquiries.business_id 
  AND businesses.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = inquiries.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all inquiries"
ON public.inquiries FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- RLS Policies for owner_notifications
-- =============================================

CREATE POLICY "Users can view own business notifications"
ON public.owner_notifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = owner_notifications.business_id 
  AND businesses.owner_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all notifications"
ON public.owner_notifications FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================
-- Indexes for performance
-- =============================================

CREATE INDEX idx_businesses_owner ON public.businesses(owner_user_id);
CREATE INDEX idx_businesses_phone ON public.businesses(twilio_phone_number);
CREATE INDEX idx_contacts_business ON public.contacts(business_id);
CREATE INDEX idx_contacts_phone ON public.contacts(phone_number);
CREATE INDEX idx_calls_business ON public.calls(business_id);
CREATE INDEX idx_calls_contact ON public.calls(contact_id);
CREATE INDEX idx_calls_created ON public.calls(created_at DESC);
CREATE INDEX idx_conversations_business ON public.conversations(business_id);
CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_appointments_business ON public.appointments(business_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX idx_inquiries_business ON public.inquiries(business_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);

-- =============================================
-- Updated_at trigger function (reuse existing or create)
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();