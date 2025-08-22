import nodemailer from 'nodemailer';

// Default email configuration
const defaultConfig = {
  protocol: 'smtp',
  smtp_host: 'compnet-co-id.mail.protection.outlook.com',
  smtp_port: 25,
  crlf: "\r\n",
  newline: "\r\n"
};

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config = defaultConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: false, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: false // for self-signed certificates
      }
    });
  }

  /**
   * Send an email
   * @param {Object} mailOptions - Email options
   * @param {string} mailOptions.from - Sender email address
   * @param {string|string[]} mailOptions.to - Comma separated list or array of recipients
   * @param {string} mailOptions.subject - Subject of the email
   * @param {string} mailOptions.text - Plain text body
   * @param {string} mailOptions.html - HTML body
   * @returns {Promise<Object>} - Result of the email sending operation
   */
  async sendEmail(mailOptions: {
    from: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }): Promise<{ success: boolean; message: string; error?: unknown }> {
    try {
      const info = await this.transporter.sendMail({
        ...mailOptions,
        // Ensure line endings are consistent
        headers: {
          'X-Mailer': 'Analyst Workforce Hub',
          'MIME-Version': '1.0',
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Transfer-Encoding': '7bit'
        }
      });

      return {
        success: true,
        message: `Email sent: ${info.messageId}`,
        ...info
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error
      };
    }
  }

  /**
   * Update the email configuration at runtime
   * @param {Object} newConfig - New email configuration
   */
  updateConfig(newConfig: typeof defaultConfig) {
    this.transporter = nodemailer.createTransport({
      host: newConfig.smtp_host,
      port: newConfig.smtp_port,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
}

// Create a singleton instance
export const emailService = new EmailService();

export default emailService;

// async function sendEmail() {
//     if (!incident) return;

//     const payload = {
//       incidentId: incident.id,
//       customerName: incident.customer_name,
//       customerEmail: "harrysunaryo03@gmail.com",
//       incidentNumber: incident.incident_number,
//       priority: incident.priority,
//       analystName: incident.analyst_name,
//       recommendation: recommendationAnalysis || undefined,
//     };

//     try {
//       const response = await fetch(
//         "https://xmozpbewjkeisvpfzeca.supabase.co/functions/v1/send-notification-email",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtb3pwYmV3amtlaXN2cGZ6ZWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDM3MDMsImV4cCI6MjA2Nzc3OTcwM30.goD6H9fLQPljKpifLlLIU6_Oo4jJO7b2-8GlkeqkiKA`,
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       const result = await response.json();

//       if (!response.ok) {
//         console.error("Failed to send email:", result.error);
//         alert("Failed to send email.");
//       } else {
//         console.log("Email sent successfully:", result);
//         await updateCustomerNotificationStatus();
//         alert("Email sent and notification status updated!");
//       }
//     } catch (err) {
//       console.error("Unexpected error:", err);
//       alert("An unexpected error occurred.");
//     }
//   }