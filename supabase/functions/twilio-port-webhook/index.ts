import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twilio webhook for port request status updates
// Configure this URL in Twilio Console: https://console.twilio.com/
// Navigate to: Phone Numbers -> Porting -> Webhooks

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Twilio sends form-urlencoded data for webhooks
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        payload[key] = value.toString();
      }
    } else if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      // Try to parse as URL encoded
      const text = await req.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) {
        payload[key] = value;
      }
    }

    console.log('Received Twilio port webhook payload:', JSON.stringify(payload, null, 2));

    // Extract port request details from Twilio webhook
    // Twilio port webhooks typically include these fields:
    const portInRequestSid = payload.PortInRequestSid || payload.port_in_request_sid;
    const status = payload.Status || payload.status || payload.PortingStatus;
    const phoneNumber = payload.PhoneNumber || payload.phone_number || payload.PhoneNumbers;
    const portDate = payload.PortDate || payload.port_date || payload.TargetPortDate;
    const rejectionReason = payload.RejectionReason || payload.rejection_reason || payload.FailureReason;

    if (!portInRequestSid && !phoneNumber) {
      console.error('Missing port request identifier in webhook payload');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing port request identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the port request in our database
    let query = supabase.from('port_requests').select('*, businesses(name, owner_email)');
    
    if (portInRequestSid) {
      query = query.eq('port_in_request_sid', portInRequestSid);
    } else if (phoneNumber) {
      // Clean the phone number for matching
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      query = query.or(`phone_number.eq.${phoneNumber},phone_number.eq.+${cleanPhone},phone_number.eq.+1${cleanPhone}`);
    }

    const { data: portRequests, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching port request:', fetchError);
      throw fetchError;
    }

    if (!portRequests || portRequests.length === 0) {
      console.warn('No port request found for webhook:', { portInRequestSid, phoneNumber });
      // Return 200 to acknowledge receipt even if we don't have the record
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook received, no matching port request found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const portRequest = portRequests[0];
    const previousStatus = portRequest.status;

    // Map Twilio status to our status format
    const statusMapping: Record<string, string> = {
      'pending': 'pending',
      'in-progress': 'in_progress',
      'in_progress': 'in_progress',
      'submitted': 'submitted',
      'accepted': 'in_progress',
      'approved': 'approved',
      'porting': 'porting',
      'completed': 'completed',
      'ported': 'completed',
      'rejected': 'rejected',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    const normalizedStatus = status ? (statusMapping[status.toLowerCase()] || status.toLowerCase()) : null;

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (normalizedStatus) {
      updateData.status = normalizedStatus;
    }

    if (portDate) {
      // Check if this is the actual port completion date
      if (normalizedStatus === 'completed' || normalizedStatus === 'ported') {
        updateData.actual_port_date = portDate;
      } else {
        updateData.target_port_date = portDate;
      }
    }

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    // Update the port request
    const { error: updateError } = await supabase
      .from('port_requests')
      .update(updateData)
      .eq('id', portRequest.id);

    if (updateError) {
      console.error('Error updating port request:', updateError);
      throw updateError;
    }

    console.log(`Updated port request ${portRequest.id} status: ${previousStatus} -> ${normalizedStatus}`);

    // If port is completed, update the business with the new number
    if ((normalizedStatus === 'completed' || normalizedStatus === 'ported') && portRequest.business_id) {
      const { error: businessUpdateError } = await supabase
        .from('businesses')
        .update({
          twilio_phone_number: portRequest.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portRequest.business_id);

      if (businessUpdateError) {
        console.error('Error updating business phone number:', businessUpdateError);
      } else {
        console.log(`Updated business ${portRequest.business_id} with ported number: ${portRequest.phone_number}`);
      }
    }

    // Send email notification if status changed
    if (normalizedStatus && normalizedStatus !== previousStatus) {
      const businessData = portRequest.businesses as { name: string; owner_email: string } | null;
      const ownerEmail = businessData?.owner_email;
      
      if (ownerEmail) {
        try {
          const emailPayload = {
            to_email: ownerEmail,
            business_name: businessData?.name || 'Your Business',
            phone_number: portRequest.phone_number,
            status: normalizedStatus,
            previous_status: previousStatus,
            target_port_date: updateData.target_port_date || portRequest.target_port_date,
            actual_port_date: updateData.actual_port_date || portRequest.actual_port_date,
            rejection_reason: updateData.rejection_reason || portRequest.rejection_reason,
          };

          console.log('Sending status change email:', emailPayload);

          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-port-status-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify(emailPayload),
          });

          const emailResult = await emailResponse.json();
          console.log('Email notification result:', emailResult);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the webhook response for email errors
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        port_request_id: portRequest.id,
        previous_status: previousStatus,
        new_status: normalizedStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing Twilio port webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
