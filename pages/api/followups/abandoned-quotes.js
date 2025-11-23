import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendAdminSMS } from '../../../utils/sms-helper.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check for abandoned quotes and send follow-up emails
 * This should be called daily via cron job or scheduled task
 * 
 * Follow-up schedule:
 * - Day 3: Gentle reminder
 * - Day 7: Value proposition
 * - Day 14: Final offer
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is an authorized request (e.g., from cron job with secret)
  const authSecret = req.headers['x-cron-secret'] || req.body.secret;
  if (authSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = {
      day3: { found: 0, sent: 0, failed: 0 },
      day7: { found: 0, sent: 0, failed: 0 },
      day14: { found: 0, sent: 0, failed: 0 }
    };

    // Check for quotes created 3 days ago
    const day3Quotes = await findAbandonedQuotes(3, 'day3');
    results.day3.found = day3Quotes.length;
    for (const quote of day3Quotes) {
      try {
        await sendAbandonedQuoteFollowUp(quote, 'day3');
        results.day3.sent++;
      } catch (error) {
        console.error(`Error sending day3 follow-up to ${quote.lead_id}:`, error);
        results.day3.failed++;
      }
    }

    // Check for quotes created 7 days ago
    const day7Quotes = await findAbandonedQuotes(7, 'day7');
    results.day7.found = day7Quotes.length;
    for (const quote of day7Quotes) {
      try {
        await sendAbandonedQuoteFollowUp(quote, 'day7');
        results.day7.sent++;
      } catch (error) {
        console.error(`Error sending day7 follow-up to ${quote.lead_id}:`, error);
        results.day7.failed++;
      }
    }

    // Check for quotes created 14 days ago
    const day14Quotes = await findAbandonedQuotes(14, 'day14');
    results.day14.found = day14Quotes.length;
    for (const quote of day14Quotes) {
      try {
        await sendAbandonedQuoteFollowUp(quote, 'day14');
        results.day14.sent++;
      } catch (error) {
        console.error(`Error sending day14 follow-up to ${quote.lead_id}:`, error);
        results.day14.failed++;
      }
    }

    const totalSent = results.day3.sent + results.day7.sent + results.day14.sent;
    const totalFailed = results.day3.failed + results.day7.failed + results.day14.failed;

    return res.status(200).json({
      message: `Processed abandoned quote follow-ups`,
      results,
      summary: {
        totalFound: results.day3.found + results.day7.found + results.day14.found,
        totalSent,
        totalFailed
      }
    });

  } catch (error) {
    console.error('Error in abandoned quote follow-up check:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

/**
 * Find abandoned quotes created X days ago that haven't received a follow-up
 */
async function findAbandonedQuotes(daysAgo, followUpType) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Find quotes created on the target date that are still pending payment
  const { data: quotes, error } = await supabase
    .from('quote_selections')
    .select(`
      *,
      contacts:lead_id (
        id,
        first_name,
        last_name,
        email_address,
        phone,
        event_type,
        event_date,
        venue_name
      )
    `)
    .gte('created_at', targetDate.toISOString())
    .lt('created_at', nextDay.toISOString())
    .eq('payment_status', 'pending')
    .is('signed_at', null); // Not signed yet

  if (error) {
    console.error('Error fetching abandoned quotes:', error);
    return [];
  }

  if (!quotes || quotes.length === 0) {
    return [];
  }

  // Filter out quotes that have already received this follow-up
  const quotesNeedingFollowUp = [];
  for (const quote of quotes) {
    // Check if follow-up was already sent
    const { data: existingFollowup } = await supabase
      .from('followup_sent')
      .select('id')
      .eq('contact_id', quote.lead_id)
      .eq('followup_type', `abandoned_quote_${followUpType}`)
      .limit(1);

    if (!existingFollowup || existingFollowup.length === 0) {
      quotesNeedingFollowUp.push(quote);
    }
  }

  return quotesNeedingFollowUp;
}

/**
 * Send abandoned quote follow-up email/SMS
 */
async function sendAbandonedQuoteFollowUp(quote, followUpType) {
  const contact = quote.contacts;
  if (!contact) {
    throw new Error('Contact not found for quote');
  }

  const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${quote.lead_id}`;
  const contactName = contact.first_name || contact.name || 'there';
  const eventType = contact.event_type || 'your event';
  const isWedding = eventType && (eventType.toLowerCase().includes('wedding') || eventType.toLowerCase() === 'wedding');
  const packageName = quote.package_name || 'your selected package';
  const totalPrice = quote.total_price ? `$${parseFloat(quote.total_price).toFixed(2)}` : 'your quote';

  let emailSubject, emailHtml, smsMessage;

  if (followUpType === 'day3') {
    // Day 3: Gentle reminder
    emailSubject = isWedding 
      ? `Your Wedding Quote is Ready - Let's Make Your Day Perfect! 💍`
      : `Your Quote is Ready - Questions? I'm Here to Help!`;
    
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0;">${isWedding ? 'Your Wedding Quote is Ready! 💍' : 'Your Quote is Ready!'}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${contactName},</p>
          
          <p>I wanted to check in and make sure you received your personalized quote for ${isWedding ? 'your wedding' : `your ${eventType}`}. I know you're probably busy with ${isWedding ? 'wedding planning' : 'event planning'}, so I wanted to make sure everything is clear!</p>
          
          <p>You selected the <strong>${packageName}</strong> package (${totalPrice}). If you have any questions about the package, add-ons, or anything else, I'm here to help!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteUrl}" 
               style="background: #fcba00; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
              View Your Quote →
            </a>
          </div>
          
          <p>Feel free to reply to this email or call me directly at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a> if you'd like to discuss your ${isWedding ? 'wedding' : 'event'} in more detail.</p>
          
          <p>Looking forward to making your ${isWedding ? 'wedding day' : 'event'} unforgettable!</p>
          
          <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
        </div>
      </div>
    `;

    smsMessage = `Hi ${contactName}! Just checking in - did you receive your quote for ${isWedding ? 'your wedding' : `your ${eventType}`}? View it here: ${quoteUrl} Or call me: (901) 410-2020`;

  } else if (followUpType === 'day7') {
    // Day 7: Value proposition
    emailSubject = isWedding 
      ? `Still Planning? Let's Make Your Wedding Day Perfect Together! 💍`
      : `Still Deciding? Here's Why M10 DJ is Perfect for Your Event`;
    
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0;">${isWedding ? 'Let\'s Make Your Wedding Perfect! 💍' : 'Let\'s Make Your Event Perfect!'}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${contactName},</p>
          
          <p>I know choosing the right ${isWedding ? 'wedding DJ' : 'DJ'} is a big decision, and I wanted to share why so many ${isWedding ? 'couples' : 'clients'} choose M10 DJ Company for their ${isWedding ? 'special day' : 'events'}:</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p style="margin: 0;"><strong>What makes us different:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>15+ years of experience</strong> with 500+ successful ${isWedding ? 'weddings' : 'events'}</li>
              <li><strong>Professional-grade equipment</strong> - crystal-clear sound and elegant uplighting</li>
              <li><strong>Personalized service</strong> - we work with you to create the perfect playlist</li>
              <li><strong>Expert MC services</strong> - seamless timeline coordination</li>
              <li><strong>Deep venue knowledge</strong> - we know Memphis's premier venues inside and out</li>
            </ul>
          </div>
          
          <p>Your quote for the <strong>${packageName}</strong> package (${totalPrice}) is still available. I'd love to answer any questions you might have!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteUrl}" 
               style="background: #fcba00; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
              Review Your Quote →
            </a>
          </div>
          
          <p>Or let's chat! Call me at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a> and I'll help you decide if we're the right fit for your ${isWedding ? 'wedding' : 'event'}.</p>
          
          <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
        </div>
      </div>
    `;

    smsMessage = `Hi ${contactName}! Still deciding on a ${isWedding ? 'wedding DJ' : 'DJ'}? With 15+ years and 500+ ${isWedding ? 'weddings' : 'events'}, we'd love to make your ${isWedding ? 'wedding day' : 'event'} perfect! View quote: ${quoteUrl} Call: (901) 410-2020`;

  } else if (followUpType === 'day14') {
    // Day 14: Final offer
    emailSubject = isWedding 
      ? `Last Chance - Let's Secure Your Wedding Date! 💍`
      : `Final Offer - Let's Make Your Event Happen!`;
    
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0;">${isWedding ? 'Let\'s Secure Your Wedding Date! 💍' : 'Let\'s Make Your Event Happen!'}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${contactName},</p>
          
          <p>I wanted to reach out one more time about your quote for ${isWedding ? 'your wedding' : `your ${eventType}`}. I know ${isWedding ? 'wedding planning' : 'event planning'} involves many decisions, and I want to make sure you have everything you need.</p>
          
          <p>Your quote for the <strong>${packageName}</strong> package (${totalPrice}) is still available. If you're still looking for the perfect ${isWedding ? 'wedding DJ' : 'DJ'}, I'd love to discuss how we can make your ${isWedding ? 'wedding day' : 'event'} absolutely perfect.</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Special Offer:</strong></p>
            <p style="margin: 10px 0 0 0;">If you're ready to book, I'm happy to discuss flexible payment options or answer any last-minute questions you might have. Let's make this happen!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteUrl}" 
               style="background: #fcba00; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px;">
              View Your Quote →
            </a>
          </div>
          
          <p>Call me directly at <a href="tel:+19014102020" style="color: #fcba00; font-weight: bold;">(901) 410-2020</a> and let's chat about your ${isWedding ? 'wedding' : 'event'}. I'm here to help make it perfect!</p>
          
          <p>Best regards,<br>Ben Murray<br>M10 DJ Company<br>(901) 410-2020<br>djbenmurray@gmail.com</p>
        </div>
      </div>
    `;

    smsMessage = `Hi ${contactName}! Final check-in about your ${isWedding ? 'wedding' : 'event'} quote. Ready to book? Let's discuss! View: ${quoteUrl} Call: (901) 410-2020`;
  }

  // Send email
  if (resend && contact.email_address) {
    await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: [contact.email_address],
      subject: emailSubject,
      html: emailHtml
    });
  }

  // Send SMS
  if (contact.phone && smsMessage) {
    await sendAdminSMS(smsMessage, contact.phone).catch(err => {
      console.error('SMS follow-up failed:', err);
    });
  }

  // Mark follow-up as sent
  await supabase.from('followup_sent').insert({
    contact_id: quote.lead_id,
    followup_type: `abandoned_quote_${followUpType}`,
    sent_at: new Date().toISOString(),
    metadata: { 
      quote_id: quote.id,
      package_name: packageName,
      total_price: quote.total_price
    }
  });

  return { emailSent: !!contact?.email_address, smsSent: !!contact?.phone };
}

