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

  const { leadId, packageId, packageName, packagePrice, speakerRental, addons, totalPrice, discountCode, discountAmount, customized, originalPrice, removedFeatures, customizationNote } = req.body;

  if (!leadId || (!packageId && !speakerRental)) {
    return res.status(400).json({ error: 'Lead ID and either package or speaker rental are required' });
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

    // Calculate total price if not provided or if it's 0 (for speaker rental cases)
    let calculatedTotalPrice = Number(totalPrice) || 0;
    
    console.log('💰 Total price calculation:', {
      providedTotalPrice: totalPrice,
      calculatedTotalPrice: calculatedTotalPrice,
      packagePrice: packagePrice,
      speakerRental: speakerRental ? { name: speakerRental.name, price: speakerRental.price } : null,
      addonsCount: (addons || []).length,
      addonsTotal: (addons || []).reduce((sum, addon) => sum + (Number(addon.price) || 0), 0)
    });
    
    if (!calculatedTotalPrice || calculatedTotalPrice === 0) {
      let basePrice = Number(packagePrice) || 0;
      if (speakerRental && speakerRental.price) {
        basePrice = Number(speakerRental.price) || 0;
        console.log('🔊 Using speaker rental price as base:', basePrice);
      }
      const addonsTotal = (addons || []).reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
      calculatedTotalPrice = basePrice + addonsTotal;
      console.log('💰 Calculated total (fallback):', calculatedTotalPrice, 'from base:', basePrice, '+ addons:', addonsTotal);
    }
    
    // Prepare the quote data
    // Note: speaker_rental column doesn't exist in the database schema
    // Speaker rental info is stored via package_name and package_price when selected
    // Database requires package_id to be NOT NULL, so use 'speaker_rental' for speaker rentals
    const quoteData = {
      lead_id: leadId,
      package_id: packageId || (speakerRental ? 'speaker_rental' : null),
      package_name: packageName || (speakerRental ? speakerRental.name : null),
      package_price: packagePrice || (speakerRental ? speakerRental.price : 0),
      addons: addons || [],
      total_price: calculatedTotalPrice,
      discount_code: discountCode || null,
      discount_amount: discountAmount || 0,
      updated_at: new Date().toISOString()
    };
    
    // If speaker rental is selected, store its details in the addons array for reference
    // This allows us to retrieve the full speaker rental object later
    if (speakerRental) {
      quoteData.addons = [
        ...(addons || []),
        {
          id: 'speaker_rental',
          name: speakerRental.name,
          price: speakerRental.price,
          description: `Speaker Rental - ${speakerRental.totalHours || 0} hours`,
          startTime: speakerRental.startTime,
          endTime: speakerRental.endTime,
          totalHours: speakerRental.totalHours,
          additionalHours: speakerRental.additionalHours || 0
        }
      ];
    }
    
    console.log('💾 Saving quote data:', {
      leadId,
      packageName: quoteData.package_name,
      packagePrice: quoteData.package_price,
      speakerRental: speakerRental ? 'present' : 'null',
      addonsCount: (addons || []).length,
      totalPrice: quoteData.total_price
    });

    // Store customization details if admin customized the package
    // Only include these fields if they exist in the schema and are being used
    if (customized && originalPrice !== undefined) {
      // Only set these if the columns exist in the database
      quoteData.original_price = Number(originalPrice) || packagePrice;
      if (removedFeatures && Array.isArray(removedFeatures)) {
        quoteData.removed_features = removedFeatures;
      }
      if (customizationNote) {
        quoteData.customization_note = customizationNote;
      }
    }
    // Don't set customized: false if the column doesn't exist

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
    // Note: speaker_rental is stored in addons array if present, not as a separate column
    console.log('💾 Attempting to save quote to database:', {
      lead_id: quoteData.lead_id,
      package_id: quoteData.package_id,
      package_name: quoteData.package_name,
      package_price: quoteData.package_price,
      total_price: quoteData.total_price,
      addons_count: (quoteData.addons || []).length,
      has_speaker_rental: speakerRental ? 'yes (in addons)' : 'no'
    });
    
    let savedData = null;
    const { data, error } = await supabase
      .from('quote_selections')
      .upsert(quoteData, {
        onConflict: 'lead_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Try to save without the problematic fields
      // Note: speaker_rental column doesn't exist, so it's not included
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('quote_selections')
        .upsert({
          lead_id: quoteData.lead_id,
          package_id: quoteData.package_id,
          package_name: quoteData.package_name,
          package_price: quoteData.package_price,
          addons: quoteData.addons,
          total_price: quoteData.total_price,
          discount_code: quoteData.discount_code,
          discount_amount: quoteData.discount_amount,
          updated_at: quoteData.updated_at
        }, {
          onConflict: 'lead_id'
        })
        .select()
        .single();
      
      if (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
        return res.status(200).json({
          success: true,
          message: 'Quote saved successfully',
          logged: true,
          error: fallbackError.message
        });
      }
      
      console.log('✅ Quote saved with fallback method:', {
        id: fallbackData?.id,
        lead_id: fallbackData?.lead_id,
        total_price: fallbackData?.total_price
      });
      
      // Use fallbackData as savedData
      savedData = fallbackData;
    } else {
      console.log('✅ Quote saved to database successfully:', {
        id: data?.id,
        lead_id: data?.lead_id,
        total_price: data?.total_price,
        package_name: data?.package_name
      });
      savedData = data;
    }

    // Send admin notifications (SMS and email) - non-blocking
    sendAdminNotifications(leadData, quoteData, addons || []).catch(error => {
      console.error('⚠️ Failed to send admin notifications:', error);
      // Don't fail the request if notifications fail
    });
    
    // Record discount code usage if applicable
    if (discountCode && discountAmount > 0) {
      try {
        // Get discount code ID
        const { data: codeData } = await supabase
          .from('discount_codes')
          .select('id')
          .eq('code', discountCode.toUpperCase().trim())
          .single();

        if (codeData) {
          // Record usage
          await supabase
            .from('discount_code_usage')
            .insert({
              discount_code_id: codeData.id,
              lead_id: leadId,
              quote_id: data?.id,
              discount_amount: discountAmount,
              original_amount: totalPrice + discountAmount, // Add back discount to get original
              final_amount: totalPrice
            });

          // Increment usage count
          await supabase.rpc('increment_discount_usage', {
            code_id: codeData.id
          }).catch(async () => {
            // Fallback if RPC doesn't exist - manual update
            const { data: currentCode } = await supabase
              .from('discount_codes')
              .select('usage_count')
              .eq('id', codeData.id)
              .single();
            
            if (currentCode) {
              await supabase
                .from('discount_codes')
                .update({ usage_count: (currentCode.usage_count || 0) + 1 })
                .eq('id', codeData.id);
            }
          });
        }
      } catch (error) {
        console.error('⚠️ Error recording discount code usage:', error);
        // Don't fail the request if usage tracking fails
      }
    }

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

    // Send client notification that quote has been generated/updated
    if (leadData?.id) {
      (async () => {
        try {
          const { notifyQuoteGenerated } = await import('../../../utils/client-notifications');
          await notifyQuoteGenerated(leadData.id, {
            package_name: packageName,
            total_price: totalPrice,
            addons: addons || []
          });
        } catch (err) {
          console.error('Failed to send client quote notification:', err);
        }
      })();
    }

    res.status(200).json({
      success: true,
      message: 'Quote saved successfully',
      data: savedData || data
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
