/**
 * Set Rachel Dudas (Aly's Surprise Party) invoice due date to 2026-02-28.
 *
 * Usage: node scripts/update-rachel-dudas-invoice-due-date.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DUE_DATE = '2026-02-28';

async function main() {
  console.log("Updating Rachel Dudas invoice due date to", DUE_DATE, "\n");

  // Find contact Rachel Dudas (take first if multiple)
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address')
    .eq('email_address', 'rachel.dudas@gmail.com')
    .limit(1);

  if (contactError || !contacts?.length) {
    throw new Error(contactError?.message || 'Contact rachel.dudas@gmail.com not found');
  }
  const contact = contacts[0];
  console.log('Contact:', contact.id, '-', contact.first_name, contact.last_name, contact.email_address);

  // Find invoice(s): by contact first, then by title match across all invoices (in case link differs)
  let invoices = [];
  const { data: byContact, error: invError } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_title, due_date, contact_id')
    .eq('contact_id', contact.id);

  if (invError) throw new Error(invError.message);
  if (byContact?.length) {
    invoices = byContact;
  } else {
    const { data: byTitle, error: titleErr } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_title, due_date, contact_id')
      .ilike('invoice_title', '%Rachel Dudas%');
    if (titleErr) throw new Error(titleErr.message);
    if (byTitle?.length) invoices = byTitle;
  }

  if (!invoices?.length) {
    throw new Error('No invoice found for Rachel Dudas (contact or title "Rachel Dudas")');
  }

  const invoice = invoices.find((i) =>
    (i.invoice_title || '').includes("Aly") || (i.invoice_title || '').includes("Surprise Party") || (i.invoice_title || '').includes("Rachel")
  ) || invoices[0];

  if (invoices.length > 1) {
    console.log('Multiple invoices for contact; updating:', invoice.invoice_number, invoice.invoice_title);
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ due_date: DUE_DATE, updated_at: new Date().toISOString() })
    .eq('id', invoice.id);

  if (updateError) throw new Error(updateError.message);

  console.log('Invoice updated:', invoice.invoice_number, '- due_date:', invoice.due_date, '->', DUE_DATE);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
