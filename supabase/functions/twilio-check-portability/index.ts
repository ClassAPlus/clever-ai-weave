import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone_number } = await req.json();
    
    if (!phone_number) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking portability for: ${phone_number}`);

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the phone number - ensure E.164 format
    const cleanNumber = phone_number.replace(/\s/g, '');
    
    // Call Twilio's Portability API
    // Note: This uses the Number Portability API which is available in the US
    const twilioUrl = `https://numbers.twilio.com/v1/Porting/Portability/PhoneNumber/${encodeURIComponent(cleanNumber)}`;
    
    const response = await fetch(twilioUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Twilio portability response:', JSON.stringify(data));

    if (!response.ok) {
      // If the portability API returns an error, it might mean the number isn't in a supported region
      // or the API isn't available for this number type
      const errorMessage = data.message || data.error?.message || 'Unable to check portability';
      
      // For US numbers, portability check should work
      // For other countries, we might get an error
      if (response.status === 404 || response.status === 400) {
        return new Response(
          JSON.stringify({
            success: true,
            portable: false,
            phone_number: cleanNumber,
            reason: 'Number portability check is not available for this number or region. Please contact support for manual verification.',
            not_supported: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return portability status
    return new Response(
      JSON.stringify({
        success: true,
        portable: data.portable === true,
        phone_number: data.phone_number || cleanNumber,
        number_type: data.number_type,
        country: data.country,
        reason: data.portable ? null : (data.not_portable_reason || 'This number cannot be ported to Twilio'),
        pin_required: data.pin_and_account_number_required || false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking portability:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
