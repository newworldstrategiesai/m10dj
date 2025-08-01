import { Resend } from 'resend';
import { db } from '../../utils/company_lib/supabase';
import { sendAdminSMS, formatContactSubmissionSMS } from '../../utils/sms-helper.js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Initialize Resend with API key from environment variable
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, phone, eventType, eventDate, location, message } = req.body;

  // Basic validation
  if (!name || !email || !eventType) {
    return res.status(400).json({ message: 'Name, email, and event type are required' });
  }

  try {
    // Save to database first
    const submissionData = {
      name,
      email,
      phone,
      eventType,
      eventDate,
      location,
      message
    };

    const dbSubmission = await db.createContactSubmission(submissionData);
    console.log('Contact submission saved to database:', dbSubmission.id);

    // Create a contact record in the new contacts system
    try {
      // Create service role client for inserting contacts
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Extract first and last name from the full name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Map event types to standardized values
      const eventTypeMapping = {
        'Wedding': 'wedding',
        'Corporate Event': 'corporate',
        'School Dance': 'school_dance',
        'Holiday Party': 'holiday_party',
        'Private Party': 'private_party'
      };
      
      const standardizedEventType = eventTypeMapping[eventType] || 'other';
      
      // Parse event date if provided
      let parsedEventDate = null;
      if (eventDate) {
        const dateObj = new Date(eventDate);
        if (!isNaN(dateObj.getTime())) {
          parsedEventDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }
      
      // Get the admin/owner user ID from environment variable
      // You need to set DEFAULT_ADMIN_USER_ID in your environment variables
      const adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
      
      if (!adminUserId) {
        console.error('DEFAULT_ADMIN_USER_ID environment variable not set');
        console.log('Please set DEFAULT_ADMIN_USER_ID to your admin user ID in .env.local');
        // For now, we'll continue without creating a contact record
        throw new Error('Admin user ID not configured - contact will not be saved to contacts table');
      }

      // Create contact record
      const contactData = {
        user_id: adminUserId, // Assign to admin user
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        phone: phone || null,
        event_type: standardizedEventType,
        event_date: parsedEventDate,
        venue_name: location || null,
        special_requests: message || null,
        lead_status: 'New',
        lead_source: 'Website',
        lead_stage: 'Initial Inquiry',
        lead_temperature: 'Warm',
        communication_preference: 'email',
        initial_contact_channel: 'contact_form',
        how_heard_about_us: 'Website Contact Form',
        notes: `Initial inquiry submitted via website contact form on ${new Date().toLocaleDateString()}`,
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'form_submission',
        opt_in_status: true, // Assume opt-in from contact form
        lead_score: 50, // Default score for website inquiries
        priority_level: 'Medium'
      };
      
      // Check if contact already exists (by email or phone) for this user
      let existingContact = null;
      if (email) {
        const { data: emailMatch } = await supabase
          .from('contacts')
          .select('*')
          .eq('email_address', email)
          .eq('user_id', adminUserId)
          .is('deleted_at', null)
          .single();
        existingContact = emailMatch;
      }
      
      if (!existingContact && phone) {
        const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
        const { data: phoneMatch } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', adminUserId)
          .ilike('phone', `%${cleanPhone}%`)
          .is('deleted_at', null)
          .single();
        existingContact = phoneMatch;
      }
      
      if (existingContact) {
        // Update existing contact with new information
        const updateData = {
          ...contactData,
          messages_received_count: (existingContact.messages_received_count || 0) + 1,
          last_contacted_date: new Date().toISOString(),
          notes: `${existingContact.notes || ''}\n\nNew inquiry ${new Date().toLocaleDateString()}: ${message || 'No message provided'}`
        };
        
        const { data: updatedContact, error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', existingContact.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating existing contact:', updateError);
        } else {
          console.log('Updated existing contact:', updatedContact.id);
        }
      } else {
        // Create new contact
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert([contactData])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating new contact:', createError);
        } else {
          console.log('Created new contact:', newContact.id);
        }
      }
    } catch (contactError) {
      console.error('Error managing contact record (non-critical):', contactError);
      // Don't fail the entire request if contact creation fails
    }

    // Only send emails if Resend API key is configured
    if (resend && process.env.RESEND_API_KEY) {
      // Format the customer email content
      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">Thank You for Contacting M10 DJ Company!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 18px; margin-bottom: 20px;">
              Hi ${name},
            </p>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Thank you for reaching out to M10 DJ Company! We've received your inquiry for your ${eventType.toLowerCase()} and are excited to help make your event unforgettable.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Your Event Details:</h3>
              <p style="margin: 5px 0;"><strong>Event Type:</strong> ${eventType}</p>
              ${eventDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>` : ''}
              ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
            </div>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              We'll review your request and get back to you within 24 hours with:
            </p>
            
            <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
              <li>A personalized quote for your event</li>
              <li>Package options tailored to your needs</li>
              <li>Availability confirmation for your date</li>
              <li>Next steps to secure your booking</li>
            </ul>
            
            <p style="color: #333; line-height: 1.6; margin: 30px 0 20px 0;">
              In the meantime, feel free to check out our recent work and client testimonials on our website, or reach out directly if you have any immediate questions.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; margin: 5px 0;">Call us directly: <strong style="color: #fcba00;">(901) 410-2020</strong></p>
              <p style="color: #666; margin: 5px 0;">Email: <strong style="color: #fcba00;">info@m10djcompany.com</strong></p>
            </div>
            
            <p style="color: #333; line-height: 1.6; text-align: center; margin-top: 30px;">
              Thank you for considering M10 DJ Company for your special event!
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                M10 DJ Company - Premium Event Entertainment<br>
                Memphis, Tennessee
              </p>
            </div>
          </div>
        </div>
      `;

      // Format the admin notification email
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: #fcba00;">New Contact Form Submission</h2>
            <p style="margin: 5px 0 0 0; color: #ccc;">M10 DJ Company Admin</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Client Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
            
            <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Event Details</h3>
            <p><strong>Event Type:</strong> ${eventType}</p>
            ${eventDate ? `<p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>` : ''}
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            
            ${message ? `
              <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #fcba00; padding-bottom: 10px;">Message</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #fcba00;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background: #fcba00; border-radius: 6px; text-align: center;">
              <p style="margin: 0; color: #000; font-weight: bold;">
                Database ID: ${dbSubmission.id}
              </p>
              <p style="margin: 5px 0 15px 0; color: #000; font-size: 14px;">
                Submitted: ${new Date().toLocaleString()}
              </p>
              
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/contacts/${dbSubmission.id}" 
                 style="display: inline-block; background: #000; color: #fcba00; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0;">
                📋 View Lead Details
              </a>
              
              <p style="margin: 10px 0 0 0; color: #000; font-size: 12px;">
                Click above to view full details, add notes, and manage this lead.<br>
                (If not logged in, you'll be redirected to sign in first)
              </p>
            </div>
          </div>
        </div>
      `;

      try {
        // Send customer confirmation email
        await resend.emails.send({
          from: 'M10 DJ Company <onboarding@resend.dev>', // Using Resend's verified domain
          to: [email],
          subject: `Thank you for contacting M10 DJ Company - ${eventType} Inquiry`,
          html: customerEmailHtml,
        });

        // Send admin notification email
        await resend.emails.send({
          from: 'M10 DJ Company <onboarding@resend.dev>', // Using Resend's verified domain
          to: ['m10djcompany@gmail.com'], // Your actual email
          subject: `New ${eventType} Inquiry from ${name}`,
          html: adminEmailHtml,
        });

        console.log('Emails sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the entire request if email fails
      }
    } else {
      console.log('Resend API key not configured - skipping email sending');
    }

    // Send SMS notification to admin
    try {
      const smsMessage = formatContactSubmissionSMS(submissionData);
      const smsResult = await sendAdminSMS(smsMessage);
      
      if (smsResult.success) {
        console.log('Admin SMS notification sent successfully:', smsResult.smsId);
      } else {
        console.log('Admin SMS notification failed:', smsResult.error);
      }
    } catch (smsError) {
      console.error('SMS notification error:', smsError);
      // Don't fail the entire request if SMS fails
    }

    res.status(200).json({ 
      message: 'Thank you for your message! We\'ll get back to you soon.',
      submissionId: dbSubmission.id 
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again or call us directly.' });
  }
} 