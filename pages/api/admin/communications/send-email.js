import { Resend } from 'resend';
const { createClient } = require('@supabase/supabase-js');
const { sendEmailViaGmail } = require('../../../../utils/gmail-sender');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  // Validate email address before sending
  const { validateEmail } = require('../../../../utils/form-validator');
  const emailValidation = validateEmail(emailTo);
  if (!emailValidation.valid) {
    console.error('❌ Invalid email address:', emailTo, emailValidation.error);
    return res.status(400).json({ 
      error: 'Invalid email address', 
      details: emailValidation.error 
    });
  }

  // Check for test/invalid email patterns that shouldn't be sent
  const invalidEmailPatterns = [
    /^test@/i,
    /@test\./i,
    /@example\./i,
    /fake@/i,
    /temp@/i,
    /@temp\./i,
    /@invalid\./i
  ];
  
  const isInvalidEmail = invalidEmailPatterns.some(pattern => pattern.test(emailTo));
  if (isInvalidEmail) {
    console.error('❌ Attempted to send to test/invalid email:', emailTo);
    return res.status(400).json({ 
      error: 'Cannot send to test or invalid email addresses',
      details: 'Please use a valid email address'
    });
  }

  // Get organization ID from contact
  let organizationId = null;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  if (recordId) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('organization_id')
      .eq('id', recordId)
      .single();
    
    if (contact?.organization_id) {
      organizationId = contact.organization_id;
    }
  }

  // Check if Gmail is connected for this organization
  let useGmail = false;
  if (organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('email_provider, gmail_email_address')
      .eq('id', organizationId)
      .single();
    
    if (org?.email_provider === 'gmail' && org.gmail_email_address) {
      useGmail = true;
    }
  }

  // Validate email service availability
  if (!useGmail && !resend) {
    console.error('❌ No email service configured');
    return res.status(500).json({ 
      error: 'Email service not configured. Please connect Gmail or set RESEND_API_KEY environment variable.' 
    });
  }

  console.log(`📧 Attempting to send email via ${useGmail ? 'Gmail' : 'Resend'}...`);
  console.log(`   To: ${emailTo}`);
  console.log(`   Subject: ${emailSubject}`);
  console.log(`   From: ${useGmail ? 'Gmail Account' : 'M10 DJ Company <hello@m10djcompany.com>'}`);

  try {
    // Convert plain text to HTML, converting quote links to buttons
    let htmlEmailContent = emailContent;
    
    // Convert quote links to styled buttons
    // Pattern: Look for quote links in format: https://.../quote/[uuid] or http://.../quote/[uuid]
    const quoteLinkRegex = /(https?:\/\/[^\s]+\/quote\/[a-f0-9-]{36})/gi;
    htmlEmailContent = htmlEmailContent.replace(quoteLinkRegex, (match) => {
      return `<div style="text-align: center; margin: 25px 0;">
        <a href="${match}" 
           style="display: inline-block; background: linear-gradient(135deg, #fcba00, #e6a800); color: #000; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;">
          View Pricing
        </a>
      </div>`;
    });
    
    // Convert line breaks and preserve formatting
    htmlEmailContent = htmlEmailContent
      .replace(/\n/g, '<br>')
      .replace(/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g, '<hr style="border: none; border-top: 2px solid #fcba00; margin: 20px 0;">');
    
    // Create professional HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0; font-size: 24px;">M10 DJ Company</h1>
          <p style="color: #000; margin: 5px 0 0 0; font-size: 14px;">Premium Event Entertainment</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="color: #333; line-height: 1.6;">
${htmlEmailContent}
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

    // Send email via Gmail or Resend
    let emailResult;
    let emailId;
    
    if (useGmail) {
      // Send via Gmail
      const gmailResult = await sendEmailViaGmail({
        organizationId,
        to: emailTo,
        subject: emailSubject,
        htmlContent: htmlContent,
        textContent: emailContent
      });
      
      emailId = gmailResult.messageId;
      emailResult = { data: { id: gmailResult.messageId }, error: null };
      
      console.log('✅ Email sent via Gmail successfully');
      console.log(`   Message ID: ${gmailResult.messageId}`);
    } else {
      // Send via Resend
      emailResult = await resend.emails.send({
        from: 'M10 DJ Company <hello@m10djcompany.com>', // Using verified custom domain
        to: [emailTo],
        subject: emailSubject,
        html: htmlContent,
        text: emailContent // Plain text fallback
      });

      console.log('✅ Email sent via Resend successfully');
      console.log(`   Email ID: ${emailResult.data?.id}`);
      console.log(`   Status: ${emailResult.error ? 'ERROR' : 'SUCCESS'}`);
      
      if (emailResult.error) {
        console.error('❌ Resend API Error:', emailResult.error);
        throw new Error(`Resend API error: ${JSON.stringify(emailResult.error)}`);
      }
      
      emailId = emailResult.data?.id;
    }

    // Log the communication in database (if recordId provided)
    if (recordId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get organization_id from contact or contact_submission
      let organizationId = null;
      const { data: contact } = await supabase
        .from('contacts')
        .select('organization_id')
        .eq('id', recordId)
        .single();
      
      if (contact?.organization_id) {
        organizationId = contact.organization_id;
      } else {
        // Try contact_submissions if not found in contacts
        const { data: submission } = await supabase
          .from('contact_submissions')
          .select('organization_id')
          .eq('id', recordId)
          .single();
        
        if (submission?.organization_id) {
          organizationId = submission.organization_id;
        }
      }
      
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
          organization_id: organizationId, // Set organization_id for multi-tenant isolation
          metadata: {
            email_id: emailId,
            provider: useGmail ? 'gmail' : 'resend',
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
      emailId: emailId,
      message: `Email sent successfully via ${useGmail ? 'Gmail' : 'Resend'}`
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    // Try to log the failed attempt (if recordId provided)
    if (recordId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get organization_id from contact or contact_submission
        let organizationId = null;
        const { data: contact } = await supabase
          .from('contacts')
          .select('organization_id')
          .eq('id', recordId)
          .single();
        
        if (contact?.organization_id) {
          organizationId = contact.organization_id;
        } else {
          // Try contact_submissions if not found in contacts
          const { data: submission } = await supabase
            .from('contact_submissions')
            .select('organization_id')
            .eq('id', recordId)
            .single();
          
          if (submission?.organization_id) {
            organizationId = submission.organization_id;
          }
        }
        
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
            organization_id: organizationId, // Set organization_id for multi-tenant isolation
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