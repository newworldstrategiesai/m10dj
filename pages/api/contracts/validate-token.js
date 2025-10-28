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
        event_name,
        event_date,
        total_amount,
        status,
        signing_token,
        signing_token_expires_at,
        contact_id,
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
    if (new Date(contract.signing_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This contract link has expired' });
    }

    // Format response
    const response = {
      valid: true,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        contract_html: contract.contract_html,
        event_name: contract.event_name,
        event_date: contract.event_date,
        total_amount: contract.total_amount,
        status: contract.status,
        contact: {
          first_name: contract.contacts.first_name,
          last_name: contract.contacts.last_name,
          email_address: contract.contacts.email_address
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error validating contract token:', error);
    res.status(500).json({ error: 'Failed to validate contract link' });
  }
}

