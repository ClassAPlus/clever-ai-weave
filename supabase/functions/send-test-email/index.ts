import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  to_email: string;
  from_email?: string;
  business_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, from_email, business_name }: TestEmailRequest = await req.json();

    if (!to_email) {
      throw new Error("Recipient email (to_email) is required");
    }

    console.log(`Sending test email to ${to_email} from ${from_email || 'default sender'}`);

    const senderAddress = from_email || 'Test Email <onboarding@resend.dev>';
    const displayName = business_name || 'Your Business';

    const emailResponse = await resend.emails.send({
      from: senderAddress,
      to: [to_email],
      subject: `Test Email from ${displayName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6, #A855F7); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { color: #059669; font-weight: 600; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Test Email Successful</h1>
            </div>
            <div class="content">
              <p class="success">Your email configuration is working correctly!</p>
              <p>This test email was sent from:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${senderAddress}
              </p>
              <p>If you received this email, your Resend sender address is properly configured and verified.</p>
              <div class="footer">
                <p>Sent at ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
