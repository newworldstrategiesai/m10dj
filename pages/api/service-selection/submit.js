/**
 * Submit Service Selection
 * Processes service selection form submission
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Create service selection record
    const { data: selection, error: selectionError } = await supabase
      .from('service_selections')
      .insert({
        contact_id: contact.id,
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
        'additional_speaker': { name: 'Additional Speaker', price: 250 },
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
            invoice_id: invoiceData?.id || null,
            service_selection_id: selection.id,
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

    // Send confirmation email to customer
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.email_address || contact.primary_email,
          subject: '✅ Your M10 DJ Service Selection Received!',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${contact.first_name}!</h2>
              
              <p>Great news - we received your service selections! 🎉</p>
              
              <h3>What You Selected:</h3>
              <ul>
                <li><strong>Package:</strong> ${selections.package}</li>
                <li><strong>Event Type:</strong> ${selections.eventType}</li>
                <li><strong>Event Date:</strong> ${selections.eventDate}</li>
                <li><strong>Guest Count:</strong> ${selections.guestCount}</li>
                ${selections.ceremonyMusic ? '<li>✅ Ceremony Music</li>' : ''}
                ${selections.cocktailHour ? '<li>✅ Cocktail Hour</li>' : ''}
                ${selections.reception ? '<li>✅ Reception</li>' : ''}
              </ul>
              
              <h3>What Happens Next:</h3>
              <ol>
                <li>We'll review your selections</li>
                <li>Prepare a custom quote for your event</li>
                <li>Reach out within 24 hours with pricing and next steps</li>
              </ol>
              
              <p>Questions in the meantime? Just reply to this email or call us at (901) 410-2020.</p>
              
              <p>Excited to be part of your special day!</p>
              
              <p>Best,<br>
              ${process.env.OWNER_NAME || 'M10 DJ Company'}<br>
              (901) 410-2020</p>
            </div>
          `,
          contactId: contact.id
        })
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
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

