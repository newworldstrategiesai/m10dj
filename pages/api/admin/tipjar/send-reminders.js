/**
 * Send Claim Reminder Emails (Admin Only)
 * 
 * Sends reminder emails to prospects who haven't claimed their Tip Jar pages.
 * Can be scheduled to run periodically (e.g., via cron job).
 */

import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { sendClaimReminderEmail } from '@/lib/email/tipjar-batch-emails';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require super admin authentication (djbenmurray@gmail.com only)
    const user = await requireSuperAdmin(req, res);
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const {
      daysSinceCreation = 7, // Send reminders to orgs created X days ago
      onlyWithTips = false, // Only send to orgs that have received tips
      organizationIds = null // Optional: specific org IDs to send reminders to
    } = req.body;

    // Build query for unclaimed organizations
    let query = supabaseAdmin
      .from('organizations')
      .select('id, slug, name, prospect_email, created_at, claim_token, claim_token_expires_at, product_context')
      .eq('product_context', 'tipjar')
      .eq('is_claimed', false)
      .not('created_by_admin_id', 'is', null) // Only batch-created orgs
      .gte('created_at', new Date(Date.now() - (daysSinceCreation + 1) * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', new Date(Date.now() - daysSinceCreation * 24 * 60 * 60 * 1000).toISOString());

    // Filter by specific org IDs if provided
    if (organizationIds && Array.isArray(organizationIds) && organizationIds.length > 0) {
      query = query.in('id', organizationIds);
    }

    const { data: organizations, error: orgError } = await query;

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return res.status(500).json({
        error: 'Failed to fetch organizations',
        details: orgError.message
      });
    }

    if (!organizations || organizations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No organizations found matching criteria',
        sent: 0,
        failed: 0
      });
    }

    // Get tip balances for organizations
    const orgIds = organizations.map(org => org.id);
    const { data: tipBalances } = await supabaseAdmin
      .from('unclaimed_tip_balance')
      .select('organization_id, net_amount_cents, tip_count, last_tip_at, is_transferred')
      .in('organization_id', orgIds);

    const tipBalanceMap = new Map();
    if (tipBalances) {
      tipBalances.forEach(balance => {
        tipBalanceMap.set(balance.organization_id, balance);
      });
    }

    // Filter organizations if onlyWithTips is true
    let orgsToRemind = organizations;
    if (onlyWithTips) {
      orgsToRemind = organizations.filter(org => {
        const balance = tipBalanceMap.get(org.id);
        return balance && balance.net_amount_cents > 0 && !balance.is_transferred;
      });
    }

    // Send reminder emails
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';

    for (const org of orgsToRemind) {
      try {
        // Check if claim token is expired (skip if expired)
        if (org.claim_token_expires_at) {
          const expiresAt = new Date(org.claim_token_expires_at);
          if (expiresAt < new Date()) {
            console.log(`Skipping ${org.prospect_email} - claim token expired`);
            continue;
          }
        }

        const balance = tipBalanceMap.get(org.id);
        const pendingTipsCents = balance?.net_amount_cents || 0;
        const tipCount = balance?.tip_count || 0;
        const pageUrl = `${baseUrl}/${org.slug}/requests`;
        const claimLink = `${baseUrl}/tipjar/claim?token=${org.claim_token}`;

        const emailResult = await sendClaimReminderEmail({
          prospectEmail: org.prospect_email,
          prospectName: org.name,
          businessName: org.name,
          pageUrl,
          claimLink,
          pendingTipsCents,
          tipCount,
          productContext: 'tipjar'
        });

        if (emailResult.success) {
          results.sent++;
          console.log(`✅ Sent reminder email to ${org.prospect_email}`);
        } else {
          results.failed++;
          results.errors.push({
            email: org.prospect_email,
            error: emailResult.error
          });
          console.error(`❌ Failed to send reminder to ${org.prospect_email}:`, emailResult.error);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: org.prospect_email,
          error: error.message || 'Unknown error'
        });
        console.error(`Error sending reminder to ${org.prospect_email}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${orgsToRemind.length} organizations`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error) {
    console.error('Error in send-reminders endpoint:', error);
    return res.status(500).json({
      error: 'Failed to send reminder emails',
      message: error.message
    });
  }
}

