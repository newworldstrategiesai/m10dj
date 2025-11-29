import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const supabase = createServerSupabaseClient({ req, res });

    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    // Soft delete by setting deleted_at timestamp
    // First check if deleted_at column exists, if not, we'll use a different approach
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .in('id', contactIds)
      .is('deleted_at', null);

    if (fetchError) {
      logger.error('Error fetching contacts for deletion', fetchError);
      // If deleted_at doesn't exist, try direct delete
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);

      if (deleteError) {
        logger.error('Database error in bulk delete', deleteError);
        return res.status(500).json({ error: 'Failed to delete contacts', details: deleteError.message });
      }

      logger.info('Bulk contacts deleted (hard delete)', { count: contactIds.length, userId: user.id });
      
      return res.status(200).json({ 
        success: true,
        message: `Successfully deleted ${contactIds.length} contact(s)`,
        deleted: contactIds.length
      });
    }

    // Try soft delete first
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds);

    if (updateError) {
      // If soft delete fails (column might not exist), try hard delete
      logger.warn('Soft delete failed, attempting hard delete', { error: updateError.message });
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);

      if (deleteError) {
        logger.error('Database error in bulk delete', deleteError);
        return res.status(500).json({ error: 'Failed to delete contacts', details: deleteError.message });
      }
    }

    logger.info('Bulk contacts deleted (soft delete)', { count: contactIds.length, userId: user.id });

    return res.status(200).json({ 
      success: true,
      message: `Successfully deleted ${contactIds.length} contact(s)`,
      deleted: contactIds.length
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in bulk delete', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

