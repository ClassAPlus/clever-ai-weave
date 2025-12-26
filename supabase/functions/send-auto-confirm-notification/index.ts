import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutoConfirmNotificationRequest {
  appointmentId: string;
  businessId: string;
  contactName: string;
  contactPhone: string;
  scheduledAt: string;
  serviceType?: string;
  templateName: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AutoConfirmNotificationRequest = await req.json();
    console.log("Received auto-confirm notification request:", body);

    const { appointmentId, businessId, contactName, contactPhone, scheduledAt, serviceType, templateName } = body;

    // Fetch business details for owner email
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("name, owner_email, owner_notification_channels")
      .eq("id", businessId)
      .single();

    if (businessError) {
      console.error("Error fetching business:", businessError);
      throw new Error("Failed to fetch business details");
    }

    if (!business?.owner_email) {
      console.log("No owner email configured, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No owner email configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email notifications are enabled
    const notificationChannels = business.owner_notification_channels || ["sms"];
    if (!notificationChannels.includes("email")) {
      console.log("Email notifications not enabled for this business");
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications not enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format the date for display
    const appointmentDate = new Date(scheduledAt);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Send email notification
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
              ✓ Appointment Auto-Confirmed
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
              A new appointment has been automatically confirmed using the <strong style="color: #8b5cf6;">${templateName}</strong> template.
            </p>
            
            <!-- Appointment Details Card -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #10b981;">
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Appointment Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Customer:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${contactName || "Unknown"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${contactPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${formattedTime}</td>
                </tr>
                ${serviceType ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px;">${serviceType}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            
            <!-- Status Badge -->
            <div style="margin-top: 20px; text-align: center;">
              <span style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                ✓ Confirmed
              </span>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated notification from ${business.name}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending auto-confirm notification email to:", business.owner_email);

    const emailResponse = await resend.emails.send({
      from: "Appointments <onboarding@resend.dev>",
      to: [business.owner_email],
      subject: `✓ Auto-Confirmed: ${contactName || "New"} appointment on ${formattedDate}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the notification in owner_notifications table
    await supabase.from("owner_notifications").insert({
      business_id: businessId,
      notification_type: "appointment_auto_confirmed",
      channel: "email",
      content: `Auto-confirmed appointment for ${contactName || contactPhone} on ${formattedDate} at ${formattedTime}`,
      related_appointment_id: appointmentId,
      delivered: true,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-auto-confirm-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
