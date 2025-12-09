import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quoteSelectionId } = req.body;

  if (!quoteSelectionId) {
    return res.status(400).json({ error: 'Quote selection ID is required' });
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

    // Use service role for queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Verify quote belongs to user's organization before deleting
    let quoteQuery = supabaseAdmin
      .from('quote_selections')
      .select('id, organization_id')
      .eq('id', quoteSelectionId);

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

    // Delete the quote selection
    const { error } = await supabaseAdmin
      .from('quote_selections')
      .delete()
      .eq('id', quoteSelectionId);

    if (error) {
      console.error('Error deleting quote selection:', error);
      return res.status(500).json({ error: 'Failed to delete quote selection', details: error.message });
    }

    console.log('✅ Quote selection deleted successfully:', quoteSelectionId);

    return res.status(200).json({ 
      success: true,
      message: 'Quote selection deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error in delete quote API:', error);
    return res.status(500).json({ 
      error: 'Failed to delete quote selection',
      details: error.message 
    });
  }
}

