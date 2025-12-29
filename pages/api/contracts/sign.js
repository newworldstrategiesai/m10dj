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

    if (contract.signing_token_expires_at && new Date(contract.signing_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This contract link has expired' });
    }

    // Get signer email - handle both contact-based and standalone contracts
    const signerEmail = contract.contacts?.email_address || contract.recipient_email || null;

    // Update contract with signature
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_client: signature_name,
        signed_by_client_email: signerEmail,
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

    // Determine contract details - handle both contact-based and standalone contracts
    const isStandalone = !contract.contacts;
    const signerFirstName = contract.contacts?.first_name || contract.recipient_name?.split(' ')[0] || 'Recipient';
    const signerFullName = contract.contacts 
      ? `${contract.contacts.first_name} ${contract.contacts.last_name}` 
      : contract.recipient_name || signature_name;
    const contractTitle = contract.event_name || contract.purpose || 'Agreement';
    const isPersonal = contract.is_personal || contract.contract_type === 'personal_agreement' || contract.contract_type === 'nda';

    // Send confirmation email to signer
    if (signerEmail) {
      try {
        const emailContent = isPersonal 
          ? `
            <h2>Agreement Signed Successfully</h2>
            <p>Dear ${signerFirstName},</p>
            <p>Thank you for signing the <strong>${contractTitle}</strong>.</p>
            <p><strong>Agreement Details:</strong></p>
            <ul>
              <li>Agreement ID: ${contract.contract_number}</li>
              <li>Signed: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>A copy of the signed agreement will be provided upon request.</p>
            <p>This agreement is now legally binding.</p>
          `
          : `
            <h2>Contract Signed Successfully</h2>
            <p>Dear ${signerFirstName},</p>
            <p>Thank you for signing your contract for <strong>${contractTitle}</strong>.</p>
            <p><strong>Contract Details:</strong></p>
            <ul>
              <li>Contract Number: ${contract.contract_number}</li>
              ${contract.event_date ? `<li>Event Date: ${new Date(contract.event_date).toLocaleDateString()}</li>` : ''}
              ${contract.total_amount ? `<li>Total Amount: $${Number(contract.total_amount).toLocaleString()}</li>` : ''}
              <li>Signed: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>A copy of the signed contract is attached to this email.</p>
            <p>We'll be in touch soon with next steps and payment information.</p>
            <p>Best regards,<br/>M10 DJ Company</p>
          `;

        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: signerEmail,
            subject: isPersonal 
              ? `Agreement Signed - ${contract.contract_number}` 
              : `Contract Signed - ${contractTitle}`,
            html: emailContent
          })
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send admin/sender notification
    try {
      const adminEmail = contract.sender_email || 'm10djcompany@gmail.com';
      const adminContent = isPersonal
        ? `
          <h2>Agreement Signed!</h2>
          <p><strong>${signature_name}</strong> has signed the agreement.</p>
          <p><strong>Agreement Details:</strong></p>
          <ul>
            <li>Agreement ID: ${contract.contract_number}</li>
            <li>Signer: ${signerFullName}</li>
            <li>Email: ${signerEmail || 'Not provided'}</li>
            <li>Signature Method: ${signature_method || 'draw'}</li>
            <li>Signed At: ${new Date().toLocaleString()}</li>
            <li>IP Address: ${clientIp}</li>
          </ul>
          <p>This agreement is now legally binding.</p>
        `
        : `
          <h2>Contract Signed!</h2>
          <p><strong>${signature_name}</strong> has signed the contract for <strong>${contractTitle}</strong>.</p>
          <p><strong>Contract Details:</strong></p>
          <ul>
            <li>Contract Number: ${contract.contract_number}</li>
            <li>Client: ${signerFullName}</li>
            <li>Email: ${signerEmail || 'Not provided'}</li>
            ${contract.event_date ? `<li>Event Date: ${new Date(contract.event_date).toLocaleDateString()}</li>` : ''}
            ${contract.total_amount ? `<li>Total Amount: $${Number(contract.total_amount).toLocaleString()}</li>` : ''}
            <li>Signature Method: ${signature_method || 'draw'}</li>
            <li>Signed At: ${new Date().toLocaleString()}</li>
            <li>IP Address: ${clientIp}</li>
          </ul>
          <p>Next steps: Send deposit invoice and finalize event details.</p>
        `;

      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmail,
          subject: isPersonal 
            ? `🔐 Agreement Signed - ${contract.contract_number}` 
            : `🎉 Contract Signed - ${contractTitle}`,
          html: adminContent
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

