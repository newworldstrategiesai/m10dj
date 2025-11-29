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

    const { contactIds, updates } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' });
    }

    // Validate allowed update fields
    const allowedFields = [
      'lead_temperature',
      'lead_source',
      'lead_stage',
      'priority_level',
      'assigned_to',
      'notes'
    ];

    const updateData = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update contacts in bulk
    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .in('id', contactIds);

    if (error) {
      logger.error('Database error in bulk update', error);
      return res.status(500).json({ error: 'Failed to update contacts', details: error.message });
    }

    logger.info('Bulk contacts updated', { count: contactIds.length, userId: user.id });
    
    return res.status(200).json({ 
      success: true,
      message: `Successfully updated ${contactIds.length} contact(s)`,
      updated: contactIds.length
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in bulk update', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

