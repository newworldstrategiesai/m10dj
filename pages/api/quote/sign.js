import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId, clientName, clientEmail } = req.body;

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
      return res.status(404).json({ error: 'Quote not found' });
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
      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          contact_id: leadId,
          service_selection_id: quote.id,
          event_name: quote.package_name,
          total_amount: quote.total_price,
          deposit_amount: quote.total_price * 0.5,
          status: 'sent'
        })
        .select()
        .single();

      if (contractError) {
        console.error('Error creating contract:', contractError);
        return res.status(500).json({ error: 'Failed to create contract' });
      }

      contract = newContract;

      // Update quote with contract_id
      await supabase
        .from('quote_selections')
        .update({ contract_id: contract.id })
        .eq('lead_id', leadId);
    }

    // Update contract with signature
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_client: clientName,
        signed_by_client_email: clientEmail,
        signed_by_client_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      })
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
