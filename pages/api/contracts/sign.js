import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, signature_name, signature_data, signature_method } = req.body;

  if (!token || !signature_name || !signature_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get client IP address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Fetch contract to verify it's valid and not already signed
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*, contacts(first_name, last_name, email_address)')
      .eq('signing_token', token)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({ error: 'Invalid contract link' });
    }

    if (contract.status === 'signed') {
      return res.status(400).json({ error: 'This contract has already been signed' });
    }

    if (new Date(contract.signing_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This contract link has expired' });
    }

    // Update contract with signature
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_client: signature_name,
        signed_by_client_email: contract.contacts.email_address,
        signed_by_client_ip: clientIp,
        client_signature_data: signature_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', contract.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Contract ${contract.contract_number} signed by ${signature_name}`);

    // TODO: Generate PDF with signature
    // TODO: Send signed contract via email
    // TODO: Send admin notification

    // Send confirmation email to client
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contract.contacts.email_address,
          subject: `Contract Signed - ${contract.event_name}`,
          html: `
            <h2>Contract Signed Successfully</h2>
            <p>Dear ${contract.contacts.first_name},</p>
            <p>Thank you for signing your contract for <strong>${contract.event_name}</strong>.</p>
            <p><strong>Contract Details:</strong></p>
            <ul>
              <li>Contract Number: ${contract.contract_number}</li>
              <li>Event Date: ${new Date(contract.event_date).toLocaleDateString()}</li>
              <li>Total Amount: $${contract.total_amount.toLocaleString()}</li>
              <li>Signed: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>A copy of the signed contract is attached to this email.</p>
            <p>We'll be in touch soon with next steps and payment information.</p>
            <p>Best regards,<br/>M10 DJ Company</p>
          `
        })
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send admin notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'm10djcompany@gmail.com',
          subject: `🎉 Contract Signed - ${contract.event_name}`,
          html: `
            <h2>Contract Signed!</h2>
            <p><strong>${signature_name}</strong> has signed the contract for <strong>${contract.event_name}</strong>.</p>
            <p><strong>Contract Details:</strong></p>
            <ul>
              <li>Contract Number: ${contract.contract_number}</li>
              <li>Client: ${contract.contacts.first_name} ${contract.contacts.last_name}</li>
              <li>Email: ${contract.contacts.email_address}</li>
              <li>Event: ${contract.event_name}</li>
              <li>Event Date: ${new Date(contract.event_date).toLocaleDateString()}</li>
              <li>Total Amount: $${contract.total_amount.toLocaleString()}</li>
              <li>Signature Method: ${signature_method || 'draw'}</li>
              <li>Signed At: ${new Date().toLocaleString()}</li>
              <li>IP Address: ${clientIp}</li>
            </ul>
            <p>Next steps: Send deposit invoice and finalize event details.</p>
          `
        })
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Contract signed successfully',
      contract_number: contract.contract_number
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ error: 'Failed to sign contract' });
  }
}

