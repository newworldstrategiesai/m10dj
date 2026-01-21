import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
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

    // Validate ID format (should not be null, undefined, or empty string)
    if (id === 'null' || id === 'undefined' || id.trim() === '') {
      logger.error('Invalid contact ID format', { id });
      return res.status(400).json({ error: 'Invalid contact ID format' });
    }

    // Use service role for admin operations
    const env = getEnv();
    const adminSupabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (req.method === 'DELETE') {
      // Soft delete by setting deleted_at timestamp
      const { data, error } = await adminSupabase
        .from('contacts')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error deleting contact', { contactId: id, error });
        return res.status(500).json({ error: 'Failed to delete contact', details: error.message });
      }

      if (!data) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      logger.info('Contact deleted (soft delete)', { contactId: id, userId: user.id });

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully',
        contact: data
      });
    } else {
      // PATCH - Update contact
      const updates = req.body;

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

      if (!data) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      logger.info('Contact updated', { contactId: id, userId: user.id });

      res.status(200).json({ contact: data });
    }
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in contacts/[id]', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

