import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortStatusEmailRequest {
  to_email: string;
  business_name: string;
  phone_number: string;
  status: string;
  previous_status?: string;
  target_port_date?: string;
  actual_port_date?: string;
  rejection_reason?: string;
}

const STATUS_MESSAGES: Record<string, { subject: string; heading: string; message: string; color: string }> = {
  submitted: {
    subject: "Port Request Submitted",
    heading: "Your Port Request Has Been Submitted",
    message: "We've received your number porting request and it's now being processed. You'll receive a Letter of Authorization (LOA) via email shortly that requires your signature.",
    color: "#3B82F6",
  },
  pending: {
    subject: "Port Request Pending Review",
    heading: "Your Port Request Is Pending",
    message: "Your port request is being reviewed. We'll notify you once there's an update.",
    color: "#EAB308",
  },
  in_progress: {
    subject: "Port Request In Progress",
    heading: "Your Port Request Is Being Processed",
    message: "Great news! Your port request has been accepted and is now being processed with your current carrier. The porting process typically takes 2-4 weeks.",
    color: "#8B5CF6",
  },
  approved: {
    subject: "Port Request Approved!",
    heading: "Your Port Request Has Been Approved",
    message: "Excellent news! Your port request has been approved. The number transfer is scheduled and will be completed soon.",
    color: "#22C55E",
  },
  porting: {
    subject: "Number Porting In Progress",
    heading: "Your Number Is Being Transferred",
    message: "Your phone number is currently being transferred. This is the final stage before completion. Please do not cancel your current phone service until you receive confirmation that the port is complete.",
    color: "#8B5CF6",
  },
  completed: {
    subject: "Number Porting Complete! 🎉",
    heading: "Your Number Has Been Successfully Ported",
    message: "Congratulations! Your phone number has been successfully transferred and is now active with your AI assistant. You can now cancel your previous phone service if you haven't already.",
    color: "#16A34A",
  },
  ported: {
    subject: "Number Porting Complete! 🎉",
    heading: "Your Number Has Been Successfully Ported",
    message: "Congratulations! Your phone number has been successfully transferred and is now active with your AI assistant. You can now cancel your previous phone service if you haven't already.",
    color: "#16A34A",
  },
  rejected: {
    subject: "Port Request Rejected",
    heading: "Your Port Request Was Rejected",
    message: "Unfortunately, your port request was rejected. Please review the reason below and submit a new request with the correct information.",
    color: "#EF4444",
  },
  failed: {
    subject: "Port Request Failed",
    heading: "Your Port Request Failed",
    message: "We're sorry, but your port request could not be completed. Please review the error details below and try again.",
    color: "#EF4444",
  },
  cancelled: {
    subject: "Port Request Cancelled",
    heading: "Your Port Request Has Been Cancelled",
    message: "Your port request has been cancelled. If this was not intentional, please submit a new request.",
    color: "#6B7280",
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);

    const {
      to_email,
      business_name,
      phone_number,
      status,
      previous_status,
      target_port_date,
      actual_port_date,
      rejection_reason,
    }: PortStatusEmailRequest = await req.json();

    if (!to_email || !phone_number || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Don't send email if status hasn't changed
    if (previous_status && previous_status.toLowerCase() === status.toLowerCase()) {
      console.log('Status unchanged, skipping email');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Status unchanged' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusKey = status.toLowerCase();
    const statusInfo = STATUS_MESSAGES[statusKey] || STATUS_MESSAGES.pending;

    console.log(`Sending port status email to ${to_email} for status: ${status}`);

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusInfo.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <div style="display: inline-block; padding: 8px 16px; background-color: ${statusInfo.color}; border-radius: 9999px; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                ${status.replace(/_/g, ' ')}
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">
                ${statusInfo.heading}
              </h1>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                ${statusInfo.message}
              </p>
              
              <!-- Phone Number Box -->
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                      <span style="color: #71717a; font-size: 14px;">Phone Number</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                      <span style="color: #18181b; font-size: 14px; font-weight: 600; font-family: monospace;">${phone_number}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                      <span style="color: #71717a; font-size: 14px;">Business</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                      <span style="color: #18181b; font-size: 14px; font-weight: 600;">${business_name || 'Your Business'}</span>
                    </td>
                  </tr>
                  ${target_port_date ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                      <span style="color: #71717a; font-size: 14px;">Target Date</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;">
                      <span style="color: #18181b; font-size: 14px;">${new Date(target_port_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </td>
                  </tr>
                  ` : ''}
                  ${actual_port_date ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #71717a; font-size: 14px;">Completed On</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="color: #22c55e; font-size: 14px; font-weight: 600;">${new Date(actual_port_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              ${rejection_reason ? `
              <!-- Rejection Reason -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #dc2626;">Reason:</p>
                <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${rejection_reason}</p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL') || 'https://app.example.com'}/dashboard/settings" 
                   style="display: inline-block; padding: 12px 32px; background-color: #8B5CF6; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">
                  View Port Request Status
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f4f4f5; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #71717a;">
                You're receiving this email because you submitted a number porting request.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Port Notifications <onboarding@resend.dev>',
      to: [to_email],
      subject: `${statusInfo.subject} - ${phone_number}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, email_id: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending port status email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
