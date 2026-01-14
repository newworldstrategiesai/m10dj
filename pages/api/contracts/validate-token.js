import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Fetch contract by signing token
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        contract_html,
        contract_type,
        event_name,
        event_date,
        total_amount,
        status,
        signing_token,
        signing_token_expires_at,
        signed_at,
        signed_by_client,
        signed_by_client_email,
        client_signature_data,
        contact_id,
        recipient_name,
        recipient_email,
        sender_name,
        sender_email,
        is_personal,
        purpose,
        contacts (
          first_name,
          last_name,
          email_address
        )
      `)
      .eq('signing_token', token)
      .single();

    if (error || !contract) {
      return res.status(404).json({ error: 'Invalid or expired contract link' });
    }

    // Check if token is expired
    if (contract.signing_token_expires_at && new Date(contract.signing_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This contract link has expired' });
    }

    // Handle both contact-based and standalone contracts
    let contactInfo;
    if (contract.contacts) {
      // Traditional contract with contact
      contactInfo = {
        first_name: contract.contacts.first_name,
        last_name: contract.contacts.last_name,
        email_address: contract.contacts.email_address
      };
    } else if (contract.recipient_name) {
      // Standalone contract with recipient info
      const nameParts = contract.recipient_name.split(' ');
      contactInfo = {
        first_name: nameParts[0] || contract.recipient_name,
        last_name: nameParts.slice(1).join(' ') || '',
        email_address: contract.recipient_email
      };
    } else {
      contactInfo = {
        first_name: 'Recipient',
        last_name: '',
        email_address: ''
      };
    }

    // Format response
    const response = {
      valid: true,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        contract_html: contract.contract_html,
        contract_type: contract.contract_type,
        event_name: contract.event_name || contract.purpose,
        event_date: contract.event_date,
        total_amount: contract.total_amount,
        status: contract.status,
        signed_at: contract.signed_at || null,
        signed_by_client: contract.signed_by_client || null,
        signed_by_client_email: contract.signed_by_client_email || null,
        client_signature_data: contract.client_signature_data || null,
        is_personal: contract.is_personal,
        is_standalone: !contract.contact_id,
        sender_name: contract.sender_name,
        sender_email: contract.sender_email,
        contact: contactInfo
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error validating contract token:', error);
    res.status(500).json({ error: 'Failed to validate contract link' });
  }
}

