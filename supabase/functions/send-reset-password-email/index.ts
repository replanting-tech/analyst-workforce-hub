
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  const { email, resetLink } = await req.json()

  if (!email || !resetLink) {
    return new Response(JSON.stringify({ error: 'Email and reset link are required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  try {
    // Primary email and fallback email
    const recipients = [email, 'harry.sunaryo@compnet.co.id']
    
    // Remove duplicates in case the analyst email is the same as fallback
    const uniqueRecipients = [...new Set(recipients)]
    
    const emailResponse = await resend.emails.send({
      from: 'Cyber Command System <noreply@compnet.co.id>',
      to: uniqueRecipients,
      subject: 'Password Reset Request - Cyber Command System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Password Reset Request</h1>
            <p style="color: #6b7280; margin: 0;">Cyber Command System</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              A password reset has been requested for the analyst account: <strong>${email}</strong>
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              Click the button below to reset your password. This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 14px;">Security Notice</h3>
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              If you didn't request this password reset, please ignore this email or contact your system administrator.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
            This email was sent to multiple recipients including the analyst and system administrator for security purposes.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © 2025 Compnet Cyber Command System. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log('Reset password email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Reset password email sent successfully',
      recipients: uniqueRecipients 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error sending reset password email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
