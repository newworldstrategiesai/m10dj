import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, invoiceId, templateId, serviceSelectionId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Fetch invoice if provided
    let invoice = null;
    if (invoiceId) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!invoiceError && invoiceData) {
        invoice = invoiceData;
      }
    }

    // Fetch template (use default if not specified)
    let template;
    if (templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !templateData) {
        return res.status(404).json({ error: 'Template not found' });
      }
      template = templateData;
    } else {
      // Get default template
      const { data: defaultTemplate, error: templateError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (templateError || !defaultTemplate) {
        return res.status(404).json({ error: 'No default template found' });
      }
      template = defaultTemplate;
    }

    // Prepare template variables
    const totalAmount = invoice ? invoice.total : (contact.budget_range ? parseFloat(contact.budget_range.split('-')[0]) : 0);
    const depositAmount = invoice ? (invoice.total * 0.5) : (totalAmount * 0.5);
    
    // Build payment schedule HTML
    let paymentScheduleHtml = '';
    if (invoice && invoice.line_items) {
      paymentScheduleHtml = '<ul>';
      paymentScheduleHtml += `<li>50% deposit ($${depositAmount.toFixed(2)}) due upon signing</li>`;
      paymentScheduleHtml += `<li>50% balance ($${(totalAmount - depositAmount).toFixed(2)}) due 30 days before event</li>`;
      paymentScheduleHtml += '</ul>';
    }

    const variables = {
      client_name: `${contact.first_name} ${contact.last_name}`,
      client_first_name: contact.first_name,
      client_last_name: contact.last_name,
      client_full_name: `${contact.first_name} ${contact.last_name}`,
      client_email: contact.email_address || contact.primary_email || '',
      client_phone: contact.phone || '',
      
      event_name: contact.event_name || `${contact.first_name} ${contact.last_name} ${contact.event_type || 'Event'}`,
      event_type: contact.event_type || 'Event',
      event_date: contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '',
      event_date_short: contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US') : '',
      venue_name: contact.venue_name || '',
      venue_address: contact.venue_address || '',
      guest_count: contact.guest_count || '',
      
      invoice_total: `$${totalAmount.toFixed(2)}`,
      invoice_subtotal: `$${totalAmount.toFixed(2)}`,
      deposit_amount: `$${depositAmount.toFixed(2)}`,
      remaining_balance: `$${(totalAmount - depositAmount).toFixed(2)}`,
      payment_schedule: paymentScheduleHtml,
      total_amount: `$${totalAmount.toFixed(2)}`,
      
      contract_number: '', // Will be auto-generated
      effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      effective_date_short: new Date().toLocaleDateString('en-US'),
      today_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      
      company_name: 'M10 DJ Company',
      company_address: '65 Stewart Rd, Eads, Tennessee 38028',
      company_email: 'm10djcompany@gmail.com',
      company_phone: '(901) 555-0000',
      owner_name: 'Ben Murray'
    };

    // Replace template variables
    let contractHtml = template.template_content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      contractHtml = contractHtml.replace(regex, variables[key]);
    });

    // Generate unique signing token
    const signingToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token valid for 30 days

    // Create contract record
    const { data: newContract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        contact_id: contactId,
        invoice_id: invoiceId || null,
        service_selection_id: serviceSelectionId || null,
        
        event_name: variables.event_name,
        event_type: variables.event_type,
        event_date: contact.event_date,
        venue_name: variables.venue_name,
        venue_address: variables.venue_address,
        guest_count: contact.guest_count,
        
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        deposit_percentage: 50,
        
        status: 'draft',
        contract_template: template.name,
        contract_html: contractHtml,
        
        signing_token: signingToken,
        signing_token_expires_at: expiresAt.toISOString(),
        
        effective_date: new Date().toISOString()
      })
      .select()
      .single();

    if (contractError) {
      throw contractError;
    }

    console.log(`✅ Contract ${newContract.contract_number} generated for ${variables.client_name}`);

    // Generate signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-contract/${signingToken}`;

    res.status(200).json({
      success: true,
      contract: {
        id: newContract.id,
        contract_number: newContract.contract_number,
        signing_url: signingUrl,
        expires_at: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ error: 'Failed to generate contract', details: error.message });
  }
}
