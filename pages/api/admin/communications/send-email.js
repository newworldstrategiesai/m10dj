import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Accept both parameter names for flexibility
  const { 
    contactId, 
    submissionId,
    to, 
    subject, 
    content, 
    body,
    originalTemplate 
  } = req.body;

  const emailTo = to;
  const emailSubject = subject;
  const emailContent = content || body;
  const recordId = contactId || submissionId;

  if (!emailTo || !emailSubject || !emailContent) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and content/body are required' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured. Please set RESEND_API_KEY.' });
  }

  try {
    // Create professional HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0; font-size: 24px;">M10 DJ Company</h1>
          <p style="color: #000; margin: 5px 0 0 0; font-size: 14px;">Premium Event Entertainment</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">
${emailContent}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #fcba00; text-align: center;">
            <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">Phone:</strong> (901) 410-2020</p>
            <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">Email:</strong> djbenmurray@gmail.com</p>
            <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">Website:</strong> m10djcompany.com</p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">
              M10 DJ Company - Memphis, TN & Surrounding Areas
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: 'M10 DJ Company <onboarding@resend.dev>', // Using Resend's verified domain initially
      to: [emailTo],
      subject: emailSubject,
      html: htmlContent,
      text: emailContent // Plain text fallback
    });

    // Log the communication in database (if recordId provided)
    if (recordId) {
      const supabase = createClient();
      
      const { error: logError } = await supabase
        .from('communication_log')
        .insert([{
          contact_submission_id: recordId,
          communication_type: 'email',
          direction: 'outbound',
          subject: emailSubject,
          content: emailContent,
          sent_by: 'Admin',
          sent_to: emailTo,
          status: 'sent',
          metadata: {
            resend_id: emailResult.data?.id,
            template_used: originalTemplate || null
          }
        }]);

      if (logError) {
        console.error('Error logging email communication:', logError);
        // Don't fail the request if logging fails
      }

      // Update last contact date on the submission
      const { error: updateError } = await supabase
        .from('contact_submissions')
        .update({ 
          last_contact_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (updateError) {
        console.error('Error updating last contact date:', updateError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      emailId: emailResult.data?.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Try to log the failed attempt (if recordId provided)
    if (recordId) {
      try {
        const supabase = createClient();
        await supabase
          .from('communication_log')
          .insert([{
            contact_submission_id: recordId,
            communication_type: 'email',
            direction: 'outbound',
            subject: emailSubject,
            content: emailContent,
            sent_by: 'Admin',
            sent_to: emailTo,
            status: 'failed',
            metadata: { error: error.message }
          }]);
      } catch (logError) {
        console.error('Error logging failed email:', logError);
      }
    }

    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message 
    });
  }
}