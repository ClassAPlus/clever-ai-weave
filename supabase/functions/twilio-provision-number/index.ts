import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionNumberRequest {
  business_id: string;
  phone_number: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ProvisionNumberRequest = await req.json();
    const { business_id, phone_number } = body;

    if (!business_id || !phone_number) {
      return new Response(
        JSON.stringify({ success: false, error: "business_id and phone_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Provisioning number ${phone_number} for business ${business_id}`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify business exists and doesn't already have a number
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, twilio_phone_number")
      .eq("id", business_id)
      .single();

    if (businessError || !business) {
      console.error("Business not found:", businessError);
      return new Response(
        JSON.stringify({ success: false, error: "Business not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (business.twilio_phone_number) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Business already has a phone number assigned",
          existing_number: business.twilio_phone_number 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Webhook URLs for voice and SMS
    const voiceWebhookUrl = `${SUPABASE_URL}/functions/v1/voice-incoming`;
    const voiceStatusCallbackUrl = `${SUPABASE_URL}/functions/v1/voice-dial-result`;
    const smsWebhookUrl = `${SUPABASE_URL}/functions/v1/sms-incoming`;

    // Purchase the phone number via Twilio API
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;

    const purchaseParams = new URLSearchParams();
    purchaseParams.append("PhoneNumber", phone_number);
    purchaseParams.append("VoiceUrl", voiceWebhookUrl);
    purchaseParams.append("VoiceMethod", "POST");
    purchaseParams.append("StatusCallback", voiceStatusCallbackUrl);
    purchaseParams.append("StatusCallbackMethod", "POST");
    purchaseParams.append("SmsUrl", smsWebhookUrl);
    purchaseParams.append("SmsMethod", "POST");
    purchaseParams.append("FriendlyName", `${business.name} - AI Missed Call System`);

    console.log("Purchasing number from Twilio...");

    const purchaseResponse = await fetch(purchaseUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: purchaseParams.toString(),
    });

    const purchaseData = await purchaseResponse.json();

    if (!purchaseResponse.ok) {
      console.error("Twilio purchase error:", purchaseData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: purchaseData.message || "Failed to purchase number",
          code: purchaseData.code 
        }),
        { status: purchaseResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Number purchased successfully:", purchaseData.sid);

    // Update the business record with the new phone number
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        twilio_phone_number: purchaseData.phone_number,
        twilio_phone_number_sid: purchaseData.sid,
      })
      .eq("id", business_id);

    if (updateError) {
      console.error("Failed to update business:", updateError);
      // Note: Number was purchased but DB update failed. 
      // In production, you'd want to handle this more gracefully (e.g., release the number)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Number purchased but failed to update business record",
          phone_number: purchaseData.phone_number,
          phone_sid: purchaseData.sid
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Business updated with new phone number");

    return new Response(
      JSON.stringify({
        success: true,
        phone_number: purchaseData.phone_number,
        phone_sid: purchaseData.sid,
        friendly_name: purchaseData.friendly_name,
        voice_url: purchaseData.voice_url,
        sms_url: purchaseData.sms_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error provisioning number:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
