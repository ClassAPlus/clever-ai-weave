import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReleaseNumberRequest {
  business_id: string;
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

    const body: ReleaseNumberRequest = await req.json();
    const { business_id } = body;

    if (!business_id) {
      return new Response(
        JSON.stringify({ success: false, error: "business_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Releasing number for business ${business_id}`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the business and its phone number SID
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, twilio_phone_number, twilio_phone_number_sid")
      .eq("id", business_id)
      .single();

    if (businessError || !business) {
      console.error("Business not found:", businessError);
      return new Response(
        JSON.stringify({ success: false, error: "Business not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Make release idempotent: if there's no number SID, treat as already released
    if (!business.twilio_phone_number_sid) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No phone number to release",
          released_number: null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phoneNumberSid = business.twilio_phone_number_sid;
    const phoneNumber = business.twilio_phone_number;

    console.log(`Releasing phone number ${phoneNumber} (SID: ${phoneNumberSid})`);

    // Release the phone number via Twilio API
    const releaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${phoneNumberSid}.json`;

    const releaseResponse = await fetch(releaseUrl, {
      method: "DELETE",
      headers: {
        Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
    });

    if (!releaseResponse.ok && releaseResponse.status !== 204) {
      const errorData = await releaseResponse.json().catch(() => ({}));
      console.error("Twilio release error:", errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorData.message || "Failed to release number from Twilio",
          code: errorData.code 
        }),
        { status: releaseResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Number released from Twilio successfully");

    // Clear the phone number from the business record
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        twilio_phone_number: null,
        twilio_phone_number_sid: null,
      })
      .eq("id", business_id);

    if (updateError) {
      console.error("Failed to update business:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Number released from Twilio but failed to update business record"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Business record updated - phone number cleared");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Phone number released successfully",
        released_number: phoneNumber,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error releasing number:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
