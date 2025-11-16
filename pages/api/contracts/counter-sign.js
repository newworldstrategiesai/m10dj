import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: 'Contract ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*, contacts:contact_id(*)')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if contract is already signed by client
    if (!contract.signed_at && contract.status !== 'signed') {
      return res.status(400).json({ error: 'Contract must be signed by client before counter-signing' });
    }

    // Update contract with counter-signature
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        counter_signed_at: new Date().toISOString(),
        admin_signed_at: new Date().toISOString(),
        status: 'executed'
      })
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return res.status(500).json({ error: 'Failed to counter-sign contract' });
    }

    // Get contact information
    const contact = contract.contacts || contract.contact_id;
    let contactData = null;
    
    if (typeof contact === 'string') {
      const { data: contactInfo } = await supabase
        .from('contacts')
        .select('first_name, last_name, email_address')
        .eq('id', contact)
        .single();
      contactData = contactInfo;
    } else {
      contactData = contact;
    }

    // Send email to customer with contract copy
    if (resend && contactData?.email_address) {
      try {
        const contractUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contract.contact_id}/contract`;
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #fff; margin: 0;">Contract Fully Executed!</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Dear ${contactData.first_name || 'Valued Client'},</p>
              
              <p>Great news! Your contract has been fully executed. Both parties have now signed the agreement.</p>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0;"><strong>Contract Details:</strong></p>
                <p style="margin: 5px 0;">Event: ${contract.event_name || 'N/A'}</p>
                <p style="margin: 5px 0;">Total Amount: $${contract.total_amount?.toLocaleString() || '0'}</p>
                <p style="margin: 5px 0;">Deposit: $${contract.deposit_amount?.toLocaleString() || '0'}</p>
                <p style="margin: 5px 0;">Signed Date: ${new Date(contract.signed_at).toLocaleDateString()}</p>
                <p style="margin: 5px 0;">Counter-Signed Date: ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${contractUrl}" 
                   style="background: #10b981; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Your Contract
                </a>
              </div>
              
              <p>This contract is now legally binding. We're excited to work with you on your event!</p>
              
              <p>If you have any questions, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: 'M10 DJ Company <hello@m10djcompany.com>',
          to: [contactData.email_address],
          subject: 'Your Contract Has Been Fully Executed - M10 DJ Company',
          html: emailHtml
        });

        console.log('✅ Contract copy sent to customer via email');
      } catch (emailError) {
        console.error('Error sending contract email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      contract: updatedContract,
      message: 'Contract counter-signed successfully'
    });
  } catch (error) {
    console.error('Error in counter-sign API:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

