import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Use service role for queries (needed for RLS bypass if admin)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { contact_id, quote_id } = req.query;

    if (!contact_id && !quote_id) {
      return res.status(400).json({ error: 'contact_id or quote_id is required' });
    }

    let query = supabaseAdmin
      .from('payments')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    // For SaaS users, filter by organization_id. Platform admins see all payments.
    if (!isAdmin && orgId) {
      query = query.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      // SaaS user without organization - return empty
      return res.status(200).json({ payments: [] });
    }

    if (contact_id) {
      // First, check if this is actually a contact_id or if it's a quote/lead ID
      // Try to find the actual contact_id from contact_submissions or quote_selections
      const { data: submission } = await supabaseAdmin
        .from('contact_submissions')
        .select('id, contact_id')
        .eq('id', contact_id)
        .single();
      
      if (submission && submission.contact_id) {
        // Found a contact_id from the submission
        query = query.eq('contact_id', submission.contact_id);
      } else {
        // Check if it's already a contact_id
        const { data: contact } = await supabaseAdmin
          .from('contacts')
          .select('id')
          .eq('id', contact_id)
          .single();
        
        if (contact) {
          query = query.eq('contact_id', contact_id);
        } else {
          // If neither works, try using the ID directly (for backward compatibility)
          query = query.eq('contact_id', contact_id);
        }
      }
    }

    if (quote_id && !contact_id) {
      // If quote_id is provided without contact_id, try to find contact via quote_selections
      const { data: quoteSelection } = await supabaseAdmin
        .from('quote_selections')
        .select('contact_submission_id')
        .eq('id', quote_id)
        .single();
      
      if (quoteSelection && quoteSelection.contact_submission_id) {
        const { data: submission } = await supabaseAdmin
          .from('contact_submissions')
          .select('contact_id')
          .eq('id', quoteSelection.contact_submission_id)
          .single();
        
        if (submission && submission.contact_id) {
          query = query.eq('contact_id', submission.contact_id);
        }
      }
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    res.status(200).json({ payments: payments || [] });
  } catch (error) {
    console.error('Error in /api/payments:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

