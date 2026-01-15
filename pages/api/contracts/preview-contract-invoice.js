import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { sendContractAndInvoiceEmail } from '../../../../utils/payment-link-helper';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Preview the contract-invoice email HTML
 * Returns the rendered HTML without sending
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

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Ensure invoice has payment token (generate if needed)
    let paymentToken = invoice.payment_token;
    if (!paymentToken) {
      const { generatePaymentToken } = require('../../../../utils/payment-link-helper');
      paymentToken = generatePaymentToken();
    }

    // Build contact object
    const contact = contract.contacts || {
      first_name: 'Client',
      email_address: 'client@example.com'
    };

    // Build URLs for preview
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
    const contractSigningUrl = contract.signing_token 
      ? `${baseUrl}/sign-contract/${contract.signing_token}`
      : `${baseUrl}/sign-contract/preview`;
    const invoicePaymentUrl = `${baseUrl}/pay/${paymentToken}`;

    // Read and render the email template
    const fs = require('fs');
    const path = require('path');
    const templatePath = path.join(process.cwd(), 'email-templates', 'contract-invoice-ready.html');
    
    let emailHtml;
    try {
      emailHtml = fs.readFileSync(templatePath, 'utf8');
    } catch (templateError) {
      console.error('Error reading email template:', templateError);
      return res.status(500).json({ error: 'Failed to load email template' });
    }

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch {
        return dateString;
      }
    };

    // Replace template variables
    emailHtml = emailHtml
      .replace(/\{\{client_first_name\}\}/g, contact.first_name || 'Client')
      .replace(/\{\{event_name\}\}/g, contract.event_name || invoice.event_name || 'Your Event')
      .replace(/\{\{event_date\}\}/g, formatDate(contract.event_date || invoice.event_date))
      .replace(/\{\{event_time\}\}/g, contract.event_time || contract.start_time || '')
      .replace(/\{\{end_time\}\}/g, contract.end_time || '')
      .replace(/\{\{venue_name\}\}/g, contract.venue_name || '')
      .replace(/\{\{venue_address\}\}/g, contract.venue_address || '')
      .replace(/\{\{guest_count\}\}/g, contract.guest_count?.toString() || '')
      .replace(/\{\{contract_number\}\}/g, contract.contract_number || '')
      .replace(/\{\{invoice_number\}\}/g, invoice.invoice_number || '')
      .replace(/\{\{total_amount\}\}/g, (contract.total_amount || invoice.total_amount || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }))
      .replace(/\{\{deposit_amount\}\}/g, contract.deposit_amount ? contract.deposit_amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }) : '')
      .replace(/\{\{contract_signing_url\}\}/g, contractSigningUrl)
      .replace(/\{\{invoice_payment_url\}\}/g, invoicePaymentUrl)
      .replace(/\{\{contract_expires_at\}\}/g, contract.signing_token_expires_at ? formatDate(contract.signing_token_expires_at) : '')
      .replace(/\{\{invoice_due_date\}\}/g, invoice.due_date ? formatDate(invoice.due_date) : '')
      .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());

    // Clean up empty conditional blocks
    emailHtml = emailHtml
      .replace(/\{\{#if\s+\w+\}\}/g, '')
      .replace(/\{\{\/if\}\}/g, '');

    // Remove rows for missing optional fields
    if (!contract.end_time && !contract.start_time) {
      emailHtml = emailHtml.replace(/<tr>[\s\S]*?\{\{end_time\}\}[\s\S]*?<\/tr>/g, '');
    }
    if (!contract.venue_address) {
      emailHtml = emailHtml.replace(/,\s*\{\{venue_address\}\}/g, '');
    }
    if (!contract.guest_count) {
      emailHtml = emailHtml.replace(/<tr>[\s\S]*?Expected Guests[\s\S]*?<\/tr>/g, '');
    }
    if (!contract.deposit_amount) {
      emailHtml = emailHtml.replace(/<tr>[\s\S]*?Deposit Required[\s\S]*?<\/tr>/g, '');
    }

    res.status(200).json({
      success: true,
      html: emailHtml,
      subject: `Contract & Invoice Ready - ${contract.event_name || 'Your Event'}`
    });
  } catch (error) {
    console.error('Error previewing contract-invoice email:', error);
    res.status(500).json({ error: 'Failed to preview email' });
  }
}
