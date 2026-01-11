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

    const { port_request_id, business_id } = await req.json();

    if (!port_request_id && !business_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either port_request_id or business_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If business_id provided, return all port requests for that business
    if (business_id && !port_request_id) {
      console.log('Fetching port requests for business:', business_id);
      console.log('Authenticated user:', user.id);
      
      // Verify user owns this business
      const { data: business, error: businessError } = await serviceClient
        .from('businesses')
        .select('id, owner_user_id')
        .eq('id', business_id)
        .single();

      console.log('Business lookup result:', { business, error: businessError });

      if (!business || business.owner_user_id !== user.id) {
        console.log('Access denied - owner_user_id:', business?.owner_user_id, 'user.id:', user.id);
        return new Response(
          JSON.stringify({ success: false, error: 'Business not found or access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: portRequests, error: fetchError } = await serviceClient
        .from('port_requests')
        .select('*')
        .eq('business_id', business_id)
        .order('created_at', { ascending: false });

      console.log('Port requests query result:', { count: portRequests?.length, error: fetchError });

      if (fetchError) {
        console.error('Error fetching port requests:', fetchError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch port requests' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Returning port requests:', portRequests?.length || 0);
      return new Response(
        JSON.stringify({ success: true, port_requests: portRequests || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get specific port request
    const { data: portRequest, error: fetchError } = await serviceClient
      .from('port_requests')
      .select('*, businesses!inner(owner_user_id)')
      .eq('id', port_request_id)
      .single();

    if (fetchError || !portRequest) {
      console.error('Port request not found:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Port request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if ((portRequest as any).businesses?.owner_user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If there's a port_in_request_sid, fetch latest status from Twilio
    if (portRequest.port_in_request_sid) {
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

      if (accountSid && authToken) {
        try {
          const twilioUrl = `https://numbers.twilio.com/v1/Porting/PortIn/${portRequest.port_in_request_sid}`;
          
          const response = await fetch(twilioUrl, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const twilioData = await response.json();
            console.log('Twilio port status:', JSON.stringify(twilioData));

            // Update local record if status changed
            const newStatus = twilioData.status?.toLowerCase() || portRequest.status;
            const actualPortDate = twilioData.actual_port_in_date || null;
            const previousStatus = portRequest.status;
            const statusChanged = newStatus !== previousStatus;
            
            if (statusChanged || actualPortDate !== portRequest.actual_port_date) {
              await serviceClient
                .from('port_requests')
                .update({
                  status: newStatus,
                  actual_port_date: actualPortDate,
                  rejection_reason: twilioData.rejection_reason || portRequest.rejection_reason,
                })
                .eq('id', port_request_id);

              // If porting is complete, update the business with the new number
              if (newStatus === 'completed' || newStatus === 'ported') {
                await serviceClient
                  .from('businesses')
                  .update({
                    twilio_phone_number: portRequest.phone_number,
                  })
                  .eq('id', portRequest.business_id);
              }

              // Send email notification if status changed
              if (statusChanged && portRequest.authorized_rep_email) {
                // Get business name and notification email for email
                const { data: business } = await serviceClient
                  .from('businesses')
                  .select('name, notification_email_from')
                  .eq('id', portRequest.business_id)
                  .single();

                // Send notification email (fire and forget)
                EdgeRuntime.waitUntil(
                  fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-port-status-email`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    },
                    body: JSON.stringify({
                      to_email: portRequest.authorized_rep_email,
                      business_name: business?.name || 'Your Business',
                      phone_number: portRequest.phone_number,
                      status: newStatus,
                      previous_status: previousStatus,
                      target_port_date: portRequest.target_port_date,
                      actual_port_date: actualPortDate,
                      rejection_reason: twilioData.rejection_reason || portRequest.rejection_reason,
                      from_email: business?.notification_email_from || null,
                    }),
                  }).then(res => res.json()).then(data => {
                    console.log('Port status email sent:', data);
                  }).catch(err => {
                    console.error('Failed to send port status email:', err);
                  })
                );
              }
            }

            return new Response(
              JSON.stringify({
                success: true,
                port_request: {
                  ...portRequest,
                  status: newStatus,
                  actual_port_date: actualPortDate,
                  twilio_status: twilioData.status,
                  twilio_status_details: twilioData.status_details,
                },
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (twilioError) {
          console.error('Error fetching Twilio status:', twilioError);
          // Continue with local data
        }
      }
    }

    // Return local data without Twilio update
    return new Response(
      JSON.stringify({ success: true, port_request: portRequest }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting port status:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
