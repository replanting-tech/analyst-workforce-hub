// supabase/functions/send-notification-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Your custom email configuration
const emailConfig = {
  protocol: 'smtp',
  smtp_host: 'compnet-co-id.mail.protection.outlook.com',
  smtp_port: 25,
  crlf: "\r\n",
  newline: "\r\n"
};
function getPriorityBadgeColor(priority) {
  switch(priority){
    case "Very High":
      return "#dc3545";
    case "High":
      return "#fd7e14";
    case "Medium":
      return "#ffc107";
    case "Low":
      return "#0d6efd";
    case "Informational":
      return "#6c757d";
    default:
      return "#6c757d";
  }
}
function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function createEmailTemplate(data) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        Security Incident Notification
      </h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #495057;">Incident Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Incident Number:</td>
            <td style="padding: 8px 0;">${data.incidentNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
            <td style="padding: 8px 0;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: ${getPriorityBadgeColor(data.priority)}; 
                           color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                ${data.priority}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Assigned Analyst:</td>
            <td style="padding: 8px 0;">${data.analystName} (${data.analystCode})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Status:</td>
            <td style="padding: 8px 0;">${data.status}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Created:</td>
            <td style="padding: 8px 0;">${formatDateTime(data.creationTime)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Workspace:</td>
            <td style="padding: 8px 0;">${data.workspaceName}</td>
          </tr>
        </table>
      </div>

      ${data.recommendation ? `
      <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
        <h4 style="margin-top: 0; color: #0056b3;">Analyst Recommendation</h4>
        <p style="line-height: 1.6; color: #495057;">${data.recommendation}</p>
      </div>
      ` : ''}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
        <p>This is an automated notification from the Analyst Workforce Hub.</p>
        <p>For more details, please access the incident management system.</p>
        <p><strong>Compnet SOC Team</strong></p>
      </div>
    </div>
  `;
  const textContent = `
Security Incident Notification

Incident Details:
- Incident Number: ${data.incidentNumber}
- Customer: ${data.customerName}
- Priority: ${data.priority}
- Assigned Analyst: ${data.analystName} (${data.analystCode})
- Status: ${data.status}
- Created: ${formatDateTime(data.creationTime)}
- Workspace: ${data.workspaceName}

${data.recommendation ? `Analyst Recommendation:\n${data.recommendation}\n\n` : ''}

This is an automated notification from the Analyst Workforce Hub.

Compnet SOC Team
  `;
  return {
    htmlContent,
    textContent
  };
}
// Base64 encode function for SMTP AUTH
function base64Encode(str) {
  return btoa(str);
}
// Create MIME message
function createMimeMessage(from, to, subject, htmlContent, textContent) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const crlf = emailConfig.crlf;
  let message = `From: ${from}${crlf}`;
  message += `To: ${to}${crlf}`;
  message += `Subject: ${subject}${crlf}`;
  message += `MIME-Version: 1.0${crlf}`;
  message += `Content-Type: multipart/alternative; boundary="${boundary}"${crlf}`;
  message += `X-Mailer: Compnet SOC Hub${crlf}`;
  message += crlf;
  // Plain text part
  message += `--${boundary}${crlf}`;
  message += `Content-Type: text/plain; charset=utf-8${crlf}`;
  message += `Content-Transfer-Encoding: 8bit${crlf}`;
  message += crlf;
  message += textContent + crlf;
  // HTML part
  message += `--${boundary}${crlf}`;
  message += `Content-Type: text/html; charset=utf-8${crlf}`;
  message += `Content-Transfer-Encoding: 8bit${crlf}`;
  message += crlf;
  message += htmlContent + crlf;
  // End boundary
  message += `--${boundary}--${crlf}`;
  return message;
}
// Send email using native TCP connection
async function sendEmailViaSMTP(from, to, subject, htmlContent, textContent) {
  try {
    // Connect to SMTP server
    const conn = await Deno.connect({
      hostname: emailConfig.smtp_host,
      port: emailConfig.smtp_port
    });
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const crlf = emailConfig.crlf;
    // Helper function to read response
    async function readResponse() {
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      return decoder.decode(buffer.subarray(0, bytesRead || 0));
    }
    // Helper function to send command
    async function sendCommand(command) {
      await conn.write(encoder.encode(command + crlf));
      return await readResponse();
    }
    // SMTP conversation
    let response = await readResponse(); // Server greeting
    console.log('Server greeting:', response);
    response = await sendCommand('EHLO localhost');
    console.log('EHLO response:', response);
    response = await sendCommand(`MAIL FROM:<${from}>`);
    console.log('MAIL FROM response:', response);
    response = await sendCommand(`RCPT TO:<${to}>`);
    console.log('RCPT TO response:', response);
    response = await sendCommand('DATA');
    console.log('DATA response:', response);
    // Send the email message
    const message = createMimeMessage(from, to, subject, htmlContent, textContent);
    await conn.write(encoder.encode(message + crlf + '.' + crlf));
    response = await readResponse();
    console.log('Message response:', response);
    // Quit
    await sendCommand('QUIT');
    // Close connection
    conn.close();
    return {
      success: true,
      message: 'Email sent successfully via SMTP'
    };
  } catch (error) {
    console.error('SMTP Error:', error);
    return {
      success: false,
      message: 'Failed to send email via SMTP',
      error: error.message
    };
  }
}
serve(async (req)=>{
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const emailRequest = await req.json();
    const { htmlContent, textContent } = createEmailTemplate(emailRequest);
    // Send email using your SMTP configuration
    const result = await sendEmailViaSMTP('noreply@compnet.co.id', emailRequest.customerEmail, `Security Incident Alert - ${emailRequest.incidentNumber}`, htmlContent, textContent);
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: result.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send email'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
