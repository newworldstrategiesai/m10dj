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

    const { contactIds, status } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Valid status values
    const validStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Update contacts in bulk
    const { data, error } = await supabase
      .from('contacts')
      .update({ 
        lead_status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds);

    if (error) {
      logger.error('Database error in bulk status update', error);
      return res.status(500).json({ error: 'Failed to update contacts', details: error.message });
    }

    logger.info('Bulk contacts status updated', { 
      count: contactIds.length, 
      status, 
      userId: user.id 
    });

    return res.status(200).json({ 
      success: true,
      message: `Successfully updated ${contactIds.length} contact(s) to ${status}`,
      updated: contactIds.length
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in bulk status update', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

