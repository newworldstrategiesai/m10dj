import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, invoiceId, templateId, serviceSelectionId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Check subscription access for contracts feature (skip for platform admins)
    if (!isAdmin) {
      const { canAccessAdminPage } = await import('@/utils/subscription-access');
      const access = await canAccessAdminPage(supabase, session.user.email, 'contracts');
      
      if (!access.canAccess) {
        return res.status(403).json({
          error: 'Subscription required',
          message: access.reason || 'This feature requires a Professional subscription.',
          upgradeRequired: true,
          requiredTier: access.requiredTier || 'professional'
        });
      }
    }

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Use service role for queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contact details with organization filtering
    let contactQuery = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactId);

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: contact, error: contactError } = await contactQuery.single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Fetch invoice if provided (with organization filtering)
    let invoice = null;
    if (invoiceId) {
      let invoiceQuery = supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', invoiceId);

      // For SaaS users, filter by organization_id
      if (!isAdmin && orgId) {
        invoiceQuery = invoiceQuery.eq('organization_id', orgId);
      }

      const { data: invoiceData, error: invoiceError } = await invoiceQuery.single();

      if (!invoiceError && invoiceData) {
        invoice = invoiceData;
      }
    }

    // Fetch template (use default if not specified, or create inline template if none exists)
    // Templates should be filtered by organization_id if the table has it
    let template;
    if (templateId) {
      let templateQuery = supabaseAdmin
        .from('contract_templates')
        .select('*')
        .eq('id', templateId);

      // If contract_templates has organization_id, filter by it
      // Otherwise, allow access (templates may be shared)
      if (!isAdmin && orgId) {
        // Check if table has organization_id column - if so, filter
        // For now, allow access (templates may be organization-scoped or shared)
        templateQuery = templateQuery;
      }

      const { data: templateData, error: templateError } = await templateQuery.single();

      if (templateError || !templateData) {
        console.error('Template fetch error:', templateError);
        return res.status(404).json({ error: 'Template not found', details: templateError?.message });
      }
      template = templateData;
    } else {
      // Get default template, or first active template if no default
      let { data: defaultTemplate, error: templateError } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      // If no default, get first active template
      if (templateError || !defaultTemplate) {
        console.log('No default template found, looking for any active template...');
        const { data: activeTemplates, error: activeError } = await supabase
          .from('contract_templates')
          .select('*')
          .eq('is_active', true)
          .limit(1);
        
        if (activeError || !activeTemplates || activeTemplates.length === 0) {
          console.log('No templates found, using default inline template');
          // Create a default inline template if none exists
          const defaultTemplateContent = getDefaultContractTemplate();
          console.log('Default template content length:', defaultTemplateContent.length);
          template = {
            id: null,
            name: 'Default Contract',
            description: 'Auto-generated default contract template',
            template_type: 'service_agreement',
            template_content: defaultTemplateContent,
            is_active: true,
            is_default: false,
            version: 1
          };
        } else {
          template = activeTemplates[0];
        }
      } else {
        template = defaultTemplate;
      }
    }

    // If template exists but has no content, use default template
    if (template && (!template.template_content || template.template_content.trim() === '')) {
      console.log('Template found but has empty content, using default template');
      template = {
        id: template.id,
        name: template.name || 'Default Contract',
        description: template.description || 'Auto-generated default contract template',
        template_type: template.template_type || 'service_agreement',
        template_content: getDefaultContractTemplate(),
        is_active: template.is_active,
        is_default: template.is_default,
        version: template.version || 1
      };
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
      
      event_name: `${contact.first_name} ${contact.last_name} ${contact.event_type || 'Event'}`,
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
    if (!template || !template.template_content) {
      console.error('Template or template_content is missing:', { 
        hasTemplate: !!template, 
        hasContent: !!template?.template_content,
        templateName: template?.name 
      });
      throw new Error('Template content is empty or undefined');
    }
    
    let contractHtml = template.template_content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      contractHtml = contractHtml.replace(regex, variables[key] || '');
    });

    // Generate unique signing token
    const signingToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token valid for 30 days

    // Create contract record (must set organization_id)
    const { data: newContract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .insert({
        contact_id: contactId,
        invoice_id: invoiceId || null,
        service_selection_id: serviceSelectionId || null,
        organization_id: orgId || contact.organization_id, // Set organization_id
        
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
        contract_template: template.name || 'Default Contract',
        contract_html: contractHtml,
        
        signing_token: signingToken,
        signing_token_expires_at: expiresAt.toISOString(),
        
        effective_date: new Date().toISOString()
      })
      .select()
      .single();

    if (contractError) {
      console.error('Contract insert error:', contractError);
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
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate contract', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
