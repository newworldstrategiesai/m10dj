/**
 * Send Welcome Email for Created Organization (Super Admin Only)
 * 
 * Allows super admin to manually send welcome email after reviewing the page
 */

import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { sendProspectWelcomeEmail } from '@/lib/email/tipjar-batch-emails';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require super admin authentication
    const user = await requireSuperAdmin(req, res);
    
    const { organization_id, prospect_email } = req.body;

    if (!organization_id || !prospect_email) {
      return res.status(400).json({ error: 'organization_id and prospect_email are required' });
    }

    // Fetch organization details
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, artist_name, prospect_email, claim_token, product_context')
      .eq('id', organization_id)
      .eq('prospect_email', prospect_email.toLowerCase())
      .single();

    if (orgError || !organization) {
      console.error('Organization not found:', orgError);
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
    const pageUrl = `${baseUrl}/${organization.slug}/requests`;
    const claimUrl = organization.claim_token 
      ? `${baseUrl}/tipjar/claim?token=${organization.claim_token}`
      : `${baseUrl}/tipjar/claim`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}`;

    // Send welcome email
    const emailResult = await sendProspectWelcomeEmail({
      prospectEmail: organization.prospect_email,
      prospectName: organization.artist_name || organization.name,
      businessName: organization.name,
      pageUrl,
      claimLink: claimUrl,
      qrCodeUrl,
      productContext: organization.product_context || 'tipjar'
    });

    if (!emailResult.success) {
      console.error('Error sending welcome email:', emailResult.error);
      return res.status(500).json({
        error: 'Failed to send email',
        details: emailResult.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.prospect_email
      }
    });

  } catch (error) {
    console.error('Error in send-welcome-email endpoint:', error);
    if (error.message === 'Super admin access required') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Failed to send welcome email',
      message: error.message
    });
  }
}

