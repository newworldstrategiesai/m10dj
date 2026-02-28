/**
 * Create Contact, Project, Invoice & Contract for Aly's Surprise Party
 *
 * From text thread:
 * - Alyssa Shackelford +1 (901) 517-1771
 * - Rachel Dudas rachel.dudas@gmail.com (invoice recipient)
 * - Event: Aly's surprise party, Saturday 7pm, setup 6:30
 * - Invoice: $450
 * - Contract: $100 per extra hour
 *
 * Usage: node scripts/create-alyssa-surprise-party.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("📋 Creating Aly's Surprise Party - Contact, Project, Invoice & Contract\n");

  // Get M10 DJ Company organization
  let orgId;
  const { data: m10Org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('is_platform_owner', true)
    .maybeSingle();

  if (!orgError && m10Org) {
    orgId = m10Org.id;
  } else {
    const { data: fallback } = await supabase
      .from('organizations')
      .select('id')
      .or('name.ilike.%m10%,slug.ilike.%m10%')
      .limit(1)
      .maybeSingle();
    if (!fallback) throw new Error('Could not find M10 organization');
    orgId = fallback.id;
  }
  console.log('✅ Using organization:', orgId);

  // 1. Create contact (Rachel Dudas - primary, invoice recipient; Alyssa in notes)
  const contactData = {
    organization_id: orgId,
    first_name: 'Rachel',
    last_name: 'Dudas',
    email_address: 'rachel.dudas@gmail.com',
    phone: '+19015171771',
    event_type: 'private_party',
    event_date: '2025-02-28',
    event_time: '19:00:00',
    venue_name: null,
    venue_address: null,
    lead_status: 'Booked',
    lead_source: 'Text Message',
    lead_stage: 'Contract Sent',
    lead_temperature: 'Hot',
    notes:
      "Aly's surprise party. Co-planner: Alyssa Shackelford (+1 901-517-1771). Setup at 6:30pm. Event 7pm Saturday Feb 28, 2025. Invoice to rachel.dudas@gmail.com.",
  };

  let contact;
  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert(contactData)
    .select()
    .single();

  if (contactError) {
    if (contactError.code === '23505') {
      const { data: existing } = await supabase
        .from('contacts')
        .select('*')
        .eq('email_address', 'rachel.dudas@gmail.com')
        .eq('organization_id', orgId)
        .single();
      if (existing) {
        console.log('✅ Contact already exists:', existing.id);
        contact = existing;
      } else throw contactError;
    } else throw contactError;
  } else {
    contact = newContact;
    console.log('✅ Contact created:', contact.id, '- Rachel Dudas');
  }

  // 2. Create project (event)
  const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
  const eventName = `${clientName} - Aly's Surprise Party - Feb 28, 2025`;

  const projectData = {
    submission_id: null,
    organization_id: orgId,
    contact_id: contact.id,
    event_name: eventName,
    client_name: clientName,
    client_email: contact.email_address,
    client_phone: contact.phone,
    event_type: 'private_party',
    event_date: '2025-02-28',
    start_time: '19:00:00',
    status: 'confirmed',
    timeline_notes: "Setup 6:30pm. Event 7pm. Aly's surprise party. Co-planner Alyssa Shackelford.",
  };

  const { data: project, error: projectError } = await supabase
    .from('events')
    .insert(projectData)
    .select()
    .single();

  if (projectError) throw projectError;
  console.log('✅ Project created:', project.id, '-', project.event_name);

  // 3. Create invoice for $450
  // invoice_number is globally unique - get max existing number for this month
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}-`;
  const { data: existing } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);
  let seq = 1;
  if (existing && existing[0]) {
    const parts = existing[0].invoice_number.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) seq = num + 1;
  }
  const invoiceNumber = `${prefix}${String(seq).padStart(3, '0')}`;

  const totalAmount = 450;
  const invoiceData = {
    contact_id: contact.id,
    project_id: project.id,
    organization_id: orgId,
    invoice_number: invoiceNumber,
    invoice_status: 'Draft',
    invoice_title: "Aly's Surprise Party - Rachel Dudas",
    invoice_description: "DJ services for Aly's surprise party",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: totalAmount,
    total_amount: totalAmount,
    balance_due: totalAmount,
    amount_paid: 0,
    line_items: [
      {
        description: "DJ Services - Aly's Surprise Party",
        type: 'service',
        quantity: 1,
        rate: totalAmount,
        amount: totalAmount,
      },
    ],
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single();

  if (invoiceError) throw invoiceError;
  console.log('✅ Invoice created:', invoice.id, '- $450 -', invoice.invoice_number);

  // 4. Create contract with $100 per extra hour
  const { ensureContractExistsForInvoice } = await import('../utils/ensure-contract-exists-for-invoice.js');
  const contractResult = await ensureContractExistsForInvoice(invoice.id, supabase, {
    extra_hour_rate: 100,
  });

  if (!contractResult.success) throw new Error(contractResult.error);
  console.log(
    '✅ Contract created:',
    contractResult.contract_id,
    '(includes $100 per extra hour clause)'
  );

  console.log('\n📄 Summary:');
  console.log('   Contact:', contact.id, '-', contact.email_address);
  console.log('   Project:', project.id, '-', project.event_name);
  console.log('   Invoice:', invoice.id, '-', invoice.invoice_number, '- $450');
  console.log('   Contract:', contractResult.contract_id, '- $100/hr extra');
  console.log('\n🔗 Next steps:');
  console.log('   - Admin: /admin/contacts/' + contact.id);
  console.log('   - Invoice: /admin/invoices/' + invoice.id);
  console.log('   - Send invoice to rachel.dudas@gmail.com');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
