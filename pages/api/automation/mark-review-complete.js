/**
 * Mark Review as Complete
 * Call this when you see a new review come in
 * Cancels pending reminders and sends thank you
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, reviewUrl } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'contactId required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update contact
    await supabase
      .from('contacts')
      .update({
        review_completed: true,
        review_url: reviewUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    // Cancel any pending review reminders
    const { data: cancelledAutomations } = await supabase
      .from('automation_queue')
      .update({
        status: 'cancelled',
        error_message: 'Review completed'
      })
      .eq('contact_id', contactId)
      .eq('automation_type', 'review_reminder')
      .eq('status', 'pending')
      .select();

    console.log(`✅ Marked review complete for contact ${contactId}`);
    console.log(`   Cancelled ${cancelledAutomations?.length || 0} pending reminders`);

    // Send thank you email for leaving review
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contact && contact.email_address) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.email_address,
          subject: '🙏 Thank you for your amazing review!',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${contact.first_name}!</h2>
              
              <p>I just saw your review and I'm absolutely thrilled! 🎉</p>
              
              <p>Your kind words mean so much to our team and will help other Memphis couples find quality DJ services.</p>
              
              <h3>🎁 Your Thank You Gift</h3>
              <p>As a small token of appreciation, here's a $10 Starbucks gift card:</p>
              
              <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="font-size: 24px; font-weight: bold; margin: 0;">GIFT CARD CODE</p>
                <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">Check your next email for the code!</p>
              </div>
              
              <p>And don't forget - refer a friend and you'll both get $50 off your next event!</p>
              
              <p>Thank you again for being amazing!</p>
              
              <p>Gratefully,<br>
              ${process.env.OWNER_NAME || 'M10 DJ Company'}<br>
              (901) 410-2020</p>
            </div>
          `,
          contactId: contact.id
        })
      });
    }

    // Log completion
    await supabase.from('automation_log').insert({
      automation_type: 'review_completed',
      contact_id: contactId,
      review_completed: true,
      sent_at: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      contact_id: contactId,
      reminders_cancelled: cancelledAutomations?.length || 0
    });

  } catch (error) {
    console.error('❌ Error marking review complete:', error);
    res.status(500).json({ 
      error: 'Failed to mark review complete',
      message: error.message 
    });
  }
}

