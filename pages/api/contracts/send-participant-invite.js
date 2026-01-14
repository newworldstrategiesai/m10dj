const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { participantId, contractId, contractNumber, participantName, participantEmail, signingToken } = req.body;

  if (!participantId || !contractId || !contractNumber || !participantName || !participantEmail || !signingToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify participant exists and belongs to contract
    const { data: participant, error: participantError } = await supabase
      .from('contract_participants')
      .select('*, contracts(*)')
      .eq('id', participantId)
      .eq('contract_id', contractId)
      .single();

    if (participantError || !participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Generate signing URL
    const signingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com'}/sign-contract/${signingToken}`;

    // Send email invitation
    // TODO: Integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll just log it and update the status
    console.log('[send-participant-invite] Sending invitation:', {
      participantId,
      participantEmail,
      signingUrl,
      contractNumber
    });

    // Update participant status to 'sent'
    const { error: updateError } = await supabase
      .from('contract_participants')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', participantId);

    if (updateError) {
      throw updateError;
    }

    // TODO: Actually send email here
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'contracts@m10djcompany.com',
    //   to: participantEmail,
    //   subject: `Please Sign Contract ${contractNumber}`,
    //   html: `...`
    // });

    return res.status(200).json({
      success: true,
      message: 'Invitation sent',
      signingUrl // Return URL for manual sharing if needed
    });
  } catch (error) {
    console.error('Error sending participant invite:', error);
    return res.status(500).json({ error: error.message || 'Failed to send invitation' });
  }
}
