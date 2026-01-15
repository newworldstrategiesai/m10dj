import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Update invoice email address
 */
export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: invoiceId } = req.query;
  const { email_address } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  // Validate email format if provided (empty string is allowed to clear it)
  if (email_address !== undefined && email_address !== null && email_address !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_address)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Update invoice email address (set to null if empty string)
    const updateData = {
      invoice_email_address: email_address === '' ? null : email_address || null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice email:', updateError);
      return res.status(500).json({
        error: 'Failed to update invoice email address',
        details: updateError.message
      });
    }

    res.status(200).json({
      success: true,
      invoice: updatedInvoice,
      message: email_address ? 'Invoice email address updated successfully' : 'Invoice email address cleared'
    });
  } catch (error) {
    console.error('Error updating invoice email:', error);
    res.status(500).json({ error: 'Failed to update invoice email address' });
  }
}
