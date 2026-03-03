/**
 * Get Rachel Dudas (Aly's Surprise Party) invoice payment link and print a casual
 * text from Ben that you can copy and send.
 *
 * Usage: node scripts/rachel-dudas-pay-link-text.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL (or defaults to m10djcompany.com)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';

async function main() {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('email_address', 'rachel.dudas@gmail.com')
    .limit(1);

  if (!contacts?.length) {
    throw new Error('Contact rachel.dudas@gmail.com not found');
  }

  let invoices = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_title, payment_token, total_amount, due_date')
    .eq('contact_id', contacts[0].id);

  if (invoices.error || !invoices.data?.length) {
    const byTitle = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_title, payment_token, total_amount, due_date')
      .ilike('invoice_title', '%Rachel Dudas%');
    if (byTitle.error || !byTitle.data?.length) throw new Error('No invoice found for Rachel Dudas');
    invoices = byTitle;
  }

  const invoice = invoices.data.find((i) =>
    (i.invoice_title || '').includes('Aly') || (i.invoice_title || '').includes('Surprise Party') || (i.invoice_title || '').includes('Rachel')
  ) || invoices.data[0];

  let paymentToken = invoice.payment_token;
  if (!paymentToken) {
    const crypto = require('crypto');
    paymentToken = crypto.randomBytes(32).toString('hex');
    const { error: updateErr } = await supabase
      .from('invoices')
      .update({ payment_token: paymentToken, updated_at: new Date().toISOString() })
      .eq('id', invoice.id);
    if (updateErr) throw new Error('Failed to set payment_token: ' + updateErr.message);
    console.log('Generated and saved payment_token for invoice', invoice.invoice_number);
  }

  const payLink = `${baseUrl}/pay/${paymentToken}`;
  const total = invoice.total_amount != null ? `$${Number(invoice.total_amount).toFixed(0)}` : 'the invoice';

  console.log('\n--- Copy this text to send to Rachel ---\n');
  console.log(`Hey Rachel! Here's the link to pay for Aly's party whenever you're ready: ${payLink} Thanks! - Ben\n`);
  console.log('--- End ---\n');
  console.log('Payment link only:', payLink);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
