#!/usr/bin/env node

/**
 * Backfill missing "remaining balance" payment for Marlee Cordo (mecordo@yahoo.com).
 * Quote/invoice link: .../quote/c082f6bd-d63c-4c23-992d-caa68c299017/invoice
 *
 * Usage: node scripts/backfill-marlee-cordo-remaining-payment.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LEAD_ID = 'c082f6bd-d63c-4c23-992d-caa68c299017';

async function main() {
  console.log('Backfilling remaining balance payment for Marlee Cordo (lead:', LEAD_ID, ')\n');

  // 1) Resolve lead_id to contact_id
  let contactId = null;
  const { data: submission } = await supabase
    .from('contact_submissions')
    .select('contact_id')
    .eq('id', LEAD_ID)
    .limit(1)
    .maybeSingle();

  if (submission?.contact_id) {
    contactId = submission.contact_id;
    console.log('Resolved lead_id -> contact_id via contact_submissions:', contactId);
  } else {
    const { data: contactRow } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', LEAD_ID)
      .limit(1);
    if (contactRow?.[0]) {
      contactId = LEAD_ID;
      console.log('Resolved lead_id as contact_id (direct):', contactId);
    }
  }

  if (!contactId) {
    throw new Error('Could not resolve lead_id to contact_id. Check LEAD_ID.');
  }

  // 2) Get invoice (quote_selections.invoice_id or invoices by contact_id)
  let invoiceId = null;
  let invoice = null;
  const { data: qs } = await supabase
    .from('quote_selections')
    .select('id, invoice_id')
    .eq('lead_id', LEAD_ID)
    .limit(1)
    .maybeSingle();

  if (qs?.invoice_id) {
    invoiceId = qs.invoice_id;
  }
  if (!invoiceId) {
    const { data: invList } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, amount_paid, balance_due, contact_id, organization_id')
      .eq('contact_id', contactId)
      .neq('invoice_status', 'Cancelled')
      .order('created_at', { ascending: false })
      .limit(1);
    if (invList?.[0]) {
      invoiceId = invList[0].id;
      invoice = invList[0];
    }
  }
  if (invoiceId && !invoice) {
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, amount_paid, balance_due, contact_id, organization_id')
      .eq('id', invoiceId)
      .single();
    if (invErr) throw new Error('Invoice fetch error: ' + invErr.message);
    invoice = inv;
  }

  if (!invoice) {
    throw new Error('No invoice found for this lead/contact.');
  }

  console.log('Invoice:', invoice.invoice_number, '| total_amount:', invoice.total_amount, '| amount_paid:', invoice.amount_paid, '| balance_due:', invoice.balance_due);

  // 3) Sum existing paid payments for this invoice (or contact)
  const { data: payments } = await supabase
    .from('payments')
    .select('id, total_amount, payment_name, transaction_date')
    .eq('contact_id', contactId)
    .eq('payment_status', 'Paid');

  const totalPaid = (payments || []).reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
  const invoiceTotal = parseFloat(invoice.total_amount) || 0;
  const remainingToBackfill = Math.round((invoiceTotal - totalPaid) * 100) / 100;

  console.log('Existing payments:', (payments || []).length, '| total paid in DB:', totalPaid, '| remaining to backfill:', remainingToBackfill);

  if (remainingToBackfill <= 0) {
    console.log('Nothing to backfill (invoice already fully paid in DB). Exiting.');
    return;
  }

  // 4) Insert backfill payment
  const today = new Date().toISOString().split('T')[0];
  const paymentRecord = {
    contact_id: contactId,
    invoice_id: invoiceId,
    payment_name: 'Remaining balance',
    total_amount: remainingToBackfill,
    payment_status: 'Paid',
    payment_method: 'Credit Card',
    transaction_date: today,
    payment_notes: 'Backfill: remaining balance paid via Stripe (second payment was not recorded by webhook).',
    organization_id: invoice.organization_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('payments')
    .insert(paymentRecord)
    .select('id, total_amount, payment_name, transaction_date')
    .single();

  if (insertErr) {
    throw new Error('Failed to insert payment: ' + insertErr.message);
  }

  console.log('\nInserted payment:', inserted.id, '|', inserted.payment_name, '| $' + inserted.total_amount, '|', inserted.transaction_date);
  console.log('Done. The DB trigger will update the invoice amount_paid and status.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
