import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { sendInvoiceWithPaymentLink } from '@/utils/payment-link-helper';
import { generateInvoicePDFBuffer } from '@/utils/invoice-pdf-generator';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send invoice email to client
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

  const { id: invoiceId } = req.query;
  const { attachPDF } = req.body || {};

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  if (!resend) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with contact details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email_address
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Validate contact
    if (!invoice.contacts || !invoice.contacts.email_address) {
      return res.status(400).json({ 
        error: 'Contact email address is required',
        code: 'MISSING_EMAIL',
        contactId: invoice.contacts?.id || invoice.contact_id,
        message: 'Please add an email address to the contact before sending the invoice.'
      });
    }

    // Generate PDF buffer if attachment requested
    let pdfBuffer = null;
    if (attachPDF) {
      try {
        // Ensure invoice has contact info for PDF generation
        const invoiceWithContact = {
          ...invoice,
          contacts: invoice.contacts
        };
        pdfBuffer = await generateInvoicePDFBuffer(invoiceWithContact, supabaseAdmin);
        console.log(`✅ Generated PDF buffer: ${pdfBuffer.length} bytes`);
      } catch (pdfError) {
        console.error('Error generating PDF for attachment:', pdfError);
        // Continue without PDF attachment if generation fails
      }
    }

    // Send email using the helper function
    const result = await sendInvoiceWithPaymentLink(
      invoice,
      invoice.contacts,
      supabaseAdmin,
      resend,
      pdfBuffer
    );

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to send email' 
      });
    }

    // Update invoice status to 'Sent' if not already
    if (invoice.invoice_status !== 'Sent' && invoice.status !== 'Sent') {
      await supabaseAdmin
        .from('invoices')
        .update({
          invoice_status: 'Sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoice.id);
    }

    res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully',
      paymentLink: result.paymentLink,
      paymentToken: result.paymentToken
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
