/**
 * List Batch Created Tip Jar Organizations (Admin Only)
 * 
 * Returns list of organizations created via batch creation,
 * with filtering by status (unclaimed/claimed).
 */

import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require super admin authentication (djbenmurray@gmail.com only)
    const user = await requireSuperAdmin(req, res);
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get query parameters
    const {
      status = 'all', // 'unclaimed', 'claimed', 'all'
      created_by,
      limit = 50,
      offset = 0,
      search // Search by email, slug, or name
    } = req.query;
    
    // Build query
    let query = supabaseAdmin
      .from('organizations')
      .select(`
        id,
        slug,
        name,
        prospect_email,
        prospect_phone,
        is_claimed,
        claimed_at,
        created_at,
        created_by_admin_id,
        product_context,
        subscription_status,
        claim_token_expires_at
      `)
      .eq('product_context', 'tipjar')
      .not('created_by_admin_id', 'is', null) // Only batch-created orgs
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    // Filter by status
    if (status === 'unclaimed') {
      query = query.eq('is_claimed', false);
    } else if (status === 'claimed') {
      query = query.eq('is_claimed', true);
    }
    
    // Filter by creator
    if (created_by) {
      query = query.eq('created_by_admin_id', created_by);
    }
    
    // Search filter
    if (search) {
      query = query.or(`prospect_email.ilike.%${search}%,slug.ilike.%${search}%,name.ilike.%${search}%`);
    }
    
    const { data: organizations, error: orgError } = await query;
    
    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return res.status(500).json({
        error: 'Failed to fetch organizations',
        details: orgError.message
      });
    }
    
    // Get tip balances for all organizations
    const orgIds = organizations.map(org => org.id);
    const { data: tipBalances } = await supabaseAdmin
      .from('unclaimed_tip_balance')
      .select('organization_id, net_amount_cents, tip_count, last_tip_at, is_transferred')
      .in('organization_id', orgIds);
    
    // Create map of tip balances
    const tipBalanceMap = new Map();
    if (tipBalances) {
      tipBalances.forEach(balance => {
        tipBalanceMap.set(balance.organization_id, balance);
      });
    }
    
    // Enrich organizations with tip balance data
    const enrichedOrgs = organizations.map(org => {
      const balance = tipBalanceMap.get(org.id);
      const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
      
      return {
        ...org,
        url: `${baseUrl}/${org.slug}/requests`,
        pending_tips_cents: balance?.net_amount_cents || 0,
        pending_tips_dollars: ((balance?.net_amount_cents || 0) / 100).toFixed(2),
        tip_count: balance?.tip_count || 0,
        last_tip_at: balance?.last_tip_at || null,
        has_pending_tips: (balance?.net_amount_cents || 0) > 0 && !balance?.is_transferred,
        claim_token_expired: org.claim_token_expires_at 
          ? new Date(org.claim_token_expires_at) < new Date()
          : false
      };
    });
    
    // Get counts for summary
    const { count: totalCount } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('product_context', 'tipjar')
      .not('created_by_admin_id', 'is', null);
    
    const { count: unclaimedCount } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('product_context', 'tipjar')
      .eq('is_claimed', false)
      .not('created_by_admin_id', 'is', null);
    
    const { count: claimedCount } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('product_context', 'tipjar')
      .eq('is_claimed', true)
      .not('created_by_admin_id', 'is', null);
    
    return res.status(200).json({
      organizations: enrichedOrgs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalCount || 0
      },
      summary: {
        total: totalCount || 0,
        unclaimed: unclaimedCount || 0,
        claimed: claimedCount || 0
      }
    });
    
  } catch (error) {
    console.error('Error in batch-created endpoint:', error);
    return res.status(500).json({
      error: 'Failed to fetch batch-created organizations',
      message: error.message
    });
  }
}

