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
      
      // Get the admin/owner user ID 
      let adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
      
      // If not set in environment, find the admin user by email from auth.users
      if (!adminUserId) {
        try {
          // Use service role client to query auth.users directly
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          
          if (!authError && authUsers?.users) {
            const adminEmails = [
              'djbenmurray@gmail.com',  // Ben Murray - Owner (try this first)
              'admin@m10djcompany.com',
              'manager@m10djcompany.com'
            ];
            
            // Find the first admin user
            const adminUser = authUsers.users.find(user => 
              adminEmails.includes(user.email || '')
            );
            
            if (adminUser) {
              adminUserId = adminUser.id;
              console.log(`Found admin user ${adminUser.email} with ID: ${adminUserId}`);
            } else {
              console.error('No admin user found with emails:', adminEmails);
            }
          } else {
            console.error('Error fetching auth users:', authError);
          }
        } catch (err) {
          console.error('Error getting admin user:', err);
        }
      }
      
      // If still no admin user found, use a fallback - we'll create without assignment
      if (!adminUserId) {
        console.warn('No admin user ID found, contact will be created without user assignment');
        console.warn('Set DEFAULT_ADMIN_USER_ID in your environment to fix this');
        adminUserId = null;
      } else {
        console.log('Using admin user ID:', adminUserId);
      }

      // Create contact record
      const contactData = {
        user_id: adminUserId, // May be null if no admin user found
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
        how_heard_about_us: 'Website Contact Form',
        notes: `Initial inquiry submitted via website contact form on ${new Date().toLocaleDateString()}`,
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'form_submission',
        opt_in_status: true, // Assume opt-in from contact form
        lead_score: 50, // Default score for website inquiries
        priority_level: 'Medium'
      };
      
      console.log('Creating contact with data:', {
        ...contactData,
        user_id: adminUserId ? 'assigned' : 'unassigned'
      });
      
      // Check if contact already exists (by email or phone)
      // Don't filter by user_id since contact forms can create unassigned contacts
      let existingContact = null;
      if (email) {
        const { data: emailMatch } = await supabase
          .from('contacts')
          .select('*')
          .eq('email_address', email)
          .is('deleted_at', null)
          .single();
        existingContact = emailMatch;
      }
      
      if (!existingContact && phone) {
        const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
        const { data: phoneMatch } = await supabase
          .from('contacts')
          .select('*')
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
          
          // Create project for the existing contact (new inquiry)
          try {
            console.log('Creating project for existing contact...');
            const project = await db.createProject(contactData, dbSubmission.id);
            console.log('Project created successfully:', project.id);
          } catch (projectError) {
            console.error('Error creating project for existing contact:', projectError);
            console.error('Project creation failed, but contact was updated successfully');
            // Don't fail the entire request if project creation fails
          }
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
          console.error('Contact data that failed:', contactData);
          throw new Error(`Failed to create contact: ${createError.message}`);
        } else {
          console.log('Created new contact:', newContact.id);
          
          // Create project for the new contact
          try {
            console.log('Creating project for new contact...');
            const project = await db.createProject(contactData, dbSubmission.id);
            console.log('Project created successfully:', project.id);
          } catch (projectError) {
            console.error('Error creating project:', projectError);
            console.error('Project creation failed, but contact was created successfully');
            // Don't fail the entire request if project creation fails
          }
        }
      }
    } catch (contactError) {
      console.error('Error managing contact record:', contactError);
      console.error('This means the contact was not saved to the contacts system!');
      // Continue with email sending, but log this as a critical issue
      // You may want to check the database policies and permissions
    }

    // Only send emails if Resend API key is configured
    if (resend && process.env.RESEND_API_KEY) {
      // Format the customer email content
      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">Thank You for Contacting M10 DJ Company!</h1>
            <p style="color: #000; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Premium Event Entertainment</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 18px; margin-bottom: 20px;">
              Hi ${name},
            </p>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Thank you for reaching out to M10 DJ Company! We've received your inquiry for your ${eventType.toLowerCase()} and are excited to help make your event unforgettable.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #fcba00;">
              <h3 style="color: #333; margin-top: 0; color: #fcba00;">Your Event Details:</h3>
              <p style="margin: 5px 0;"><strong>Event Type:</strong> ${eventType}</p>
              ${eventDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>` : ''}
              ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-weight: 600; text-align: center;">
                ⚡ We'll respond within 24 hours with your personalized quote!
              </p>
            </div>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Here's what you can expect from us:
            </p>
            
            <ul style="color: #333; line-height: 1.8; padding-left: 20px;">
              <li><strong>Personalized quote</strong> tailored to your specific needs</li>
              <li><strong>Package options</strong> that fit your budget and vision</li>
              <li><strong>Availability confirmation</strong> for your event date</li>
              <li><strong>Next steps</strong> to secure your booking</li>
              <li><strong>Free consultation</strong> to discuss your music preferences</li>
            </ul>
            
            <p style="color: #333; line-height: 1.6; margin: 30px 0 20px 0;">
              In the meantime, feel free to check out our recent work and client testimonials on our website, or reach out directly if you have any immediate questions.
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Ready to talk now?</h3>
              <p style="color: #666; margin: 5px 0; font-size: 18px;">Call us directly: <strong style="color: #fcba00; font-size: 20px;">(901) 497-7001</strong></p>
              <p style="color: #666; margin: 5px 0;">Email: <strong style="color: #fcba00;">djbenmurray@gmail.com</strong></p>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Available 7 days a week for urgent inquiries</p>
            </div>
            
            <p style="color: #333; line-height: 1.6; text-align: center; margin-top: 30px; font-style: italic;">
              Thank you for considering M10 DJ Company for your special event!<br>
              We can't wait to help make your celebration unforgettable.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                M10 DJ Company - Premium Event Entertainment<br>
                Memphis, Tennessee & Surrounding Areas
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
            ${eventDate ? `<p><strong>Event Date:</strong> ${eventDate}</p>` : ''}
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
          to: ['djbenmurray@gmail.com'], // Your actual email
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

    // Send SMS notification - DIRECT & RELIABLE APPROACH (like August 3rd)
    try {
      console.log('📱 Sending SMS notification for contact form submission...');
      
      // Format the SMS message
      const smsMessage = formatContactSubmissionSMS(submissionData);
      console.log('SMS Message formatted:', smsMessage);
      
      // Try direct SMS first (most reliable)
      try {
        const adminPhone = process.env.ADMIN_PHONE_NUMBER;
        
        if (!adminPhone) {
          throw new Error('No ADMIN_PHONE_NUMBER environment variable set');
        }
        
        // Use Twilio directly (bypass complex helper functions)
        const twilio = require('twilio');
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const smsResult = await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: adminPhone
        });
        
        console.log('✅ Contact form SMS sent successfully:', smsResult.sid);
        console.log(`✅ SMS notification sent for ${eventType} inquiry from ${name}`);
        
      } catch (directError) {
        console.error('❌ Direct SMS failed, trying helper function:', directError);
        
        // Fallback to helper function
        const fallbackResult = await sendAdminSMS(smsMessage);
        console.log('📱 Helper function SMS result:', fallbackResult);
        
        if (fallbackResult.success) {
          console.log('✅ Fallback SMS notification succeeded!');
        } else {
          console.error('❌ Fallback SMS also failed:', fallbackResult.error);
        }
      }
      
    } catch (smsError) {
      console.error('❌ SMS notification failed:', smsError);
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