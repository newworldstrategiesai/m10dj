/**
 * Submit Service Selection
 * Processes service selection form submission
 */

const { createClient } = require('@supabase/supabase-js');
const { createRateLimitMiddleware, getClientIp } = require('@/utils/rate-limiter');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Rate limiting: 10 requests per 15 minutes per IP
const rateLimiter = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => getClientIp(req)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await rateLimiter(req, res);
  if (res.headersSent) {
    return; // Rate limit exceeded, response already sent
  }

  const { token, selections } = req.body;

  if (!token || !selections) {
    return res.status(400).json({ error: 'Token and selections required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('service_selection_tokens')
      .select('*, contacts(*)')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Check if already used
    if (tokenData.is_used) {
      return res.status(400).json({ 
        error: 'Selections already submitted',
        already_used: true
      });
    }

    const contact = tokenData.contacts;

    // Get organization_id from contact (required for multi-tenant isolation)
    const contactOrgId = contact.organization_id;
    if (!contactOrgId) {
      console.warn('⚠️ Contact missing organization_id, service selection may not be properly isolated');
    }

    // Create service selection record
    const { data: selection, error: selectionError } = await supabase
      .from('service_selections')
      .insert({
        contact_id: contact.id,
        organization_id: contactOrgId, // Set organization_id for multi-tenant isolation
        token_id: tokenData.id,
        event_type: selections.eventType || contact.event_type,
        event_date: selections.eventDate || contact.event_date,
        event_time: selections.eventTime,
        end_time: selections.endTime,
        venue_name: selections.venueName || contact.venue_name,
        venue_address: selections.venueAddress,
        guest_count: selections.guestCount || contact.guest_count,
        services_selected: selections.services || [],
        add_ons: selections.addOns || [],
        package_selected: selections.package,
        estimated_price: selections.estimatedPrice,
        music_preferences: selections.musicPreferences,
        special_requests: selections.specialRequests,
        budget_range: selections.budgetRange || contact.budget_range,
        ceremony_music: selections.ceremonyMusic || false,
        cocktail_hour: selections.cocktailHour || false,
        reception: selections.reception || true,
        after_party: selections.afterParty || false,
        status: 'submitted'
      })
      .select()
      .single();

    if (selectionError) throw selectionError;

    // Mark token as used
    await supabase
      .from('service_selection_tokens')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    // Update contact
    await supabase
      .from('contacts')
      .update({
        service_selection_completed: true,
        service_selection_completed_at: new Date().toISOString(),
        lead_status: 'Qualified',
        lead_temperature: 'Hot',
        event_type: selections.eventType || contact.event_type,
        event_date: selections.eventDate || contact.event_date,
        venue_name: selections.venueName || contact.venue_name,
        guest_count: selections.guestCount || contact.guest_count,
        budget_range: selections.budgetRange || contact.budget_range,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    console.log(`✅ Service selection submitted for contact ${contact.id}`);

    // Generate invoice
    let invoiceData = null;
    try {
      // Package pricing map
      const packagePrices = {
        'package_1': { name: 'Package 1 - Reception Only', base: 2000 },
        'package_2': { name: 'Package 2 - Reception Only', base: 2500 },
        'package_3': { name: 'Package 3 - Ceremony & Reception', base: 3000 }
      };

      // Add-on pricing map
      const addOnPrices = {
        'additional_hour': { name: 'Additional Hour(s)', price: 300 },
        'additional_speaker': { name: 'Cocktail Hour Audio', price: 250 },
        'dancing_clouds': { name: 'Dancing on the Clouds', price: 500 },
        'cold_spark': { name: 'Cold Spark Fountain Effect', price: 600 },
        'monogram': { name: 'Monogram Projection', price: 350 },
        'uplighting_addon': { name: 'Uplighting Add-on', price: 300 }
      };

      const selectedPackage = packagePrices[selections.package];
      let subtotal = selectedPackage ? selectedPackage.base : 0;
      let lineItems = [];

      // Add package line item
      if (selectedPackage) {
        lineItems.push({
          description: selectedPackage.name,
          quantity: 1,
          unit_price: selectedPackage.base,
          total: selectedPackage.base
        });
      }

      // Add add-on line items
      if (selections.addOns && selections.addOns.length > 0) {
        selections.addOns.forEach(addonId => {
          const addon = addOnPrices[addonId];
          if (addon) {
            lineItems.push({
              description: addon.name,
              quantity: 1,
              unit_price: addon.price,
              total: addon.price
            });
            subtotal += addon.price;
          }
        });
      }

      const tax = 0; // Update if you charge tax
      const total = subtotal + tax;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          contact_id: contact.id,
          organization_id: contactOrgId, // Set organization_id for multi-tenant isolation
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          status: 'draft',
          subtotal: subtotal,
          tax: tax,
          total: total,
          notes: `Service Selection for ${selections.eventType} on ${selections.eventDate}`,
          line_items: lineItems
        })
        .select()
        .single();

      if (!invoiceError && invoice) {
        invoiceData = invoice;
        console.log(`✅ Invoice ${invoice.invoice_number} created`);
      }
    } catch (invoiceError) {
      console.error('Error generating invoice:', invoiceError);
      // Don't fail the request if invoice generation fails
    }

    // Generate contract automatically
    let contractData = null;
    try {
      // Import contract generation function
      const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
      const crypto = require('crypto');
      
      const contractSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Get default template
      const { data: template, error: templateError } = await contractSupabase
        .from('contract_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (!templateError && template && invoiceData && invoiceData.total > 0) {
        // Calculate amounts from invoice
        const totalAmount = invoiceData.total;
        const depositAmount = totalAmount * 0.5;

        // Prepare template variables
        const variables = {
          client_name: `${contact.first_name} ${contact.last_name}`,
          client_first_name: contact.first_name,
          client_last_name: contact.last_name,
          client_email: contact.email_address || contact.primary_email || '',
          client_phone: contact.phone || '',
          event_name: contact.event_name || `${contact.first_name} ${contact.last_name} ${contact.event_type || 'Event'}`,
          event_type: contact.event_type || selections.eventType || 'Event',
          event_date: contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '',
          event_date_short: contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US') : '',
          venue_name: contact.venue_name || selections.venueName || '',
          venue_address: contact.venue_address || selections.venueAddress || '',
          guest_count: contact.guest_count || selections.guestCount || '',
          total_amount: `$${totalAmount.toFixed(2)}`,
          deposit_amount: `$${depositAmount.toFixed(2)}`,
          remaining_balance: `$${(totalAmount - depositAmount).toFixed(2)}`,
          effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          company_name: 'M10 DJ Company',
          company_address: '65 Stewart Rd, Eads, Tennessee 38028',
          company_email: 'm10djcompany@gmail.com',
          company_phone: '(901) 410-2020',
          owner_name: 'Ben Murray'
        };

        // Replace template variables
        let contractHtml = template.template_content;
        Object.keys(variables).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          contractHtml = contractHtml.replace(regex, variables[key]);
        });

        // Generate signing token
        const signingToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Create contract
        const { data: newContract, error: contractError } = await contractSupabase
          .from('contracts')
          .insert({
            contact_id: contact.id,
            organization_id: contactOrgId, // Set organization_id for multi-tenant isolation
            invoice_id: invoiceData?.id || null,
            quote_selection_id: selection.id, // Renamed from service_selection_id
            event_name: variables.event_name,
            event_type: variables.event_type,
            event_date: contact.event_date || selections.eventDate,
            venue_name: variables.venue_name,
            venue_address: variables.venue_address,
            guest_count: contact.guest_count || selections.guestCount,
            total_amount: totalAmount,
            deposit_amount: depositAmount,
            deposit_percentage: 50,
            status: 'draft',
            contract_template: template.name,
            contract_html: contractHtml,
            signing_token: signingToken,
            signing_token_expires_at: expiresAt.toISOString(),
            effective_date: new Date().toISOString()
          })
          .select()
          .single();

        if (!contractError && newContract) {
          contractData = {
            id: newContract.id,
            contract_number: newContract.contract_number,
            signing_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-contract/${signingToken}`,
            expires_at: expiresAt.toISOString()
          };
          console.log(`✅ Contract ${contractData.contract_number} generated`);
        }
      }
    } catch (contractError) {
      console.error('Error generating contract:', contractError);
      // Don't fail the request if contract generation fails
    }

    // Send admin notification
    await supabase.from('notification_log').insert({
      notification_type: 'service_selection_completed',
      recipient: 'admin',
      subject: `🎯 ${contact.first_name} ${contact.last_name} completed service selection!`,
      body: `Package: ${selections.package}\nEvent: ${selections.eventType}\nDate: ${selections.eventDate}\n\nView in admin panel to send quote.`,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    // Build document link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const documentLink = `${siteUrl}/api/documents/${invoiceData?.id || 'documents'}`;

    // Send confirmation email to customer
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="${siteUrl}/M10-Rotating-Logo-200px-Small.gif" alt="M10 DJ Company Animated Logo" style="max-width: 100px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
            <h2 style="color: #000; margin: 0; font-size: 24px;">Your Selections Received! 🎉</h2>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi ${contact.first_name}!
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Thank you for completing your service selection! We've received your choices and are putting together a detailed quote for your ${selections.eventType}.
            </p>

            <div style="background: #f8f9fa; border-left: 4px solid #fcba00; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
              <h3 style="color: #fcba00; margin-top: 0;">📋 Your Documents</h3>
              <p style="margin: 10px 0; color: #555;">Your invoice and service agreement are ready to review:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${documentLink}" style="display: inline-block; background: linear-gradient(135deg, #fcba00, #e6a800); color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  📄 View Invoice & Contract
                </a>
              </div>
              <p style="font-size: 13px; color: #999; margin: 10px 0 0 0;">
                This link includes your invoice with pricing breakdown and your service agreement ready to sign.
              </p>
            </div>

            <div style="background: #fff3cd; border: 2px solid #fcba00; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #856404; margin: 0; font-weight: 600; text-align: center;">
                ⏰ We'll be in touch within 24 hours with any questions and next steps!
              </p>
            </div>

            <h3 style="color: #333; margin: 25px 0 15px 0;">What You Selected:</h3>
            <ul style="color: #555; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li><strong>Package:</strong> ${selections.package}</li>
              <li><strong>Event Type:</strong> ${selections.eventType}</li>
              <li><strong>Event Date:</strong> ${selections.eventDate}</li>
              <li><strong>Guest Count:</strong> ${selections.guestCount || 'TBD'}</li>
            </ul>

            <h3 style="color: #333; margin: 25px 0 15px 0;">Next Steps:</h3>
            <ol style="color: #555; line-height: 1.8; padding-left: 20px; margin: 0;">
              <li>Review your invoice and service agreement using the link above</li>
              <li>Sign your contract electronically</li>
              <li>Submit your deposit to secure your date</li>
              <li>We'll confirm everything and send additional details</li>
            </ol>

            <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 6px; text-align: center;">
              <p style="color: #333; margin: 0 0 10px 0;"><strong>Have Questions?</strong></p>
              <p style="color: #666; margin: 0;">
                📞 Call us: <strong>(901) 410-2020</strong><br>
                📧 Email: <strong>djbenmurray@gmail.com</strong>
              </p>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Thank you for choosing M10 DJ Company!<br>
              We can't wait to be part of your special event.
            </p>
          </div>
        </div>
      `;

      await fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.email_address || contact.primary_email,
          subject: '✅ Your M10 DJ Service Selection Received - Documents Ready!',
          body: emailHtml,
          contactId: contact.id
        })
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send SMS notification if phone number exists
    if (contact.phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const smsMessage = `Hi ${contact.first_name}! We received your service selections for your ${selections.eventType}. 📋 View your invoice & contract: ${documentLink} - M10 DJ Company (901) 410-2020`;
        
        await client.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone
        });
        
        console.log(`✅ SMS sent to ${contact.phone}`);
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    // ============================================
    // SEND ADMIN NOTIFICATIONS
    // ============================================

    // Prepare admin email content
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="${siteUrl}/M10-Rotating-Logo-200px-Small.gif" alt="M10 DJ Company Animated Logo" style="max-width: 100px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
          <h2 style="color: #000; margin: 0; font-size: 24px;">🎯 New Service Selection Received!</h2>
          <p style="color: #000; margin: 5px 0 0 0; font-size: 14px;">Respond quickly to secure this booking</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #fcba00; margin-top: 0;">📊 Lead Details</h3>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #fcba00; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${contact.first_name} ${contact.last_name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${contact.email_address || contact.primary_email}">${contact.email_address || contact.primary_email}</a></p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone || 'Not provided'}</a></p>
          </div>

          <h3 style="color: #fcba00;">🎉 Event Information</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Event Type:</strong> ${selections.eventType}</p>
            <p style="margin: 5px 0;"><strong>Event Date:</strong> ${selections.eventDate}</p>
            <p style="margin: 5px 0;"><strong>Venue:</strong> ${selections.venueName || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Guest Count:</strong> ${selections.guestCount || 'Not specified'}</p>
          </div>

          <h3 style="color: #fcba00;">💰 Service Selection</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Package:</strong> ${selections.package}</p>
            ${selections.addOns && selections.addOns.length > 0 ? `
              <p style="margin: 15px 0 5px 0;"><strong>Add-ons:</strong></p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${selections.addOns.map(addon => `<li>${addon}</li>`).join('')}
              </ul>
            ` : ''}
            ${invoiceData ? `
              <p style="margin: 15px 0 5px 0; border-top: 1px solid #e0e0e0; padding-top: 10px;"><strong>Total:</strong> $${invoiceData.total.toFixed(2)}</p>
            ` : ''}
          </div>

          <h3 style="color: #fcba00;">⏰ Timeline</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            ${selections.ceremonyMusic ? '<p style="margin: 3px 0;">✓ Ceremony Music</p>' : ''}
            ${selections.cocktailHour ? '<p style="margin: 3px 0;">✓ Cocktail Hour</p>' : ''}
            ${selections.reception ? '<p style="margin: 3px 0;">✓ Reception</p>' : ''}
            ${selections.afterParty ? '<p style="margin: 3px 0;">✓ After Party</p>' : ''}
          </div>

          <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">📋 Next Steps</h3>
            <ol style="margin: 10px 0; padding-left: 20px; color: #333;">
              <li>Review the customer's selections and invoice</li>
              <li>Prepare a detailed custom quote</li>
              <li>Review and sign the contract (if generated)</li>
              <li>Send follow-up email with pricing and next steps</li>
              <li>Confirm booking and collect deposit</li>
            </ol>
          </div>

          <div style="background: #fff3cd; border: 2px solid #fcba00; border-radius: 6px; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #856404; font-weight: bold;">
              ⏱️ RESPOND WITHIN 24 HOURS TO SECURE THIS BOOKING
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <a href="${siteUrl}/admin/contacts/${contact.id}" style="display: inline-block; background: #fcba00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
              👁️ View in Admin Panel
            </a>
            <a href="${documentLink}" style="display: inline-block; background: #2196f3; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              📄 View Documents
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    `;

    // Send admin email notification
    try {
      const adminEmails = [
        process.env.ADMIN_EMAIL || 'm10djcompany@gmail.com',
        ...(process.env.BACKUP_ADMIN_EMAIL ? [process.env.BACKUP_ADMIN_EMAIL] : []),
        ...(process.env.EMERGENCY_CONTACT_EMAIL ? [process.env.EMERGENCY_CONTACT_EMAIL] : [])
      ].filter(Boolean);

      await fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmails,
          subject: `🎯 New Service Selection: ${contact.first_name} ${contact.last_name} - ${selections.eventType}`,
          body: adminEmailHtml,
          contactId: contact.id
        })
      });

      console.log(`✅ Admin email sent to ${adminEmails.join(', ')}`);
    } catch (adminEmailError) {
      console.error('Error sending admin email:', adminEmailError);
      // Don't fail the request if admin email fails
    }

    // Send admin SMS notification if configured
    if (process.env.ADMIN_PHONE && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const adminSmsMessage = `🎯 NEW BOOKING LEAD! ${contact.first_name} ${contact.last_name} selected ${selections.eventType} for ${selections.eventDate}. Package: ${selections.package}. Total: $${invoiceData?.total.toFixed(2) || '?'}. Review: ${siteUrl}/admin/contacts/${contact.id}`;
        
        await client.messages.create({
          body: adminSmsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.ADMIN_PHONE
        });
        
        console.log(`✅ Admin SMS sent to ${process.env.ADMIN_PHONE}`);
      } catch (adminSmsError) {
        console.error('Error sending admin SMS:', adminSmsError);
        // Don't fail the request if SMS fails
      }
    }

    const successResponse = {
      success: true,
      selection_id: selection.id,
      invoice: invoiceData,
      contract: contractData,
      selections: {
        package: selections.package,
        addOns: selections.addOns || [],
        eventType: selections.eventType,
        eventDate: selections.eventDate,
        eventTime: selections.eventTime,
        endTime: selections.endTime,
        venueName: selections.venueName,
        guestCount: selections.guestCount,
        timeline: {
          ceremonyMusic: selections.ceremonyMusic,
          cocktailHour: selections.cocktailHour,
          reception: selections.reception,
          afterParty: selections.afterParty
        }
      },
      message: 'Thank you! Your selections have been submitted. We\'ll be in touch within 24 hours with a custom quote.'
    };
    
    console.log('✅ Sending success response:', successResponse);
    res.status(200).json(successResponse);

  } catch (error) {
    console.error('❌ Error submitting service selection:', error);
    const errorMessage = error?.message || 'An unexpected error occurred during submission';
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      message: `Failed to submit your selections: ${errorMessage}. Please try again or contact us at (901) 410-2020.`
    });
  }
}

