/**
 * Create Standalone Contract API
 * 
 * Creates contracts that aren't tied to events, bookings, or quotes.
 * Used for NDAs, personal agreements, etc.
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    templateId,
    templateName,
    recipientName,
    recipientEmail,
    recipientPhone,
    senderName,
    senderEmail,
    purpose,
    governingState,
    termYears,
    isPersonal,
    customFields,
    sendImmediately
  } = req.body;

  // Validate required fields
  if (!recipientName || !recipientEmail) {
    return res.status(400).json({ error: 'Recipient name and email are required' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only administrators can create standalone contracts' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get template if specified
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabaseAdmin
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      template = templateData;
    } else if (templateName) {
      const { data: templateData } = await supabaseAdmin
        .from('contract_templates')
        .select('*')
        .eq('name', templateName)
        .single();
      template = templateData;
    }

    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    // Generate contract number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const { count: todayCount } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().slice(0, 10) + 'T00:00:00Z')
      .lt('created_at', today.toISOString().slice(0, 10) + 'T23:59:59Z');
    
    const sequenceNum = String((todayCount || 0) + 1).padStart(3, '0');
    const contractNumber = `${isPersonal ? 'NDA' : 'CONT'}-${dateStr}-${sequenceNum}`;

    // Generate signing token (24-hour expiry for personal contracts)
    const signingToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 day expiry

    // Prepare template variables
    const effectiveDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const variables = {
      contract_number: contractNumber,
      effective_date: effectiveDate,
      party_a_name: senderName || session.user.user_metadata?.full_name || 'Party A',
      party_a_email: senderEmail || session.user.email,
      party_b_name: recipientName,
      party_b_email: recipientEmail,
      term_years: termYears || 7,
      governing_state: governingState || 'Tennessee',
      signature_date: effectiveDate,
      signature_area_party_a: '<div style="height: 60px; border-bottom: 1px solid #333;"></div>',
      signature_area_party_b: '<div style="height: 60px; border-bottom: 1px solid #333;"></div>',
      ...customFields
    };

    // Render template
    let contractHtml = template.template_content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      contractHtml = contractHtml.replace(regex, value || '');
    });

    // Determine contract type
    let contractType = template.template_type || 'general';
    if (contractType === 'personal_agreement') {
      contractType = 'personal_agreement';
    } else if (template.name?.includes('nda')) {
      contractType = 'nda';
    }

    // Create contract
    const contractData = {
      contract_number: contractNumber,
      contract_type: contractType,
      contract_template: template.name,
      contract_html: contractHtml,
      
      // Recipient info (no contact_id needed)
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      recipient_phone: recipientPhone,
      
      // Sender info
      sender_name: senderName || session.user.user_metadata?.full_name,
      sender_email: senderEmail || session.user.email,
      
      // Contract details
      purpose: purpose || template.description,
      governing_state: governingState || 'Tennessee',
      term_years: termYears || 7,
      is_personal: isPersonal || contractType === 'personal_agreement',
      custom_fields: customFields || {},
      
      // Signing
      signing_token: signingToken,
      signing_token_expires_at: tokenExpiry.toISOString(),
      
      // Status
      status: sendImmediately ? 'sent' : 'draft',
      sent_at: sendImmediately ? new Date().toISOString() : null,
      
      // Dates
      effective_date: new Date().toISOString().slice(0, 10)
    };

    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .insert([contractData])
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
      return res.status(500).json({ error: 'Failed to create contract', details: contractError.message });
    }

    // Generate signing URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
    const signingUrl = `${baseUrl}/sign/${signingToken}`;

    // Send email if requested
    if (sendImmediately) {
      try {
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `${senderName || 'Someone'} has sent you a document to sign`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Document Ready for Your Signature</h2>
                <p>Hello ${recipientName},</p>
                <p><strong>${senderName || 'Someone'}</strong> has sent you a document that requires your signature:</p>
                <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                  <strong>${template.description || 'Agreement'}</strong>
                </p>
                <p>Please review and sign this document by clicking the button below:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${signingUrl}" 
                     style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Review & Sign Document
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  This link will expire in 7 days. If you have any questions, please contact ${senderEmail || 'the sender'}.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px;">
                  Agreement ID: ${contractNumber}
                </p>
              </div>
            `
          })
        });

        console.log(`✅ Signing invitation sent to ${recipientEmail}`);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        status: contract.status,
        recipient_name: contract.recipient_name,
        recipient_email: contract.recipient_email
      },
      signingUrl,
      message: sendImmediately 
        ? `Contract sent to ${recipientEmail}` 
        : 'Contract created as draft'
    });

  } catch (error) {
    console.error('Error creating standalone contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


