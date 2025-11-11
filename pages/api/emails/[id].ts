import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

/**
 * API route to manage individual emails
 * GET /api/emails/[id] - Get email by ID
 * PATCH /api/emails/[id] - Update email (mark as read, archive, etc.)
 * DELETE /api/emails/[id] - Delete email
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createServerSupabaseClient({ req, res });
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid email ID' });
    }

    // GET - Fetch single email
    if (req.method === 'GET') {
      const { data: email, error } = await supabase
        .from('received_emails')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Email not found' });
        }
        throw error;
      }

      return res.status(200).json({ email });
    }

    // PATCH - Update email
    if (req.method === 'PATCH') {
      const updates = req.body;

      // Whitelist allowed updates
      const allowedFields = ['read', 'flagged', 'archived', 'deleted', 'snoozed', 'snooze_until'];
      const sanitizedUpdates: Record<string, any> = {};

      for (const field of allowedFields) {
        if (field in updates) {
          sanitizedUpdates[field] = updates[field];
        }
      }

      if (Object.keys(sanitizedUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { data: email, error } = await supabase
        .from('received_emails')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({ email, message: 'Email updated successfully' });
    }

    // DELETE - Soft delete email
    if (req.method === 'DELETE') {
      const { data: email, error } = await supabase
        .from('received_emails')
        .update({ deleted: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({ email, message: 'Email deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('[API] Error in email endpoint:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  }
}

