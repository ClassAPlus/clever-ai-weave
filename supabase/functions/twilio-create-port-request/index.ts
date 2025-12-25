import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    const body = await req.json();
    const {
      business_id,
      phone_number,
      customer_name,
      authorized_representative,
      authorized_rep_email,
      account_number,
      account_pin,
      street,
      city,
      state,
      zip,
      country = 'US',
      target_port_date,
      notification_emails = [],
      uploaded_documents = [],
    } = body;

    // Validate required fields
    if (!business_id || !phone_number || !customer_name || !authorized_representative || !authorized_rep_email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: business_id, phone_number, customer_name, authorized_representative, authorized_rep_email' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!street || !city || !state || !zip) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required address fields: street, city, state, zip' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating port request for: ${phone_number}, business: ${business_id}`);

    // Verify user owns this business
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: business, error: bizError } = await serviceClient
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', business_id)
      .single();

    if (bizError || !business) {
      console.error('Business not found:', bizError);
      return new Response(
        JSON.stringify({ success: false, error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (business.owner_user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'You do not own this business' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the phone number
    const cleanNumber = phone_number.replace(/\s/g, '');

    // Calculate target port date (minimum 7 business days from now if not provided)
    let portDate = target_port_date;
    if (!portDate) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 10); // 10 days to account for weekends
      portDate = minDate.toISOString().split('T')[0];
    }

    // Create Port-In request with Twilio
    // Using the Port In API: POST /v1/Porting/PortIn
    const twilioUrl = 'https://numbers.twilio.com/v1/Porting/PortIn';
    
    const portRequest = {
      phone_numbers: [cleanNumber],
      target_port_in_date: portDate,
      target_port_in_time_range_start: "09:00",
      target_port_in_time_range_end: "17:00",
      losing_carrier_information: {
        customer_name: customer_name,
        authorized_representative_name: authorized_representative,
        account_number: account_number || undefined,
        pin: account_pin || undefined,
        service_address: {
          street: street,
          city: city,
          region: state,
          postal_code: zip,
          country: country,
        }
      },
      notification_emails: notification_emails.length > 0 ? notification_emails : [authorized_rep_email],
    };

    console.log('Creating Twilio port request:', JSON.stringify(portRequest));

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(portRequest),
    });

    const data = await response.json();
    console.log('Twilio port-in response:', JSON.stringify(data));

    if (!response.ok) {
      const errorMessage = data.message || data.error?.message || 'Failed to create port request';
      console.error('Twilio error:', errorMessage);
      
      // Save the failed request anyway for tracking
      await serviceClient.from('port_requests').insert({
        business_id,
        phone_number: cleanNumber,
        status: 'failed',
        customer_name,
        authorized_representative,
        authorized_rep_email,
        account_number,
        account_pin,
        street,
        city,
        state,
        zip,
        country,
        target_port_date: portDate,
        notification_emails,
        rejection_reason: errorMessage,
        uploaded_documents: uploaded_documents,
      });
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save the port request to database
    const { data: portRecord, error: insertError } = await serviceClient
      .from('port_requests')
      .insert({
        business_id,
        phone_number: cleanNumber,
        port_in_request_sid: data.sid || data.port_in_request_sid,
        status: data.status || 'submitted',
        customer_name,
        authorized_representative,
        authorized_rep_email,
        account_number,
        account_pin,
        street,
        city,
        state,
        zip,
        country,
        target_port_date: portDate,
        notification_emails,
        uploaded_documents: uploaded_documents,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving port request:', insertError);
      // The Twilio request succeeded, so return success but log the DB error
    }

    return new Response(
      JSON.stringify({
        success: true,
        port_request_id: portRecord?.id,
        port_in_request_sid: data.sid || data.port_in_request_sid,
        status: data.status || 'submitted',
        target_port_date: portDate,
        message: 'Port request submitted successfully. You will receive a Letter of Authorization (LOA) via email to sign.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating port request:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
