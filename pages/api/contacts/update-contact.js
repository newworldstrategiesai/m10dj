import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const supabase = createServerSupabaseClient({ req, res });

    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Use service role for admin updates
    const env = getEnv();
    const adminSupabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await adminSupabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contact', { contactId: id, error });
      return res.status(500).json({ error: 'Failed to update contact', details: error.message });
    }

    logger.info('Contact updated', { contactId: id, userId: user.id });

    res.status(200).json({ contact: data });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in update-contact', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

