import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here

    const supabase = createServerSupabaseClient({ req, res });
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Validate ID format
    if (id === 'null' || id === 'undefined' || id.trim() === '') {
      logger.error('Invalid contact ID format', { id });
      return res.status(400).json({ error: 'Invalid contact ID format' });
    }

    // Use service role for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const spamStatus = req.method === 'POST' ? 'spam' : 'not_spam';

    const { data, error } = await adminSupabase
      .from('contacts')
      .update({
        spam_status: spamStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contact spam status', { contactId: id, error });
      return res.status(500).json({ error: 'Failed to update spam status', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const action = req.method === 'POST' ? 'marked as spam' : 'unmarked as spam';
    logger.info(`Contact ${action}`, { contactId: id, userId: user.id });

    res.status(200).json({
      success: true,
      message: `Contact ${action} successfully`,
      contact: data
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }

    logger.error('Error in contacts spam API', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}