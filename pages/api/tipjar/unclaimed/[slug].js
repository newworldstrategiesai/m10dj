/**
 * Get Unclaimed Tip Jar Page Status
 * 
 * Public endpoint to check status of unclaimed Tip Jar page.
 * Returns page info and pending tips (if any).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Valid slug is required' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get organization by slug
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug, name, prospect_email, is_claimed, claim_token, claim_token_expires_at, product_context, subscription_status')
      .eq('slug', slug)
      .eq('product_context', 'tipjar')
      .single();
    
    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Check if organization is unclaimed
    if (organization.is_claimed) {
      return res.status(200).json({
        organization: {
          slug: organization.slug,
          name: organization.name,
          is_claimed: true
        },
        claim_available: false,
        message: 'This organization has already been claimed'
      });
    }
    
    // Get unclaimed tip balance
    const { data: tipBalance } = await supabaseAdmin
      .from('unclaimed_tip_balance')
      .select('net_amount_cents, tip_count, last_tip_at, is_transferred')
      .eq('organization_id', organization.id)
      .single();
    
    const pendingTipsCents = tipBalance?.net_amount_cents || 0;
    const tipCount = tipBalance?.tip_count || 0;
    const hasPendingTips = pendingTipsCents > 0 && !tipBalance?.is_transferred;
    
    // Generate claim link if token exists and not expired
    let claimLink = null;
    let claimAvailable = false;
    
    if (organization.claim_token) {
      const expiresAt = organization.claim_token_expires_at 
        ? new Date(organization.claim_token_expires_at)
        : null;
      
      if (!expiresAt || expiresAt > new Date()) {
        claimAvailable = true;
        const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
        claimLink = `${baseUrl}/tipjar/claim?token=${organization.claim_token}`;
      }
    }
    
    return res.status(200).json({
      organization: {
        slug: organization.slug,
        name: organization.name,
        is_claimed: false,
        pending_tips_cents: pendingTipsCents,
        pending_tips_dollars: (pendingTipsCents / 100).toFixed(2),
        tip_count: tipCount,
        last_tip_at: tipBalance?.last_tip_at || null,
        has_pending_tips: hasPendingTips
      },
      claim_available: claimAvailable,
      claim_link: claimLink
    });
    
  } catch (error) {
    console.error('Error in unclaimed status endpoint:', error);
    return res.status(500).json({
      error: 'Failed to get page status',
      message: error.message
    });
  }
}

