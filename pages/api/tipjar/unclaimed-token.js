/**
 * Get Unclaimed Tip Jar Organization by Claim Token
 * 
 * Public endpoint to get organization info by claim token.
 * Used by claim page to verify token and display organization info.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Valid claim token is required' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get organization by claim token
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug, name, prospect_email, is_claimed, claim_token, claim_token_expires_at, product_context, subscription_status')
      .eq('claim_token', token)
      .eq('product_context', 'tipjar')
      .maybeSingle();
    
    if (orgError || !organization) {
      return res.status(404).json({ error: 'Invalid or expired claim token' });
    }

    // Check if organization is already claimed
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

    // Check if token is expired
    if (organization.claim_token_expires_at) {
      const expiresAt = new Date(organization.claim_token_expires_at);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: 'Claim token has expired' });
      }
    }

    // Get unclaimed tip balance
    const { data: tipBalance } = await supabaseAdmin
      .from('unclaimed_tip_balance')
      .select('net_amount_cents, tip_count, last_tip_at, is_transferred')
      .eq('organization_id', organization.id)
      .maybeSingle();
    
    const pendingTipsCents = tipBalance?.net_amount_cents || 0;
    const tipCount = tipBalance?.tip_count || 0;
    const hasPendingTips = pendingTipsCents > 0 && !tipBalance?.is_transferred;
    
    return res.status(200).json({
      organization: {
        slug: organization.slug,
        name: organization.name,
        prospect_email: organization.prospect_email,
        is_claimed: false,
        pending_tips_cents: pendingTipsCents,
        pending_tips_dollars: (pendingTipsCents / 100).toFixed(2),
        tip_count: tipCount,
        last_tip_at: tipBalance?.last_tip_at || null,
        has_pending_tips: hasPendingTips
      },
      claim_available: true
    });
    
  } catch (error) {
    console.error('Error in unclaimed-token endpoint:', error);
    return res.status(500).json({
      error: 'Failed to verify claim token',
      message: error.message
    });
  }
}

