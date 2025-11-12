import { Resend } from 'resend';
import { db } from '../../utils/company_lib/supabase';
import { sendAdminSMS, formatContactSubmissionSMS } from '../../utils/sms-helper.js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { sendServiceSelectionToLead } from '../../utils/service-selection-helper.js';
import { createRateLimitMiddleware, getClientIp } from '../../utils/rate-limiter';
import { sanitizeContactFormData, hasSuspiciousPatterns } from '../../utils/input-sanitizer';
import { serverIdempotency } from '../../utils/idempotency';
import { validateContactForm } from '../../utils/form-validator';

// Initialize Resend with API key from environment variable
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create rate limiter: 5 requests per 15 minutes per IP
const rateLimiter = createRateLimitMiddleware({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => getClientIp(req)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitResult = await rateLimiter(req, res);
  if (res.headersSent) {
    // Rate limit exceeded, response already sent
    return;
  }

  const { name, email, phone, eventType, eventDate, location, message, honeypot, idempotencyKey } = req.body;

  // SECURITY: Honeypot check - if filled, it's likely a bot
  if (honeypot && honeypot.trim().length > 0) {
    console.log('🤖 Bot detected via honeypot field from IP:', getClientIp(req));
    // Return success to the bot so they don't know they were caught
    return res.status(200).json({ 
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      _botDetected: true
    });
  }

  // SECURITY: Idempotency check
  if (idempotencyKey) {
    if (serverIdempotency.isProcessed(idempotencyKey)) {
      const previousResult = serverIdempotency.getResult(idempotencyKey);
      console.log('⚠️ Duplicate submission detected:', idempotencyKey);
      
      if (previousResult && !previousResult.pending) {
        return res.status(200).json({
          ...previousResult,
          _duplicate: true,
          message: 'We already received your submission. Thank you!'
        });
      }
      
      return res.status(409).json({
        success: false,
        message: 'Your submission is already being processed. Please wait.',
        _duplicate: true
      });
    }
    
    // Mark as being processed
    serverIdempotency.markProcessed(idempotencyKey, { pending: true });
  }

  // SECURITY: Input sanitization
  const sanitizedData = sanitizeContactFormData({
    name,
    email,
    phone,
    eventType,
    eventDate,
    location,
    message
  });

  // SECURITY: Check for suspicious patterns
  const fieldsToCheck = [sanitizedData.name, sanitizedData.email, sanitizedData.message];
  const hasSuspicious = fieldsToCheck.some(field => field && hasSuspiciousPatterns(field));
  
  if (hasSuspicious) {
    console.log('⚠️ Suspicious patterns detected in submission from IP:', getClientIp(req));
    // Log but don't reject - could be false positive
    // In production, you might want to flag this for manual review
  }

  // Enhanced validation
  const validation = validateContactForm(sanitizedData);
  if (!validation.valid) {
    const errorMessages = Object.values(validation.errors);
    return res.status(400).json({ 
      success: false,
      message: errorMessages.join('. '),
      errors: validation.errors
    });
  }

  // Initialize tracking flags for critical operations
  let criticalOperations = {
    dbSubmission: { success: false, id: null },
    contactRecord: { success: false, id: null },
    projectRecord: { success: false, id: null }
  };

  try {
    console.log('🚀 Processing contact form submission...');
    console.log('Data received:', { 
      name: sanitizedData.name, 
      email: sanitizedData.email, 
      phone: sanitizedData.phone, 
      eventType: sanitizedData.eventType, 
      eventDate: sanitizedData.eventDate, 
      location: sanitizedData.location, 
      hasMessage: !!sanitizedData.message,
      ip: getClientIp(req),
      idempotencyKey: idempotencyKey ? '***' : 'none'
    });
    
    // Map event types to standardized values (do this early so it's available throughout)
    const eventTypeMapping = {
      'Wedding': 'wedding',
      'Corporate Event': 'corporate',
      'School Dance': 'school_dance',
      'Holiday Party': 'holiday_party',
      'Private Party': 'private_party'
    };
    
    const standardizedEventType = eventTypeMapping[sanitizedData.eventType] || 'other';
    
    // Save to database first - THIS IS CRITICAL
    // Use sanitized data
    const submissionData = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      eventType: sanitizedData.eventType,
      eventDate: sanitizedData.eventDate,
      location: sanitizedData.location,
      message: sanitizedData.message
    };

    let dbSubmission;
    try {
      dbSubmission = await db.createContactSubmission(submissionData);
      criticalOperations.dbSubmission.success = true;
      criticalOperations.dbSubmission.id = dbSubmission.id;
      console.log('✅ Contact submission saved to database:', dbSubmission.id);
    } catch (dbError) {
      console.error('❌ CRITICAL: Failed to save submission to database:', dbError);
      throw new Error('Failed to save your submission. Please try again.');
    }

    // Create a contact record in the new contacts system - THIS IS CRITICAL
    console.log('📝 Creating contact record in CRM...');
    
    // Create service role client for inserting contacts
    const { createClient } = require('@supabase/supabase-js');
    
    // Validate Supabase credentials before proceeding
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ CRITICAL: Missing Supabase credentials');
      throw new Error('Server configuration error. Please contact support.');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Extract first and last name from the full name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Parse event date if provided
    let parsedEventDate = null;
    if (eventDate) {
      try {
        const dateObj = new Date(eventDate);
        if (!isNaN(dateObj.getTime())) {
          parsedEventDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      } catch (dateError) {
        console.warn('Could not parse event date:', eventDate);
      }
    }
    
    // Get the admin/owner user ID with robust error handling
    let adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
    console.log('Admin user ID from env:', adminUserId || 'not set');
    
    // If not set in environment, find the admin user by email from auth.users
    if (!adminUserId) {
      console.log('Attempting to find admin user from auth system...');
      try {
        // Use service role client to query auth.users directly
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
        } else if (authUsers?.users) {
          const adminEmails = [
            'djbenmurray@gmail.com',  // Ben Murray - Owner (try this first)
            'admin@m10djcompany.com',
            'manager@m10djcompany.com'
          ];
          
          console.log(`Searching for admin in ${authUsers.users.length} users...`);
          
          // Find the first admin user
          const adminUser = authUsers.users.find(user => 
            adminEmails.includes(user.email || '')
          );
          
          if (adminUser) {
            adminUserId = adminUser.id;
            console.log(`✅ Found admin user ${adminUser.email} with ID: ${adminUserId}`);
          } else {
            console.warn('⚠️ No admin user found with emails:', adminEmails);
            console.warn('Available users:', authUsers.users.map(u => u.email).join(', '));
          }
        }
      } catch (err) {
        console.error('Error getting admin user:', err);
      }
    }
    
    // IMPORTANT: Continue even without admin user ID
    if (!adminUserId) {
      console.warn('⚠️ WARNING: No admin user ID found, contact will be created without user assignment');
      console.warn('   This is OK - the contact will still be saved!');
      console.warn('   Set DEFAULT_ADMIN_USER_ID in your environment to fix this');
    } else {
      console.log('✅ Using admin user ID:', adminUserId);
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
    try {
      if (email) {
        const { data: emailMatch, error: emailError } = await supabase
          .from('contacts')
          .select('*')
          .eq('email_address', email)
          .is('deleted_at', null)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle no results
          
        if (emailError && emailError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine
          console.warn('Error checking for existing email:', emailError);
        } else {
          existingContact = emailMatch;
        }
      }
      
      if (!existingContact && phone) {
        const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.length >= 10) { // Only search if phone is valid
          const { data: phoneMatch, error: phoneError } = await supabase
            .from('contacts')
            .select('*')
            .ilike('phone', `%${cleanPhone}%`)
            .is('deleted_at', null)
            .maybeSingle();
            
          if (phoneError && phoneError.code !== 'PGRST116') {
            console.warn('Error checking for existing phone:', phoneError);
          } else {
            existingContact = phoneMatch;
          }
        }
      }
    } catch (lookupError) {
      console.warn('Error during contact lookup (continuing):', lookupError);
    }
    
    try {
      if (existingContact) {
        // Update existing contact with new information
        console.log('Found existing contact:', existingContact.id);
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
          console.error('❌ CRITICAL: Error updating existing contact:', updateError);
          throw new Error(`Failed to update contact: ${updateError.message}`);
        }
        
        console.log('✅ Updated existing contact:', updatedContact.id);
        criticalOperations.contactRecord.success = true;
        criticalOperations.contactRecord.id = updatedContact.id;
        
        // Create project for the existing contact (new inquiry)
        try {
          console.log('Creating project for existing contact...');
          const project = await db.createProject(contactData, dbSubmission.id);
          console.log('✅ Project created successfully:', project.id);
          criticalOperations.projectRecord.success = true;
          criticalOperations.projectRecord.id = project.id;
        } catch (projectError) {
          console.error('⚠️ Project creation failed (non-critical):', projectError);
          // Don't fail the entire request if project creation fails
        }
      } else {
        // Create new contact
        console.log('Creating new contact...');
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert([contactData])
          .select()
          .single();
          
        if (createError) {
          console.error('❌ CRITICAL: Error creating new contact:', createError);
          console.error('Contact data that failed:', { ...contactData, special_requests: '[redacted]' });
          throw new Error(`Failed to create contact: ${createError.message}`);
        }
        
        console.log('✅ Created new contact:', newContact.id);
        criticalOperations.contactRecord.success = true;
        criticalOperations.contactRecord.id = newContact.id;
        
        // Create project for the new contact
        try {
          console.log('Creating project for new contact...');
          const project = await db.createProject(contactData, dbSubmission.id);
          console.log('✅ Project created successfully:', project.id);
          criticalOperations.projectRecord.success = true;
          criticalOperations.projectRecord.id = project.id;
        } catch (projectError) {
          console.error('⚠️ Project creation failed (non-critical):', projectError);
          // Don't fail the entire request if project creation fails
        }
      }
    } catch (contactError) {
      console.error('❌ CRITICAL ERROR: Failed to manage contact record:', contactError);
      console.error('❌ THIS IS A CRITICAL FAILURE - CONTACT NOT SAVED TO CRM!');
      console.error('Submission was saved to database (ID: ' + dbSubmission.id + ') but contact record failed');
      
      // This is critical - we should fail the request so it can be retried
      throw new Error('Failed to save contact information. Please try again.');
    }

    // Auto-send service selection link for wedding leads
    if (standardizedEventType === 'wedding' || standardizedEventType === 'Wedding') {
      console.log('🎯 Detected wedding inquiry - preparing to send service selection link...');
      
      try {
        // Re-fetch the contact to get the complete record with ID
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: contact, error: fetchError } = await supabase
          .from('contacts')
          .select('*')
          .eq('email_address', email)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError || !contact) {
          console.error('Could not fetch contact for service selection:', fetchError);
        } else {
          const serviceSelectionResult = await sendServiceSelectionToLead(contact, supabase);
          
          if (serviceSelectionResult.success) {
            console.log(`✅ Service selection link sent to ${email}`);
            console.log(`   Link: ${serviceSelectionResult.link}`);
            if (serviceSelectionResult.emailSent) {
              console.log('   ✅ Email delivered successfully');
            } else {
              console.log('   ⚠️ Email failed:', serviceSelectionResult.emailError);
            }
          } else {
            console.log('❌ Failed to send service selection:', serviceSelectionResult.error);
          }
        }
      } catch (serviceSelectionError) {
        console.error('Error sending service selection:', serviceSelectionError);
        // Don't fail the entire request if service selection fails
      }
    } else {
      console.log(`ℹ️ Event type "${standardizedEventType}" - skipping service selection (only sent for weddings)`);
    }

    // Only send emails if Resend API key is configured
    if (resend && process.env.RESEND_API_KEY) {
      // Format the customer email content
      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="https://m10djcompany.com/M10-Gold-Logo.png" alt="M10 DJ Company Logo" style="max-width: 120px; height: auto; margin-bottom: 15px;">
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
          <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <img src="https://m10djcompany.com/M10-Gold-Logo.png" alt="M10 DJ Company Logo" style="max-width: 100px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
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
          from: 'M10 DJ Company <hello@m10djcompany.com>', // Using verified custom domain
          to: [email],
          subject: `Thank you for contacting M10 DJ Company - ${eventType} Inquiry`,
          html: customerEmailHtml,
        });

        // Send admin notification email to multiple addresses for redundancy
        const adminEmails = [
          'djbenmurray@gmail.com', // Primary
          'm10djcompany@gmail.com', // Backup 1
          process.env.BACKUP_ADMIN_EMAIL, // Backup 2 (from env)
          process.env.EMERGENCY_CONTACT_EMAIL // Backup 3 (from env)
        ].filter(email => email && email.trim()); // Remove empty values
        
        await resend.emails.send({
          from: 'M10 DJ Company <hello@m10djcompany.com>', // Using verified custom domain
          to: adminEmails,
          subject: `🎉 New ${eventType} Inquiry from ${name}`,
          html: adminEmailHtml,
        });
        
        console.log(`✅ Admin notification sent to ${adminEmails.length} email address(es):`, adminEmails.join(', '));

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

    // Log success with operation summary
    console.log('✅ Contact form submission completed successfully!');
    console.log('Operation summary:', {
      dbSubmission: criticalOperations.dbSubmission.success ? '✅' : '❌',
      contactRecord: criticalOperations.contactRecord.success ? '✅' : '❌',
      projectRecord: criticalOperations.projectRecord.success ? '✅' : '⚠️',
      submissionId: criticalOperations.dbSubmission.id,
      contactId: criticalOperations.contactRecord.id,
      projectId: criticalOperations.projectRecord.id
    });

    const successResponse = { 
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      submissionId: dbSubmission.id,
      contactId: criticalOperations.contactRecord.id
    };

    // Store successful result for idempotency
    if (idempotencyKey) {
      serverIdempotency.markProcessed(idempotencyKey, successResponse);
    }

    res.status(200).json(successResponse);

  } catch (error) {
    console.error('❌ CRITICAL ERROR processing contact form:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      operations: criticalOperations
    });
    
    // Provide specific error messages based on what failed
    let userMessage = 'Something went wrong. ';
    
    if (!criticalOperations.dbSubmission.success) {
      userMessage += 'We couldn\'t save your submission. ';
    } else if (!criticalOperations.contactRecord.success) {
      userMessage += 'We couldn\'t save your contact information. ';
    }
    
    userMessage += 'Please try again or call us directly at (901) 410-2020.';
    
    res.status(500).json({ 
      success: false,
      message: userMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 