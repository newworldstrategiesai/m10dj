import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId, clientName, clientEmail, signatureData, signatureMethod } = req.body;

  if (!leadId || !clientName) {
    return res.status(400).json({ error: 'Lead ID and client name are required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quote_selections')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (quoteError || !quote) {
      console.error('Quote error:', quoteError);
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Find or create contact in contacts table
    let contactId = null;
    
    // First, try to find contact by email
    if (clientEmail) {
      const { data: existingContact, error: emailError } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_address', clientEmail)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (!emailError && existingContact) {
        contactId = existingContact.id;
      }
    }
    
    // If not found by email, try by leadId (in case leadId is already a contact UUID)
    if (!contactId) {
      const { data: contactById, error: idError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', leadId)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (!idError && contactById) {
        contactId = contactById.id;
      }
    }
    
    // If still not found, create a new contact
    if (!contactId) {
      const nameParts = (clientName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email_address: clientEmail,
          lead_status: 'Booked'
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating contact:', createError);
        return res.status(500).json({ error: 'Failed to create contact' });
      }
      
      contactId = newContact.id;
    }

    // Get or create contract
    let contract = null;
    if (quote.contract_id) {
      const { data: existingContract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', quote.contract_id)
        .single();
      contract = existingContract;
    }

    // If no contract exists, create one
    if (!contract) {
      const contractData = {
        contact_id: contactId,
        event_name: quote.package_name,
        total_amount: quote.total_price,
        deposit_amount: quote.total_price * 0.5,
        status: 'sent'
      };
      
      // Only add service_selection_id if the table exists and the foreign key is valid
      // For now, we'll skip it since quote_selections might not match service_selections
      
      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (contractError) {
        console.error('Error creating contract:', contractError);
        return res.status(500).json({ error: 'Failed to create contract', details: contractError.message });
      }

      contract = newContract;

      // Update quote with contract_id
      await supabase
        .from('quote_selections')
        .update({ contract_id: contract.id })
        .eq('lead_id', leadId);
    }

    // Update contract with signature
    const updateData = {
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_client: clientName,
        signed_by_client_email: clientEmail,
        signed_by_client_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    // Add signature data if provided
    if (signatureData) {
      updateData.client_signature_data = signatureData;
    }
    
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contract.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return res.status(500).json({ error: 'Failed to sign contract' });
    }

    // Update quote_selections with signature
    await supabase
      .from('quote_selections')
      .update({
        signature: clientName,
        signed_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    res.status(200).json({
      success: true,
      contract: updatedContract
    });
  } catch (error) {
    console.error('Error in sign contract API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
