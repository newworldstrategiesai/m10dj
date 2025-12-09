/**
 * Ensure Contract Exists for Quote
 * 
 * Lazy creation endpoint: Creates a draft contract if one doesn't exist
 * for the quote. Called when the contract page is first accessed.
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { ensureContractExists } from '../../../../utils/ensure-contract-exists';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    // Verify quote belongs to user's organization
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    let quoteQuery = supabaseAdmin
      .from('quote_selections')
      .select('id, organization_id')
      .eq('lead_id', id);

    // For SaaS users, filter by organization_id
    if (!isAdmin && orgId) {
      quoteQuery = quoteQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: quote, error: quoteError } = await quoteQuery.single();

    if (quoteError || !quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Ensure contract exists (will create if needed)
    const result = await ensureContractExists(id, supabaseAdmin);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to ensure contract exists',
        success: false
      });
    }

    // Return the contract (whether newly created or existing)
    return res.status(200).json({
      success: true,
      contract: result.contract,
      created: result.created || false,
      contract_id: result.contract_id
    });

  } catch (error) {
    console.error('Error in ensure-contract endpoint:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}

