
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  incidentId: string;
  customerName: string;
  customerEmail?: string;
  incidentNumber: string;
  priority: string;
  analystName: string;
  recommendation?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      incidentId, 
      customerName, 
      customerEmail, 
      incidentNumber, 
      priority, 
      analystName,
      recommendation 
    }: NotificationEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Security Team <onboarding@resend.dev>",
      to: [customerEmail || "customer@example.com"],
      subject: `Security Incident ${incidentNumber} - Customer Notification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Security Incident Notification</h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Incident Details</h3>
            <p><strong>Incident ID:</strong> ${incidentId}</p>
            <p><strong>Incident Number:</strong> ${incidentNumber}</p>
            <p><strong>Priority:</strong> <span style="color: ${priority === 'High' || priority === 'Very High' ? '#dc2626' : '#059669'}">${priority}</span></p>
            <p><strong>Assigned Analyst:</strong> ${analystName}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>Dear ${customerName},</h3>
            <p>We are writing to inform you about a security incident that has been detected and is currently being handled by our security operations team.</p>
            
            ${recommendation ? `
              <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; border-left: 4px solid #0288d1;">
                <h4 style="margin-top: 0; color: #0288d1;">Recommendation Analysis</h4>
                <div>${recommendation}</div>
              </div>
            ` : ''}
            
            <p>Our team is actively investigating this incident and will keep you updated on our progress. If you have any questions or concerns, please don't hesitate to contact us.</p>
          </div>

          <div style="margin: 30px 0; padding: 15px; background: #f9f9f9; border-radius: 5px;">
            <p style="margin: 0;"><strong>Security Operations Center</strong></p>
            <p style="margin: 5px 0;">Analyst: ${analystName}</p>
            <p style="margin: 5px 0;">This is an automated notification from our security incident management system.</p>
          </div>
        </div>
      `,
    });

    console.log("Customer notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
