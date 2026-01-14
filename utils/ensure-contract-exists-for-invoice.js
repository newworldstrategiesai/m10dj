/**
 * Ensure Contract Exists for Invoice
 * 
 * Creates a draft contract if one doesn't exist for an invoice.
 * This ensures contracts exist in the invoice-first workflow.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate contract HTML from template
 * Returns { contractHtml, templateName }
 */
async function generateContractHtml(invoice, contact, event, contractNumber, supabase) {
  // Get contract template
  let template;
  try {
    const { data: defaultTemplate, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (templateError || !defaultTemplate || !defaultTemplate.template_content) {
      template = {
        name: 'Default Contract',
        template_content: getDefaultContractTemplate()
      };
    } else {
      template = defaultTemplate;
    }
  } catch (templateErr) {
    template = {
      name: 'Default Contract',
      template_content: getDefaultContractTemplate()
    };
  }

  const templateName = template.name || 'Default Contract';

  // Build event name
  const eventName = event?.event_name || 
                   (contact.event_type ? `${contact.first_name || ''} ${contact.last_name || ''} ${contact.event_type}`.trim() : null) ||
                   (contact.first_name || contact.last_name ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : 'Service Agreement');
  
  // Prepare template variables

  const totalAmount = invoice.total_amount || 0;
  const depositAmount = invoice.deposit_amount || (totalAmount * 0.5);
  const remainingBalance = totalAmount - depositAmount;

  // Build payment schedule HTML
  let paymentScheduleHtml = '';
  if (invoice.line_items && invoice.line_items.length > 0) {
    paymentScheduleHtml = '<ul>';
    paymentScheduleHtml += `<li>50% deposit ($${depositAmount.toFixed(2)}) due upon signing</li>`;
    paymentScheduleHtml += `<li>50% balance ($${remainingBalance.toFixed(2)}) due 30 days before event</li>`;
    paymentScheduleHtml += '</ul>';
  }

  const variables = {
    client_name: `${contact.first_name} ${contact.last_name}`,
    client_first_name: contact.first_name || '',
    client_last_name: contact.last_name || '',
    client_full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
    client_email: contact.email_address || contact.primary_email || '',
    client_phone: contact.phone || '',
    
    event_name: eventName,
    event_type: event?.event_type || contact.event_type || 'Event',
    event_date: (event?.event_date || contact.event_date) ? 
      new Date(event?.event_date || contact.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '',
    event_date_short: (event?.event_date || contact.event_date) ? 
      new Date(event?.event_date || contact.event_date).toLocaleDateString('en-US') : '',
    venue_name: event?.venue_name || contact.venue_name || '',
    venue_address: event?.venue_address || contact.venue_address || '',
    guest_count: (event?.number_of_guests || contact.guest_count) ? String(event?.number_of_guests || contact.guest_count) : '',
    
    invoice_total: `$${totalAmount.toFixed(2)}`,
    invoice_subtotal: `$${totalAmount.toFixed(2)}`,
    deposit_amount: `$${depositAmount.toFixed(2)}`,
    remaining_balance: `$${remainingBalance.toFixed(2)}`,
    payment_schedule: paymentScheduleHtml,
    total_amount: `$${totalAmount.toFixed(2)}`,
    
    contract_number: contractNumber,
    effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    effective_date_short: new Date().toLocaleDateString('en-US'),
    today_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    
    company_name: 'M10 DJ Company',
    company_address: '65 Stewart Rd, Eads, Tennessee 38028',
    company_email: 'm10djcompany@gmail.com',
    company_phone: '(901) 410-2020',
    owner_name: 'Ben Murray',
    
    signature_area: '',
    editable_signer_name: '',
    editable_signer_email: '',
    signature_date: '',
    editable_company_name: 'M10 DJ Company',
    signature_title: 'Owner',
    editable_company_email: 'm10djcompany@gmail.com'
  };

  // Replace template variables
  let contractHtml = template.template_content;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    contractHtml = contractHtml.replace(regex, variables[key] || '');
  });

  return { contractHtml, templateName };
}

// Default contract template HTML (used when no templates exist)
function getDefaultContractTemplate() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { color: #1a1a1a; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 10px; }
h2 { color: #333; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
p { margin: 10px 0; }
ul { margin: 10px 0; padding-left: 25px; }
li { margin: 5px 0; }
.section { margin: 20px 0; }
.signature-section { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; }
.signature-box { margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; }
.signature-line { border-bottom: 1px solid #333; height: 50px; margin: 20px 0; }
</style>
</head>
<body>
<h1>DJ SERVICES AGREEMENT</h1>
<div class="section">
<p>This Agreement is entered into effective as of <strong>{{effective_date}}</strong> (the "Effective Date"), between <strong>{{client_full_name}}</strong> ("Client") and <strong>{{company_name}}</strong> ("Company"), located at {{company_address}}.</p>
</div>

<div class="section">
<h2>1. DESCRIPTION OF SERVICES</h2>
<p>The Company agrees to provide professional DJ services for {{event_type}} on {{event_date}} at {{venue_name}}, {{venue_address}}. The event is scheduled to accommodate approximately {{guest_count}} guests.</p>
<p><strong>Services Include:</strong></p>
<ul>
<li>Professional DJ and MC services</li>
<li>Sound system and audio equipment</li>
<li>Microphones for speeches and announcements</li>
<li>Music programming and playlist management</li>
<li>Professional lighting effects (if included in package)</li>
<li>Equipment setup and breakdown</li>
</ul>
</div>

<div class="section">
<h2>2. EVENT DETAILS</h2>
<p><strong>Event Date:</strong> {{event_date}}</p>
<p><strong>Event Type:</strong> {{event_type}}</p>
<p><strong>Venue:</strong> {{venue_name}}</p>
<p><strong>Address:</strong> {{venue_address}}</p>
<p><strong>Expected Guest Count:</strong> {{guest_count}}</p>
</div>

<div class="section">
<h2>3. COMPENSATION</h2>
<p><strong>Total Contract Amount:</strong> {{invoice_total}}</p>
<p><strong>Initial Deposit (Due upon signing):</strong> {{deposit_amount}}</p>
<p><strong>Remaining Balance:</strong> {{remaining_balance}}</p>
<p>{{payment_schedule}}</p>
</div>

<div class="section">
<h2>4. CANCELLATION POLICY</h2>
<ul>
<li>Cancellations made 60+ days before event: Full refund minus 10% booking fee</li>
<li>Cancellations made 30-60 days before event: 50% of total amount refunded</li>
<li>Cancellations made less than 30 days before event: Non-refundable</li>
<li>In case of Company cancellation: Full refund of all payments</li>
</ul>
</div>

<div class="section">
<h2>5. RESCHEDULING</h2>
<p>If the Client needs to reschedule the event, the Company will make every effort to accommodate the new date if available. Any changes must be requested at least 30 days before the original event date.</p>
</div>

<div class="section">
<h2>6. TERMS AND CONDITIONS</h2>
<p>The Company will provide services in a professional manner. The Client agrees to provide safe and appropriate venue access for equipment setup. Both parties agree to communicate any changes or concerns in a timely manner.</p>
</div>

<div class="signature-section">
<h2>SIGNATURES</h2>

<div class="signature-box">
<h3>CLIENT SIGNATURE</h3>
<p>{{signature_area}}</p>
<p>Name (Print or Type): {{editable_signer_name}}</p>
<p>Email: {{editable_signer_email}}</p>
<p>Date: {{signature_date}}</p>
</div>

<div class="signature-box">
<h3>{{company_name}} - AUTHORIZED REPRESENTATIVE</h3>
<p>Authorized By: {{editable_company_name}}</p>
<p>Title: {{signature_title}}</p>
<p>Email: {{editable_company_email}}</p>
<p>Date: {{signature_date}}</p>
</div>

<p style="margin-top: 30px; font-size: 11px; color: #999;"><strong>Contract Number:</strong> {{contract_number}}</p>
</div>

</body>
</html>`;
}

/**
 * Ensure a contract exists for an invoice
 * @param {string} invoiceId - The invoice.id
 * @param {Object} supabaseClient - Optional Supabase client
 * @returns {Object} Result with contract info
 */
export async function ensureContractExistsForInvoice(invoiceId, supabaseClient = null) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get the invoice with related contact and project
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        contacts:contact_id(*),
        events:project_id(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      return { success: false, error: invoiceError.message };
    }

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Check if contract already exists for this invoice
    if (invoice.contract_id) {
      const { data: existingContract } = await supabase
        .from('contracts')
        .select('id, status, signing_token, signing_token_expires_at, contract_html')
        .eq('id', invoice.contract_id)
        .single();

      if (existingContract) {
        // If contract exists but doesn't have a signing token, generate one
        if (!existingContract.signing_token) {
          const signingToken = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // Token valid for 30 days

          await supabase
            .from('contracts')
            .update({
              signing_token: signingToken,
              signing_token_expires_at: expiresAt.toISOString()
            })
            .eq('id', existingContract.id);

          existingContract.signing_token = signingToken;
          existingContract.signing_token_expires_at = expiresAt.toISOString();
        }

        // If contract exists but doesn't have contract_html, generate it
        if (!existingContract.contract_html) {
          const result = await generateContractHtml(invoice, contact, event, existingContract.contract_number || '', supabase);
          if (result && result.contractHtml) {
            await supabase
              .from('contracts')
              .update({ contract_html: result.contractHtml, contract_template: result.templateName })
              .eq('id', existingContract.id);
          }
        }

        return { 
          success: true, 
          contract_id: existingContract.id,
          created: false,
          contract: existingContract
        };
      }
    }

    // Get contact info
    const contact = invoice.contacts || null;
    
    if (!contact) {
      return { success: false, error: 'Contact not found for invoice' };
    }

    // Check if there's already a contract for this contact (prevent duplicates)
    const { data: existingContractForContact } = await supabase
      .from('contracts')
      .select('id')
      .eq('contact_id', invoice.contact_id)
      .not('status', 'in', '("cancelled","expired")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingContractForContact) {
      // Link existing contract to invoice if not linked
      if (!invoice.contract_id) {
        await supabase
          .from('invoices')
          .update({ contract_id: existingContractForContact.id })
          .eq('id', invoiceId);
      }

      // Ensure existing contract has a signing token and contract_html
      const { data: contractWithToken } = await supabase
        .from('contracts')
        .select('id, status, signing_token, signing_token_expires_at, contract_html, contract_number')
        .eq('id', existingContractForContact.id)
        .single();

      let needsUpdate = false;
      const updateData = {};

      if (contractWithToken && !contractWithToken.signing_token) {
        const signingToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        updateData.signing_token = signingToken;
        updateData.signing_token_expires_at = expiresAt.toISOString();
        needsUpdate = true;

        contractWithToken.signing_token = signingToken;
        contractWithToken.signing_token_expires_at = expiresAt.toISOString();
      }

      if (contractWithToken && !contractWithToken.contract_html) {
        const result = await generateContractHtml(invoice, contact, event, contractWithToken.contract_number || '', supabase);
        if (result && result.contractHtml) {
          updateData.contract_html = result.contractHtml;
          updateData.contract_template = result.templateName;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await supabase
          .from('contracts')
          .update(updateData)
          .eq('id', existingContractForContact.id);
      }

      return { 
        success: true, 
        contract_id: existingContractForContact.id,
        created: false,
        contract: contractWithToken || existingContractForContact
      };
    }

    // Get event/project info if available
    const event = invoice.events || null;

    // Generate contract number (consistent format: CONT-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of contracts created today for sequence number
    const { count: todayCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().slice(0, 10) + 'T00:00:00Z')
      .lt('created_at', today.toISOString().slice(0, 10) + 'T23:59:59Z');

    const sequenceNum = String((todayCount || 0) + 1).padStart(3, '0');
    const contractNumber = `CONT-${dateStr}-${sequenceNum}`;

    // Generate signing token for contract
    const signingToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token valid for 30 days

    // Generate contract HTML
    const { contractHtml, templateName } = await generateContractHtml(invoice, contact, event, contractNumber, supabase);

    // Create draft contract
    const contractData = {
      contact_id: invoice.contact_id,
      invoice_id: invoice.id, // Link to invoice
      quote_selection_id: null, // May be linked later if quote exists
      contract_number: contractNumber,
      contract_type: 'service_agreement',
      event_name: eventName,
      event_type: event?.event_type || contact.event_type || null,
      event_date: event?.event_date || contact.event_date || null,
      event_time: event?.start_time || contact.event_time || null,
      venue_name: event?.venue_name || contact.venue_name || null,
      venue_address: event?.venue_address || contact.venue_address || null,
      guest_count: event?.number_of_guests || contact.guest_count || null,
      total_amount: invoice.total_amount || 0,
      deposit_amount: invoice.deposit_amount || (invoice.total_amount || 0) * 0.5, // Use invoice deposit or default to 50%
      deposit_percentage: invoice.deposit_amount && invoice.total_amount ? 
        Math.round((invoice.deposit_amount / invoice.total_amount) * 100) : 50,
      status: 'draft',
      contract_template: templateName,
      contract_html: contractHtml, // Generated HTML content
      signing_token: signingToken,
      signing_token_expires_at: expiresAt.toISOString()
    };

    // Link organization if exists
    if (invoice.organization_id || contact.organization_id) {
      contractData.organization_id = invoice.organization_id || contact.organization_id;
    }

    // Link to quote_selection if it exists (invoice might be linked to a quote)
    if (invoice.quote_selection_id) {
      contractData.quote_selection_id = invoice.quote_selection_id;
    } else {
      // Try to find quote_selection by contact_id
      const { data: quoteSelection } = await supabase
        .from('quote_selections')
        .select('id')
        .eq('lead_id', invoice.contact_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (quoteSelection) {
        contractData.quote_selection_id = quoteSelection.id;
      }
    }

    const { data: newContract, error: contractError } = await supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract for invoice:', contractError);
      return { success: false, error: contractError.message };
    }

    // Update invoice with contract_id
    await supabase
      .from('invoices')
      .update({ contract_id: newContract.id })
      .eq('id', invoiceId);

    // Update quote_selection with contract_id if linked
    if (contractData.quote_selection_id) {
      await supabase
        .from('quote_selections')
        .update({ contract_id: newContract.id })
        .eq('id', contractData.quote_selection_id);
    }

    console.log(`✅ Created draft contract ${newContract.id} for invoice ${invoiceId}`);

    return { 
      success: true, 
      contract_id: newContract.id,
      created: true,
      contract: newContract
    };

  } catch (error) {
    console.error('Error in ensureContractExistsForInvoice:', error);
    return { success: false, error: error.message };
  }
}
