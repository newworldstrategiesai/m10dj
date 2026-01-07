/**
 * Admin API: List all organizations with pending manual payouts
 * 
 * Returns organizations that have payments in platform account
 * that need to be manually transferred
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { findPendingManualPayouts } from '@/utils/stripe/manual-payouts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require platform admin
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = isPlatformAdmin(session.user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all organizations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, owner_id, stripe_connect_account_id, stripe_connect_onboarding_complete, product_context')
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }

    // Check each organization for pending manual payouts
    const organizationsWithPayouts = [];

    for (const org of organizations || []) {
      try {
        const payoutData = await findPendingManualPayouts(org.id);
        
        if (payoutData.payments.length > 0) {
          // Get owner email for display
          const { data: owner } = await supabaseAdmin.auth.admin.getUserById(org.owner_id);
          
          organizationsWithPayouts.push({
            organizationId: org.id,
            organizationName: org.name,
            ownerEmail: owner?.user?.email || 'Unknown',
            productContext: org.product_context || 'm10dj',
            hasConnect: !!org.stripe_connect_account_id && org.stripe_connect_onboarding_complete,
            connectAccountId: org.stripe_connect_account_id || null,
            totalPayments: payoutData.payments.length,
            totalAmount: payoutData.totalAmount, // in cents
            totalAfterFees: payoutData.totalAfterFees, // in cents
            platformFees: payoutData.totalAmount - payoutData.totalAfterFees, // in cents
            payments: payoutData.payments.map(p => ({
              paymentIntentId: p.paymentIntentId,
              amount: p.amount,
              created: new Date(p.created * 1000).toISOString(),
            })),
          });
        }
      } catch (error) {
        console.error(`Error checking payouts for organization ${org.id}:`, error);
        // Continue with other organizations
      }
    }

    // Sort by total amount (highest first)
    organizationsWithPayouts.sort((a, b) => b.totalAmount - a.totalAmount);

    return res.status(200).json({
      organizations: organizationsWithPayouts,
      totalOrganizations: organizationsWithPayouts.length,
      totalAmount: organizationsWithPayouts.reduce((sum, org) => sum + org.totalAmount, 0),
      totalAfterFees: organizationsWithPayouts.reduce((sum, org) => sum + org.totalAfterFees, 0),
    });
  } catch (error) {
    console.error('Error in manual payouts list API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

