import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: 'Contract ID is required' });
  }

  try {
    // Fetch contract with contact details
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        contacts (
          first_name,
          last_name,
          email_address
        )
      `)
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status === 'signed') {
      return res.status(400).json({ error: 'Contract is already signed' });
    }

    if (!contract.signing_token) {
      return res.status(400).json({ error: 'Contract has no signing token' });
    }

    // Generate signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-contract/${contract.signing_token}`;

    // Send email to client
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: contract.contacts.email_address,
        subject: `Please sign your contract - ${contract.event_name}`,
        html: `
          <h2>Your Contract is Ready to Sign</h2>
          <p>Dear ${contract.contacts.first_name},</p>
          <p>Your contract for <strong>${contract.event_name}</strong> is ready for your signature.</p>
          <p><strong>Event Details:</strong></p>
          <ul>
            <li>Event: ${contract.event_name}</li>
            <li>Date: ${new Date(contract.event_date).toLocaleDateString()}</li>
            <li>Venue: ${contract.venue_name}</li>
            <li>Total Amount: $${contract.total_amount.toLocaleString()}</li>
          </ul>
          <p style="margin: 30px 0;">
            <a href="${signingUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Sign Contract
            </a>
          </p>
          <p>This link will expire on ${new Date(contract.signing_token_expires_at).toLocaleDateString()}.</p>
          <p>If you have any questions, please don't hesitate to reach out.</p>
          <p>Best regards,<br/>M10 DJ Company<br/>m10djcompany@gmail.com</p>
        `
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    // Update contract status to 'sent'
    await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', contractId);

    console.log(`✅ Contract ${contract.contract_number} sent to ${contract.contacts.email_address}`);

    res.status(200).json({
      success: true,
      message: 'Contract sent successfully',
      signing_url: signingUrl
    });
  } catch (error) {
    console.error('Error sending contract:', error);
    res.status(500).json({ error: 'Failed to send contract' });
  }
}

