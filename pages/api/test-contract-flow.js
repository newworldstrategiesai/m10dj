import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import contract generation logic (simplified version)
function getDefaultContractTemplate() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { color: #1a1a1a; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 10px; }
h2 { color: #333; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
</style>
</head>
<body>
<h1>DJ SERVICES AGREEMENT</h1>
<p>This Agreement is entered into effective as of <strong>{{effective_date}}</strong>, between <strong>{{client_full_name}}</strong> ("Client") and <strong>{{company_name}}</strong> ("Company").</p>
<h2>1. DESCRIPTION OF SERVICES</h2>
<p>The Company agrees to provide professional DJ services for {{event_type}} on {{event_date}} at {{venue_name}}.</p>
<h2>2. COMPENSATION</h2>
<p><strong>Total Contract Amount:</strong> {{invoice_total}}</p>
<p><strong>Initial Deposit:</strong> {{deposit_amount}}</p>
</body>
</html>`;
}

async function generateContract(contactId) {
  // Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    throw new Error('Contact not found');
  }

  // Get template
  let { data: template, error: templateError } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (templateError || !template || !template.template_content) {
    template = {
      template_content: getDefaultContractTemplate(),
      name: 'Default Contract'
    };
  }

  // Prepare variables
  const totalAmount = contact.quoted_price || 3500;
  const depositAmount = totalAmount * 0.5;

  const variables = {
    client_full_name: `${contact.first_name} ${contact.last_name}`,
    event_type: contact.event_type || 'Event',
    event_date: contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '',
    venue_name: contact.venue_name || '',
    invoice_total: `$${totalAmount.toFixed(2)}`,
    deposit_amount: `$${depositAmount.toFixed(2)}`,
    effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    company_name: 'M10 DJ Company'
  };

  // Replace variables
  let contractHtml = template.template_content;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    contractHtml = contractHtml.replace(regex, variables[key] || '');
  });

  // Generate token
  const signingToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Create contract
  const { data: newContract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      contact_id: contactId,
      event_name: `${contact.first_name} ${contact.last_name} ${contact.event_type || 'Event'}`,
      event_type: contact.event_type || 'other',
      event_date: contact.event_date,
      venue_name: contact.venue_name || null,
      venue_address: contact.venue_address || null,
      guest_count: contact.guest_count || null,
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
    throw contractError;
  }

  return {
    contract: newContract,
    signingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/sign-contract/${signingToken}`
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testResults = {
    step1_contact_creation: { success: false, error: null, data: null },
    step2_contract_generation: { success: false, error: null, data: null },
    step3_contract_sending: { success: false, error: null, data: null },
    step4_contract_signing: { success: false, error: null, data: null },
    cleanup: { success: false, error: null }
  };

  let testContactId = null;
  let testContractId = null;
  let signingToken = null;

  try {
    console.log('🧪 Starting end-to-end contract flow test...');

    // STEP 1: Create a new wedding prospect contact
    console.log('📝 Step 1: Creating wedding prospect contact...');
    const testContactData = {
      first_name: 'Emily',
      last_name: 'Williams',
      email_address: `test.wedding.${Date.now()}@example.com`,
      phone: '+19015551234',
      event_type: 'wedding',
      event_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      event_time: '17:00:00',
      venue_name: 'Memphis Botanic Garden',
      venue_address: '750 Cherry Rd, Memphis, TN 38117',
      guest_count: 200,
      event_duration_hours: 6,
      budget_range: '$2,500-$5,000',
      quoted_price: 3500.00,
      lead_status: 'New',
      lead_source: 'Website',
      lead_stage: 'Initial Inquiry',
      lead_temperature: 'Hot',
      communication_preference: 'email',
      special_requests: 'Looking for a DJ who can play a mix of country, pop, and R&B. Need microphones for speeches.',
      notes: 'Test contact created for contract flow testing'
    };

    // Get admin user ID
    const { data: adminUsers } = await supabase.auth.admin.listUsers();
    const adminUser = adminUsers?.users?.find(u => 
      ['djbenmurray@gmail.com', 'admin@m10djcompany.com'].includes(u.email)
    );

    if (adminUser) {
      testContactData.user_id = adminUser.id;
      testContactData.assigned_to = adminUser.id;
    }

    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert([testContactData])
      .select()
      .single();

    if (contactError || !newContact) {
      testResults.step1_contact_creation.error = contactError?.message || 'Failed to create contact';
      throw new Error(`Failed to create contact: ${contactError?.message}`);
    }

    testContactId = newContact.id;
    testResults.step1_contact_creation.success = true;
    testResults.step1_contact_creation.data = {
      id: newContact.id,
      name: `${newContact.first_name} ${newContact.last_name}`,
      email: newContact.email_address,
      event_type: newContact.event_type,
      event_date: newContact.event_date
    };
    console.log('✅ Contact created:', testContactId);

    // STEP 2: Generate contract from contact
    console.log('📄 Step 2: Generating contract...');
    const contractResult = await generateContract(testContactId);
    
    testContractId = contractResult.contract.id;
    signingToken = contractResult.contract.signing_token;
    testResults.step2_contract_generation.success = true;
    testResults.step2_contract_generation.data = {
      contract_id: testContractId,
      contract_number: contractResult.contract.contract_number,
      signing_url: contractResult.signingUrl
    };
    console.log('✅ Contract generated:', testContractId);

    // STEP 3: Send contract for signature (update status)
    console.log('📧 Step 3: Sending contract for signature...');
    const { error: sendError } = await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', testContractId);

    if (sendError) {
      testResults.step3_contract_sending.error = sendError.message;
      console.warn('⚠️ Contract send status update failed:', sendError.message);
    } else {
      testResults.step3_contract_sending.success = true;
      testResults.step3_contract_sending.data = { signing_url: contractResult.signingUrl };
      console.log('✅ Contract sent for signature');
    }

    // STEP 4: Test contract signing
    console.log('✍️ Step 4: Testing contract signing...');
    const signatureName = `${newContact.first_name} ${newContact.last_name}`;
    // Create a simple signature data (base64 encoded placeholder)
    const signatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const { error: signError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_client: signatureName,
        signed_by_client_email: newContact.email_address,
        signed_by_client_ip: clientIp,
        client_signature_data: signatureData,
        updated_at: new Date().toISOString()
      })
      .eq('id', testContractId);

    if (signError) {
      testResults.step4_contract_signing.error = signError.message;
      throw new Error(`Failed to sign contract: ${signError.message}`);
    }

    testResults.step4_contract_signing.success = true;
    
    // Verify final contract status
    const { data: finalContract, error: finalError } = await supabase
      .from('contracts')
      .select('status, signed_at, signed_by_client')
      .eq('id', testContractId)
      .single();

    if (!finalError && finalContract) {
      testResults.step4_contract_signing.data = {
        contract_id: testContractId,
        status: finalContract.status,
        signed_at: finalContract.signed_at,
        signed_by: finalContract.signed_by_client
      };
    }
    console.log('✅ Contract signed successfully');

    // Cleanup: Delete test data
    console.log('🧹 Cleaning up test data...');
    if (testContractId) {
      await supabase.from('contracts').delete().eq('id', testContractId);
    }
    if (testContactId) {
      await supabase.from('contacts').delete().eq('id', testContactId);
    }
    testResults.cleanup.success = true;
    console.log('✅ Cleanup complete');

    return res.status(200).json({
      success: true,
      message: 'End-to-end contract flow test completed successfully!',
      results: testResults,
      summary: {
        contact_created: testResults.step1_contact_creation.success,
        contract_generated: testResults.step2_contract_generation.success,
        contract_sent: testResults.step3_contract_sending.success,
        contract_signed: testResults.step4_contract_signing.success,
        cleanup_complete: testResults.cleanup.success
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);

    // Cleanup on error
    try {
      if (testContractId) {
        await supabase.from('contracts').delete().eq('id', testContractId);
      }
      if (testContactId) {
        await supabase.from('contacts').delete().eq('id', testContactId);
      }
      testResults.cleanup.success = true;
    } catch (cleanupError) {
      testResults.cleanup.error = cleanupError.message;
    }

    return res.status(500).json({
      success: false,
      error: 'Contract flow test failed',
      message: error.message,
      results: testResults,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

