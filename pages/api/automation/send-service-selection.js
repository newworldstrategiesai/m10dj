/**
 * Send Service Selection Link
 * Automatically sends service selection link to new lead
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'contactId required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Generate service selection link
    const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/service-selection/generate-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: contact.id,
        expiresInDays: 30
      })
    });

    const linkData = await linkResponse.json();

    if (!linkResponse.ok) {
      throw new Error(linkData.error || 'Failed to generate link');
    }

    const selectionLink = linkData.link;

    // Send email with service selection link
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: contact.email_address || contact.primary_email,
        subject: `🎵 ${contact.first_name}, select your DJ services - M10 DJ Company`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Let's Plan Your Event!</h1>
            </div>
            
            <div style="background: white; padding: 40px 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${contact.first_name}!</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Thank you for your interest in M10 DJ Company! We're excited to learn more about your ${contact.event_type || 'event'}.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                To provide you with an accurate quote, please take 3 minutes to select your services using the link below:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${selectionLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  ✨ Select Your Services
                </a>
              </div>
              
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #333; font-size: 18px;">📋 What You'll Choose:</h3>
                <ul style="margin: 10px 0; padding-left: 20px; color: #555;">
                  <li>DJ package (Basic, Premium, or Platinum)</li>
                  <li>Event timeline (ceremony, cocktail hour, reception)</li>
                  <li>Music preferences and special requests</li>
                  <li>Your budget range</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                <strong>What happens next:</strong>
              </p>
              <ol style="font-size: 16px; line-height: 1.8; color: #555; padding-left: 20px;">
                <li>Complete your service selection (3 minutes)</li>
                <li>We'll review your choices</li>
                <li>Receive your custom quote within 24 hours</li>
              </ol>
              
              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                  <strong>💚 This link is unique to you</strong> and expires in 30 days.
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Questions? Just reply to this email or call us at <a href="tel:+19014102020" style="color: #667eea; text-decoration: none; font-weight: bold;">(901) 410-2020</a>.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555; margin-top: 30px;">
                Looking forward to being part of your special day!
              </p>
              
              <p style="font-size: 16px; color: #333; margin-top: 20px;">
                Best,<br>
                <strong>${process.env.OWNER_NAME || 'M10 DJ Company'}</strong><br>
                <span style="color: #888; font-size: 14px;">(901) 410-2020</span>
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                M10 DJ Company | Memphis, TN<br>
                Professional DJ Services for Weddings & Events
              </p>
            </div>
          </div>
        `,
        contactId: contact.id
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    console.log(`✅ Service selection link sent to ${contact.email_address || contact.primary_email}`);

    // Log the action
    await supabase.from('automation_log').insert({
      automation_type: 'service_selection_sent',
      contact_id: contact.id,
      template_used: 'service_selection_link',
      email_sent: true,
      sent_at: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      contact_id: contact.id,
      selection_link: selectionLink,
      message: 'Service selection link sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending service selection link:', error);
    res.status(500).json({ 
      error: 'Failed to send service selection link',
      message: error.message 
    });
  }
}

