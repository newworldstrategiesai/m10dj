const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { signature_name, signature_data, signature_method, signing_token } = req.body;

  if (!id || !signature_name || !signature_data || !signing_token) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get client IP address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Verify participant exists and token matches
    const { data: participant, error: participantError } = await supabase
      .from('contract_participants')
      .select('*, contracts(*)')
      .eq('id', id)
      .eq('signing_token', signing_token)
      .single();

    if (participantError || !participant) {
      return res.status(404).json({ error: 'Invalid participant or token' });
    }

    // Check if token has expired
    if (participant.signing_token_expires_at && new Date(participant.signing_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This signing link has expired' });
    }

    // Check if already signed
    if (participant.status === 'signed' && participant.signature_data) {
      return res.status(400).json({ error: 'This contract has already been signed by this participant' });
    }

    // Update participant with signature
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('contract_participants')
      .update({
        signed_at: new Date().toISOString(),
        signed_by: signature_name,
        signed_by_email: participant.email,
        signed_by_ip: clientIp,
        signature_data: signature_data,
        status: 'signed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Contract ${participant.contracts.contract_number} signed by participant ${signature_name}`);

    // Check if contract should be marked as fully signed
    // (all required signers have signed)
    const { data: allParticipants, error: participantsError } = await supabase
      .from('contract_participants')
      .select('status')
      .eq('contract_id', participant.contract_id);

    if (!participantsError && allParticipants) {
      const allSigned = allParticipants.every(p => p.status === 'signed');
      const clientSigned = participant.contracts.client_signature_data;
      const vendorSigned = participant.contracts.vendor_signature_data;

      // If all participants signed, and client/vendor have signed, mark contract as completed
      if (allSigned && clientSigned && vendorSigned && participant.contracts.status !== 'completed') {
        await supabase
          .from('contracts')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', participant.contract_id);
      }
    }

    return res.status(200).json({
      success: true,
      participant: updatedParticipant,
      message: 'Contract signed successfully'
    });
  } catch (error) {
    console.error('Error signing participant contract:', error);
    return res.status(500).json({ error: error.message || 'Failed to sign contract' });
  }
}
