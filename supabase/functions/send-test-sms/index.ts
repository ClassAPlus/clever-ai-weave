import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, greeting } = await req.json();

    console.log("Send test SMS request for business:", businessId);

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'Business ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get business details
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", bizError);
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!business.twilio_phone_number) {
      return new Response(
        JSON.stringify({ error: 'No AI phone number configured for this business' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!business.owner_phone) {
      return new Response(
        JSON.stringify({ error: 'No owner phone number configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided greeting or generate one based on settings
    const testGreeting = greeting || generateGreeting(business);

    console.log("Sending test SMS from", business.twilio_phone_number, "to", business.owner_phone);
    console.log("Message:", testGreeting);

    // Send SMS via Twilio
    const smsResult = await sendSMS(business.twilio_phone_number, business.owner_phone, testGreeting);

    console.log("SMS sent successfully:", smsResult.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: smsResult.sid,
        sentTo: business.owner_phone,
        message: testGreeting
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in send-test-sms:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send test SMS' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateGreeting(business: any): string {
  // Parse language settings - format: "primary:lang1,lang2,lang3:autodetect"
  const languageData = business.ai_language || 'hebrew';
  const parts = languageData.split(':');
  const primaryLanguage = parts[0] || 'hebrew';
  const businessName = business.name || 'our business';

  const greetings: Record<string, string> = {
    hebrew: `שלום! ברוכים הבאים ל${businessName}. איך אוכל לעזור לך היום?`,
    english: `Hello! Welcome to ${businessName}. How can I help you today?`,
    arabic: `مرحباً! أهلاً بك في ${businessName}. كيف يمكنني مساعدتك اليوم؟`,
    russian: `Здравствуйте! Добро пожаловать в ${businessName}. Чем могу помочь?`,
    spanish: `¡Hola! Bienvenido a ${businessName}. ¿Cómo puedo ayudarte hoy?`,
    french: `Bonjour! Bienvenue chez ${businessName}. Comment puis-je vous aider?`,
    german: `Hallo! Willkommen bei ${businessName}. Wie kann ich Ihnen helfen?`,
    portuguese: `Olá! Bem-vindo a ${businessName}. Como posso ajudá-lo hoje?`,
    italian: `Ciao! Benvenuto da ${businessName}. Come posso aiutarti oggi?`,
    dutch: `Hallo! Welkom bij ${businessName}. Hoe kan ik u helpen?`,
    polish: `Cześć! Witamy w ${businessName}. Jak mogę pomóc?`,
    turkish: `Merhaba! ${businessName} hoş geldiniz. Size nasıl yardımcı olabilirim?`,
    chinese: `您好！欢迎来到${businessName}。今天我能为您做些什么？`,
    japanese: `こんにちは！${businessName}へようこそ。本日はどのようなご用件でしょうか？`,
    korean: `안녕하세요! ${businessName}에 오신 것을 환영합니다. 무엇을 도와드릴까요?`,
    hindi: `नमस्ते! ${businessName} में आपका स्वागत है। आज मैं आपकी कैसे मदद कर सकता हूं?`,
    thai: `สวัสดีครับ! ยินดีต้อนรับสู่${businessName} วันนี้ให้ช่วยอะไรได้บ้างครับ?`,
    vietnamese: `Xin chào! Chào mừng đến với ${businessName}. Tôi có thể giúp gì cho bạn?`,
  };

  return greetings[primaryLanguage] || greetings.english;
}

async function sendSMS(from: string, to: string, body: string): Promise<{ sid: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twilio SMS error:", errorText);
    throw new Error(`Twilio SMS error: ${errorText}`);
  }

  return await response.json();
}
