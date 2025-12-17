import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchNumbersRequest {
  country_code?: string;
  area_code?: string;
  contains?: string;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SearchNumbersRequest = await req.json();
    const countryCode = body.country_code || "IL"; // Default to Israel
    const areaCode = body.area_code || "";
    const contains = body.contains || "";
    const limit = body.limit || 20;

    console.log(`Searching for available numbers in ${countryCode}, area code: ${areaCode}`);

    // Helper function to search Twilio
    const searchTwilio = async (numberType: string, useAreaCode: boolean) => {
      const params = new URLSearchParams();
      if (useAreaCode && areaCode) params.append("AreaCode", areaCode);
      if (contains) params.append("Contains", contains);
      params.append("VoiceEnabled", "true");
      params.append("SmsEnabled", "true");
      params.append("PageSize", limit.toString());

      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${countryCode}/${numberType}.json?${params.toString()}`;
      console.log(`Twilio API URL: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`${numberType} search failed:`, errorData.message);
        return [];
      }

      const data = await response.json();
      return data.available_phone_numbers || [];
    };

    // Try different search strategies
    let numbers: any[] = [];
    
    // 1. Try Local numbers with area code
    if (areaCode) {
      numbers = await searchTwilio("Local", true);
      console.log(`Local with area code: ${numbers.length} numbers`);
    }
    
    // 2. Try Mobile numbers with area code
    if (numbers.length === 0 && areaCode) {
      numbers = await searchTwilio("Mobile", true);
      console.log(`Mobile with area code: ${numbers.length} numbers`);
    }
    
    // 3. Try Local without area code
    if (numbers.length === 0) {
      numbers = await searchTwilio("Local", false);
      console.log(`Local without area code: ${numbers.length} numbers`);
    }
    
    // 4. Try Mobile without area code
    if (numbers.length === 0) {
      numbers = await searchTwilio("Mobile", false);
      console.log(`Mobile without area code: ${numbers.length} numbers`);
    }

    // Format the available numbers
    const availableNumbers = numbers.map((num: any) => ({
      phone_number: num.phone_number,
      friendly_name: num.friendly_name,
      locality: num.locality || "",
      region: num.region || "",
      postal_code: num.postal_code || "",
      country: num.iso_country,
      capabilities: {
        voice: num.capabilities?.voice || false,
        sms: num.capabilities?.sms || false,
        mms: num.capabilities?.mms || false,
      },
    }));

    console.log(`Found ${availableNumbers.length} available numbers total`);

    return new Response(
      JSON.stringify({
        success: true,
        available_numbers: availableNumbers,
        country_code: countryCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error searching numbers:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
