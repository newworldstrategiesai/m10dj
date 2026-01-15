import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { sendContractAndInvoiceEmail } from '@/utils/payment-link-helper';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send contract and invoice email to client
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { contractId, invoiceId } = req.body;

  if (!contractId || !invoiceId) {
    return res.status(400).json({ error: 'Contract ID and Invoice ID are required' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contract with contact details
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email_address
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (!contract.signing_token) {
      return res.status(400).json({ error: 'Contract does not have a signing token' });
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Validate contact
    if (!contract.contacts || !contract.contacts.email_address) {
      return res.status(400).json({ error: 'Contact email address is required' });
    }

    // Send email using the helper function
    const result = await sendContractAndInvoiceEmail(
      contract,
      invoice,
      contract.contacts,
      supabaseAdmin,
      resend
    );

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to send email' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contract and invoice email sent successfully',
      contractSigningUrl: result.contractSigningUrl,
      invoicePaymentUrl: result.invoicePaymentUrl
    });
  } catch (error) {
    console.error('Error sending contract-invoice email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
