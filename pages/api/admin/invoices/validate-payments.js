/**
 * Validate Invoice Payments
 * Finds invoices marked as "Paid" but with no payment records
 * Also finds invoices with payment records that don't match invoice status
 */

import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, invoice_id } = req.query;

    // GET: Find invoices with payment issues
    if (req.method === 'GET') {
      // Find invoices marked as "Paid" but with no payment records
      const { data: paidInvoicesWithoutPayments, error: error1 } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_status,
          total_amount,
          amount_paid,
          balance_due,
          paid_date,
          contact_id,
          contacts (
            id,
            first_name,
            last_name,
            email_address
          )
        `)
        .eq('invoice_status', 'Paid')
        .is('paid_date', null); // Also check for invoices without paid_date

      // Get payment counts for each invoice
      const invoiceIds = paidInvoicesWithoutPayments?.map(inv => inv.id) || [];
      
      let paymentCounts = {};
      if (invoiceIds.length > 0) {
        const { data: payments } = await supabase
          .from('payments')
          .select('invoice_id')
          .in('invoice_id', invoiceIds)
          .eq('payment_status', 'Paid');

        // Count payments per invoice
        paymentCounts = (payments || []).reduce((acc, payment) => {
          if (payment.invoice_id) {
            acc[payment.invoice_id] = (acc[payment.invoice_id] || 0) + 1;
          }
          return acc;
        }, {});
      }

      // Filter to invoices with no payments
      const invoicesWithoutPayments = (paidInvoicesWithoutPayments || []).filter(
        invoice => !paymentCounts[invoice.id] || paymentCounts[invoice.id] === 0
      );

      // Also find invoices marked as "Paid" but amount_paid doesn't match total_amount
      const { data: mismatchedInvoices, error: error2 } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_status,
          total_amount,
          amount_paid,
          balance_due,
          paid_date,
          contact_id,
          contacts (
            id,
            first_name,
            last_name,
            email_address
          )
        `)
        .eq('invoice_status', 'Paid')
        .neq('balance_due', 0); // Should be 0 if fully paid

      // Get payment totals for mismatched invoices
      const mismatchedIds = mismatchedInvoices?.map(inv => inv.id) || [];
      let paymentTotals = {};
      
      if (mismatchedIds.length > 0) {
        const { data: paymentsForMismatched } = await supabase
          .from('payments')
          .select('invoice_id, total_amount')
          .in('invoice_id', mismatchedIds)
          .eq('payment_status', 'Paid');

        paymentTotals = (paymentsForMismatched || []).reduce((acc, payment) => {
          if (payment.invoice_id) {
            acc[payment.invoice_id] = (acc[payment.invoice_id] || 0) + parseFloat(payment.total_amount || 0);
          }
          return acc;
        }, {});
      }

      return res.status(200).json({
        success: true,
        issues: {
          paidWithoutPayments: invoicesWithoutPayments.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            total_amount: inv.total_amount,
            amount_paid: inv.amount_paid,
            balance_due: inv.balance_due,
            paid_date: inv.paid_date,
            contact: inv.contacts ? {
              id: inv.contacts.id,
              name: `${inv.contacts.first_name || ''} ${inv.contacts.last_name || ''}`.trim(),
              email: inv.contacts.email_address
            } : null
          })),
          mismatchedAmounts: (mismatchedInvoices || []).map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            total_amount: inv.total_amount,
            amount_paid: inv.amount_paid,
            balance_due: inv.balance_due,
            paid_date: inv.paid_date,
            payment_total: paymentTotals[inv.id] || 0,
            contact: inv.contacts ? {
              id: inv.contacts.id,
              name: `${inv.contacts.first_name || ''} ${inv.contacts.last_name || ''}`.trim(),
              email: inv.contacts.email_address
            } : null
          }))
        },
        summary: {
          paidWithoutPayments: invoicesWithoutPayments.length,
          mismatchedAmounts: mismatchedInvoices?.length || 0,
          totalIssues: invoicesWithoutPayments.length + (mismatchedInvoices?.length || 0)
        }
      });
    }

    // POST: Fix a specific invoice
    if (req.method === 'POST') {
      const { fix_action, new_status } = req.body;

      if (!invoice_id) {
        return res.status(400).json({ error: 'Invoice ID is required' });
      }

      if (fix_action === 'revert_to_unpaid') {
        // Revert invoice status back to unpaid
        const { data: invoice } = await supabase
          .from('invoices')
          .select('total_amount, amount_paid')
          .eq('id', invoice_id)
          .single();

        if (!invoice) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        // Determine appropriate status
        let statusToSet = new_status || 'Sent'; // Default to 'Sent' if no payment received
        if (invoice.amount_paid > 0 && invoice.amount_paid < invoice.total_amount) {
          statusToSet = 'Partial';
        } else if (invoice.amount_paid === 0) {
          statusToSet = 'Sent';
        }

        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            invoice_status: statusToSet,
            amount_paid: 0,
            balance_due: invoice.total_amount,
            paid_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice_id);

        if (updateError) {
          return res.status(500).json({ 
            error: 'Failed to revert invoice',
            details: updateError.message
          });
        }

        return res.status(200).json({
          success: true,
          message: `Invoice reverted to ${statusToSet}`,
          invoice: {
            id: invoice_id,
            invoice_status: statusToSet,
            amount_paid: 0,
            balance_due: invoice.total_amount
          }
        });
      }

      if (fix_action === 'set_status') {
        // Manually set status (for cases where status should be different)
        if (!new_status) {
          return res.status(400).json({ error: 'new_status is required for set_status action' });
        }

        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            invoice_status: new_status,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice_id);

        if (updateError) {
          return res.status(500).json({ 
            error: 'Failed to update invoice status',
            details: updateError.message
          });
        }

        return res.status(200).json({
          success: true,
          message: `Invoice status set to ${new_status}`,
          invoice: {
            id: invoice_id,
            invoice_status: new_status
          }
        });
      }

      return res.status(400).json({ error: 'Invalid fix_action' });
    }
  } catch (error) {
    console.error('Error validating invoice payments:', error);
    res.status(500).json({ 
      error: 'Failed to validate invoice payments',
      message: error.message 
    });
  }
}
