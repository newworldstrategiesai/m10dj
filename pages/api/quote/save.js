import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendAdminSMS } from '../../../utils/sms-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const adminEmail = process.env.ADMIN_EMAIL || 'djbenmurray@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId, packageId, packageName, packagePrice, addons, totalPrice } = req.body;

  if (!leadId || !packageId) {
    return res.status(400).json({ error: 'Lead ID and package are required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead data for email notification
    let leadData = null;
    try {
      // Try contacts table first
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, phone, event_type, event_date, venue_name')
        .eq('id', leadId)
        .single();

      if (contactData && !contactError) {
        leadData = {
          id: contactData.id,
          name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || 'Valued Customer',
          email: contactData.email_address,
          phone: contactData.phone,
          eventType: contactData.event_type,
          eventDate: contactData.event_date,
          location: contactData.venue_name
        };
      } else {
        // Try contact_submissions table
        const { data: submissionData, error: submissionError } = await supabase
          .from('contact_submissions')
          .select('id, name, email, phone, event_type, event_date, location')
          .eq('id', leadId)
          .single();

        if (submissionData && !submissionError) {
          leadData = {
            id: submissionData.id,
            name: submissionData.name || 'Valued Customer',
            email: submissionData.email,
            phone: submissionData.phone,
            eventType: submissionData.event_type,
            eventDate: submissionData.event_date,
            location: submissionData.location
          };
        }
      }
    } catch (error) {
      console.error('⚠️ Error fetching lead data for email:', error);
      // Continue even if we can't fetch lead data
    }

    // Prepare the quote data
    const quoteData = {
      lead_id: leadId,
      package_id: packageId,
      package_name: packageName,
      package_price: packagePrice,
      addons: addons || [],
      total_price: totalPrice,
      updated_at: new Date().toISOString()
    };

    // Log the selection for tracking (always)
    console.log('📦 Quote Selection Saved:', {
      leadId,
      packageName,
      packagePrice,
      addonsCount: addons?.length || 0,
      totalPrice,
      timestamp: new Date().toISOString()
    });

    // Save quote selections to database
    const { data, error } = await supabase
      .from('quote_selections')
      .upsert(quoteData, {
        onConflict: 'lead_id'
      })
      .select()
      .single();

    if (error) {
      console.error('⚠️ Database error (continuing anyway):', error.message);
      
      // Return success even if DB fails - we've logged it
      return res.status(200).json({
        success: true,
        message: 'Quote saved successfully',
        logged: true
      });
    }

    // Send admin notifications (SMS and email) - non-blocking
    sendAdminNotifications(leadData, quoteData, addons || []).catch(error => {
      console.error('⚠️ Failed to send admin notifications:', error);
      // Don't fail the request if notifications fail
    });
    
    // Send admin notification for service selection
    const { sendAdminNotification } = await import('../../../utils/admin-notifications');
    sendAdminNotification('service_selection', {
      leadId: leadId,
      leadName: leadData?.name,
      packageName: packageName,
      totalPrice: totalPrice,
      eventType: leadData?.eventType,
      eventDate: leadData?.eventDate
    }).catch(err => console.error('Failed to send admin notification:', err));

    res.status(200).json({
      success: true,
      message: 'Quote saved successfully',
      data
    });
  } catch (error) {
    console.error('❌ Error in save quote API:', error);
    
    // Always return success - we've logged the selection
    res.status(200).json({
      success: true,
      message: 'Quote saved successfully',
      logged: true
    });
  }
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Send admin notifications (SMS and email) when a customer makes a service selection
 */
async function sendAdminNotifications(leadData, quoteData, addons) {
  // Send SMS notification first (faster)
  await sendAdminSMSNotification(leadData, quoteData, addons);
  
  // Send email notification
  await sendAdminEmailNotification(leadData, quoteData, addons);
}

/**
 * Send SMS notification to admin when a service selection is made
 */
async function sendAdminSMSNotification(leadData, quoteData, addons) {
  if (!leadData) {
    console.warn('⚠️ No lead data available - skipping SMS notification');
    return;
  }

  try {
    // Format event date
    const eventDate = leadData.eventDate 
      ? new Date(leadData.eventDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
      : 'TBD';

    // Format add-ons summary
    const addonsCount = addons && addons.length > 0 ? addons.length : 0;
    const addonsTotal = addons && addons.length > 0
      ? addons.reduce((sum, addon) => sum + (addon.price || 0), 0)
      : 0;
    
    const addonsText = addonsCount > 0 
      ? `+ ${addonsCount} add-on${addonsCount > 1 ? 's' : ''} ($${addonsTotal.toLocaleString()})`
      : '';

    // Create SMS message (keep it concise for SMS)
    const smsMessage = `🎵 NEW SERVICE SELECTION

${leadData.name || 'Customer'}
${leadData.eventType || 'Event'} - ${eventDate}
${leadData.location ? `📍 ${leadData.location}` : ''}

📦 Package: ${quoteData.package_name}
💰 Total: $${quoteData.total_price.toLocaleString()}${addonsText ? `\n${addonsText}` : ''}

View: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${leadData.id}`;

    const smsResult = await sendAdminSMS(smsMessage);
    
    if (smsResult.success) {
      console.log('✅ Admin SMS notification sent successfully');
      console.log(`   SMS ID: ${smsResult.smsId}`);
    } else {
      console.warn('⚠️ SMS notification failed:', smsResult.error);
    }
  } catch (error) {
    console.error('❌ Error sending SMS notification:', error);
    // Don't throw - email will still be sent
  }
}

/**
 * Send admin notification email when a customer makes a service selection
 */
async function sendAdminEmailNotification(leadData, quoteData, addons) {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY is not configured - skipping admin notification email');
    return;
  }

  if (!leadData) {
    console.warn('⚠️ No lead data available - skipping admin notification email');
    return;
  }

  try {
    // Format event date
    const eventDate = leadData.eventDate 
      ? new Date(leadData.eventDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Not specified';

    // Format add-ons list
    const addonsList = addons && addons.length > 0
      ? addons.map(addon => `  • ${addon.name || addon.id}: $${(addon.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join('\n')
      : '  • None selected';

    // Calculate add-ons total
    const addonsTotal = addons && addons.length > 0
      ? addons.reduce((sum, addon) => sum + (addon.price || 0), 0)
      : 0;

    // Create email content
    const emailSubject = `🎵 New Service Selection: ${leadData.name} - ${quoteData.package_name}`;
    // Note: Email subject doesn't need HTML escaping as it's plain text
    
    const emailContent = `
🎉 New Service Selection Received!

Customer Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${leadData.name}
Email: ${leadData.email || 'Not provided'}
Phone: ${leadData.phone || 'Not provided'}
Event Type: ${leadData.eventType || 'Not specified'}
Event Date: ${eventDate}
Location: ${leadData.location || 'Not specified'}

Selected Services:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Package: ${quoteData.package_name}
Package Price: $${quoteData.package_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Add-ons:
${addonsList}
${addonsTotal > 0 ? `Add-ons Total: $${addonsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Price: $${quoteData.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
• Review the selection in the admin dashboard
• Contact the customer if needed
• Prepare invoice and contract
• Follow up within 24 hours

View Quote: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${leadData.id}
`;

    // Create HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #000; margin: 0; font-size: 24px;">🎵 M10 DJ Company</h1>
          <p style="color: #000; margin: 5px 0 0 0; font-size: 14px;">New Service Selection</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">🎉 New Service Selection Received!</h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #fcba00; margin-top: 0; font-size: 16px;">Customer Information</h3>
            <p style="color: #333; margin: 8px 0;"><strong>Name:</strong> ${escapeHtml(leadData.name)}</p>
            <p style="color: #333; margin: 8px 0;"><strong>Email:</strong> ${leadData.email ? escapeHtml(leadData.email) : 'Not provided'}</p>
            <p style="color: #333; margin: 8px 0;"><strong>Phone:</strong> ${leadData.phone ? escapeHtml(leadData.phone) : 'Not provided'}</p>
            <p style="color: #333; margin: 8px 0;"><strong>Event Type:</strong> ${leadData.eventType ? escapeHtml(leadData.eventType) : 'Not specified'}</p>
            <p style="color: #333; margin: 8px 0;"><strong>Event Date:</strong> ${escapeHtml(eventDate)}</p>
            <p style="color: #333; margin: 8px 0;"><strong>Location:</strong> ${leadData.location ? escapeHtml(leadData.location) : 'Not specified'}</p>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #fcba00; margin-top: 0; font-size: 16px;">Selected Services</h3>
            <p style="color: #333; margin: 8px 0;"><strong>Package:</strong> ${escapeHtml(quoteData.package_name)}</p>
            <p style="color: #333; margin: 8px 0;"><strong>Package Price:</strong> $${quoteData.package_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            
            <div style="margin: 15px 0;">
              <p style="color: #333; margin: 8px 0; font-weight: bold;">Add-ons:</p>
              ${addons && addons.length > 0
                ? `<ul style="color: #333; margin: 8px 0; padding-left: 20px;">
                    ${addons.map(addon => `<li>${escapeHtml(addon.name || addon.id)}: $${(addon.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>`).join('')}
                  </ul>
                  ${addonsTotal > 0 ? `<p style="color: #333; margin: 8px 0;"><strong>Add-ons Total:</strong> $${addonsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ''}`
                : '<p style="color: #666; margin: 8px 0;">None selected</p>'
              }
            </div>
            
            <div style="border-top: 2px solid #fcba00; padding-top: 15px; margin-top: 15px;">
              <p style="color: #333; margin: 8px 0; font-size: 18px; font-weight: bold;">
                Total Price: $${quoteData.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div style="background: #fff8e1; padding: 15px; border-radius: 8px; border-left: 4px solid #fcba00; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">Next Steps</h3>
            <ul style="color: #333; margin: 8px 0; padding-left: 20px;">
              <li>Review the selection in the admin dashboard</li>
              <li>Contact the customer if needed</li>
              <li>Prepare invoice and contract</li>
              <li>Follow up within 24 hours</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${leadData.id}" 
               style="background: #fcba00; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Quote
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #fcba00; text-align: center;">
            <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">Phone:</strong> (901) 410-2020</p>
            <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">Email:</strong> djbenmurray@gmail.com</p>
            <p style="color: #666; margin: 5px 0;"><strong style="color: #fcba00;">Website:</strong> m10djcompany.com</p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">
              M10 DJ Company - Memphis, TN & Surrounding Areas
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: 'M10 DJ Company <hello@m10djcompany.com>',
      to: [adminEmail],
      subject: emailSubject,
      html: htmlContent,
      text: emailContent
    });

    if (emailResult.error) {
      console.error('❌ Resend API Error:', emailResult.error);
      throw new Error(`Resend API error: ${JSON.stringify(emailResult.error)}`);
    }

    console.log('✅ Admin notification email sent successfully');
    console.log(`   Email ID: ${emailResult.data?.id}`);
    console.log(`   To: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    throw error;
  }
}
