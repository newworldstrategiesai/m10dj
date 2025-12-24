import { Resend } from 'resend';
import { db } from '../../utils/company_lib/supabase';
import { sendAdminSMS, formatContactSubmissionSMS } from '../../utils/sms-helper.js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { sendServiceSelectionToLead } from '../../utils/service-selection-helper.js';
import { createRateLimitMiddleware, getClientIp } from '../../utils/rate-limiter';
import { sanitizeContactFormData, hasSuspiciousPatterns } from '../../utils/input-sanitizer';
import { serverIdempotency } from '../../utils/idempotency';
import { validateContactForm } from '../../utils/form-validator';
import { autoCreateQuoteInvoiceContract } from '../../utils/auto-create-quote-invoice-contract';

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

  const { name, email, phone, eventType, eventDate, eventTime, venueName, venueAddress, location, message, honeypot, idempotencyKey } = req.body;

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

  // Build location from venueName/venueAddress if provided, otherwise use location field (backward compatibility)
  const finalLocation = (venueName && venueAddress) 
    ? `${venueName}, ${venueAddress}` 
    : (venueName || venueAddress || location);
  
  // SECURITY: Input sanitization
  const sanitizedData = sanitizeContactFormData({
    name,
    email,
    phone,
    eventType,
    eventDate,
    location: finalLocation,
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
    
    // Create service role client for checking/updating drafts
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

    // Determine organization_id EARLY (before creating submissions/contacts)
    // Priority: 1. Explicit organizationId/slug param, 2. Referrer URL slug, 3. Origin URL slug, 4. Platform admin's org
    let organizationId = null;
    
    // Helper function to extract slug from URL
    const extractSlugFromUrl = (url) => {
      if (!url) return null;
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        // Check if URL pattern is /{slug}/requests or /{slug}/*
        if (pathParts.length > 0) {
          const potentialSlug = pathParts[0];
          // Validate slug format (alphanumeric and hyphens)
          if (/^[a-z0-9-]+$/.test(potentialSlug) && potentialSlug !== 'api' && potentialSlug !== 'admin') {
            return potentialSlug;
          }
        }
      } catch (err) {
        // Invalid URL, ignore
      }
      return null;
    };
    
    // Check for explicit organization parameter
    const { organizationId: reqOrgId, organizationSlug } = req.body;
    
    if (reqOrgId) {
      organizationId = reqOrgId;
      console.log('✅ Using organization_id from request body:', organizationId);
    } else if (organizationSlug) {
      // Look up organization by slug from request body
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', organizationSlug)
          .single();
        
        if (org) {
          organizationId = org.id;
          console.log('✅ Found organization by slug from request:', organizationSlug, organizationId);
        }
      } catch (err) {
        console.warn('Could not find organization by slug from request:', organizationSlug);
      }
    }
    
    // Check referrer URL for organization slug
    if (!organizationId) {
      const referer = req.headers.referer || req.headers.referrer;
      const refererSlug = extractSlugFromUrl(referer);
      
      if (refererSlug) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', refererSlug)
            .single();
          
          if (org) {
            organizationId = org.id;
            console.log('✅ Found organization from referrer URL:', refererSlug, organizationId);
          }
        } catch (err) {
          console.warn('Could not find organization from referrer slug:', refererSlug);
        }
      }
    }
    
    // Check origin URL for organization slug
    if (!organizationId) {
      const origin = req.headers.origin;
      const originSlug = extractSlugFromUrl(origin);
      
      if (originSlug) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', originSlug)
            .single();
          
          if (org) {
            organizationId = org.id;
            console.log('✅ Found organization from origin URL:', originSlug, organizationId);
          }
        } catch (err) {
          console.warn('Could not find organization from origin slug:', originSlug);
        }
      }
    }
    
    // Save to database first - THIS IS CRITICAL
    // Use sanitized data
    const submissionData = {
      name: sanitizedData.name,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      eventType: sanitizedData.eventType,
      eventDate: sanitizedData.eventDate,
      location: sanitizedData.location,
      message: sanitizedData.message,
      organization_id: organizationId // Include organization_id in submission
    };
    
    // Add venue fields if provided (for future use)
    if (venueName || venueAddress) {
      submissionData.venueName = venueName?.trim() || null;
      submissionData.venueAddress = venueAddress?.trim() || null;
    }

    // Enrich venue information if only address is provided
    let enrichedVenueInfo = null;
    if (sanitizedData.location && !venueName && !venueAddress) {
      // Only address provided - try to enrich with web search
      console.log('🔍 Detected address-only lead, attempting to enrich venue information...');
      try {
        // Import the enrichment utility
        const { enrichVenueFromAddress } = require('../../utils/venue-enrichment');
        enrichedVenueInfo = await enrichVenueFromAddress(sanitizedData.location);
        
        if (enrichedVenueInfo && enrichedVenueInfo.venue_name) {
          console.log('✅ Enriched venue name:', enrichedVenueInfo.venue_name);
          submissionData.venueName = enrichedVenueInfo.venue_name;
          submissionData.venueAddress = enrichedVenueInfo.venue_address || sanitizedData.location;
        } else {
          console.log('ℹ️ No venue name could be extracted from address');
        }
      } catch (error) {
        console.error('❌ Error enriching venue information:', error);
        // Continue without enrichment - don't fail the submission
      }
    }

    // Check if there's an existing draft for this email
    const { data: existingDraft } = await supabase
      .from('contact_submissions')
      .select('id')
      .eq('email', sanitizedData.email)
      .eq('is_draft', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // CRITICAL: Save submission to database with retry logic
    // This is the most important operation - we MUST have a submission ID
    let dbSubmission;
    let submissionRetries = 0;
    const maxSubmissionRetries = 3;
    
    while (submissionRetries < maxSubmissionRetries) {
      try {
        if (existingDraft) {
          // Update existing draft to mark it as complete
          const updateData = {
            name: sanitizedData.name,
            phone: sanitizedData.phone,
            event_type: sanitizedData.eventType,
            event_date: sanitizedData.eventDate,
            event_time: eventTime || null,
            location: sanitizedData.location,
            message: sanitizedData.message,
            venue_name: (enrichedVenueInfo?.venue_name || venueName?.trim() || null),
            venue_address: (enrichedVenueInfo?.venue_address || venueAddress?.trim() || null),
            guests: req.body.guests || null,
            is_draft: false, // Mark as complete
            status: 'new',
            updated_at: new Date().toISOString()
          };
          
          // Update organization_id if we determined it (may not have been set on draft)
          if (organizationId) {
            updateData.organization_id = organizationId;
          }
          
          const { data: updatedSubmission, error: updateError } = await supabase
            .from('contact_submissions')
            .update(updateData)
            .eq('id', existingDraft.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          dbSubmission = updatedSubmission;
          console.log('✅ Updated existing draft to complete submission:', dbSubmission.id);
        } else {
          // Create new submission
          dbSubmission = await db.createContactSubmission(submissionData);
          console.log('✅ Contact submission saved to database:', dbSubmission.id);
        }

        criticalOperations.dbSubmission.success = true;
        criticalOperations.dbSubmission.id = dbSubmission.id;
        break; // Success - exit retry loop
      } catch (dbError) {
        submissionRetries++;
        console.error(`❌ Attempt ${submissionRetries}/${maxSubmissionRetries}: Failed to save submission:`, dbError);
        
        if (submissionRetries >= maxSubmissionRetries) {
          // Last attempt failed - this is truly critical
          console.error('❌ CRITICAL: All retry attempts failed to save submission');
          throw new Error('Failed to save your submission after multiple attempts. Please try again or contact us directly.');
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, submissionRetries - 1), 3000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Create a contact record in the new contacts system - THIS IS CRITICAL
    console.log('📝 Creating contact record in CRM...');
    
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

    // Parse event time if provided
    let parsedEventTime = null;
    if (eventTime) {
      try {
        // Validate time format (HH:MM)
        const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timePattern.test(eventTime)) {
          parsedEventTime = eventTime;
        }
      } catch (timeError) {
        console.warn('Could not parse event time:', eventTime);
      }
    }

    // Get the admin/owner user ID (needed for organization fallback)
    // If no organization found, use platform admin's organization as default
    if (!organizationId) {
      // Get admin user ID first
      let adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
      
      if (!adminUserId) {
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          if (authUsers?.users) {
            const adminEmails = [
              'djbenmurray@gmail.com',
              'admin@m10djcompany.com',
              'manager@m10djcompany.com'
            ];
            const adminUser = authUsers.users.find(user => 
              adminEmails.includes(user.email || '')
            );
            if (adminUser) {
              adminUserId = adminUser.id;
            }
          }
        } catch (err) {
          console.warn('Could not fetch admin user:', err);
        }
      }
      
      if (adminUserId) {
        try {
          const { data: adminOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', adminUserId)
            .single();
          
          if (adminOrg) {
            organizationId = adminOrg.id;
            console.log('✅ Using platform admin organization as default:', organizationId);
          } else {
            console.warn('⚠️ Platform admin has no organization, contact will be created without organization_id');
          }
        } catch (err) {
          console.warn('Could not determine organization, contact will be created without organization_id');
        }
      }
    }
    
    if (!organizationId) {
      console.warn('⚠️ WARNING: No organization_id determined for contact submission');
      console.warn('   This contact will need to be manually assigned to an organization');
    }

    // Create contact record
    const contactData = {
      user_id: adminUserId, // May be null if no admin user found
      organization_id: organizationId, // Set organization for multi-tenant isolation
      first_name: firstName,
      last_name: lastName,
      email_address: email,
      phone: phone || null,
      event_type: standardizedEventType,
      event_date: parsedEventDate,
      event_time: parsedEventTime,
      venue_name: (enrichedVenueInfo?.venue_name || venueName?.trim() || location || null),
      venue_address: (enrichedVenueInfo?.venue_address || venueAddress?.trim() || null),
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
    
    // CRITICAL: Contact creation with retry logic
    // This MUST succeed - we will retry up to 3 times
    try {
      let contactCreated = false;
      let contactRetries = 0;
      const maxContactRetries = 3;
      
      while (!contactCreated && contactRetries < maxContactRetries) {
      contactRetries++;
      
      try {
        if (existingContact) {
          // Update existing contact with new information
          console.log(`📝 Attempt ${contactRetries}/${maxContactRetries}: Updating existing contact:`, existingContact.id);
          const updateData = {
            ...contactData,
            organization_id: organizationId || existingContact.organization_id, // Preserve existing or set new
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
            console.error(`❌ Attempt ${contactRetries}: Error updating contact:`, updateError);
            if (contactRetries >= maxContactRetries) {
              throw new Error(`Failed to update contact after ${maxContactRetries} attempts: ${updateError.message}`);
            }
            // Wait before retry
            const waitTime = Math.min(1000 * Math.pow(2, contactRetries - 1), 3000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          console.log('✅ Updated existing contact:', updatedContact.id);
          criticalOperations.contactRecord.success = true;
          criticalOperations.contactRecord.id = updatedContact.id;
          contactCreated = true;
          
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
          console.log(`📝 Attempt ${contactRetries}/${maxContactRetries}: Creating new contact...`);
          const { data: newContact, error: createError } = await supabase
            .from('contacts')
            .insert([contactData])
            .select()
            .single();
            
          if (createError) {
            console.error(`❌ Attempt ${contactRetries}: Error creating contact:`, createError);
            console.error('Contact data that failed:', { ...contactData, special_requests: '[redacted]' });
            
            // If it's a unique constraint violation, try to find existing contact
            if (createError.code === '23505') {
              console.log('⚠️ Duplicate detected, attempting to find existing contact...');
              const { data: foundContact, error: findError } = await supabase
                .from('contacts')
                .select('id')
                .eq('email_address', email)
                .is('deleted_at', null)
                .maybeSingle();
              
              if (!findError && foundContact) {
                console.log('✅ Found existing contact:', foundContact.id);
                criticalOperations.contactRecord.success = true;
                criticalOperations.contactRecord.id = foundContact.id;
                contactCreated = true;
                break;
              }
            }
            
            if (contactRetries >= maxContactRetries) {
              throw new Error(`Failed to create contact after ${maxContactRetries} attempts: ${createError.message}`);
            }
            
            // Wait before retry
            const waitTime = Math.min(1000 * Math.pow(2, contactRetries - 1), 3000);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          console.log('✅ Created new contact:', newContact.id);
          criticalOperations.contactRecord.success = true;
          criticalOperations.contactRecord.id = newContact.id;
          contactCreated = true;
          
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
        console.error(`❌ Contact operation attempt ${contactRetries} failed:`, contactError);
        if (contactRetries >= maxContactRetries) {
          // This will be caught by outer catch block for recovery
          throw contactError;
        }
      }
    }
    
    // Final verification - ensure contact exists
    if (!criticalOperations.contactRecord.success || !criticalOperations.contactRecord.id) {
      throw new Error('Contact creation verification failed - contact record not properly created');
    }
    
    } catch (contactError) {
      console.error('❌ CRITICAL: Failed to create/update contact record:', contactError);
      console.error('⚠️ Attempting recovery strategies...');
      
      // RECOVERY STRATEGY 1: Try to create contact with minimal required fields
      let recoveryContact = null;
      let recoveryAttempts = 0;
      const maxRecoveryAttempts = 3;
      
      while (recoveryAttempts < maxRecoveryAttempts && !recoveryContact) {
        recoveryAttempts++;
        console.log(`🔄 Recovery attempt ${recoveryAttempts}/${maxRecoveryAttempts}...`);
        
        try {
          // Minimal contact data - only required fields
          const minimalContactData = {
            user_id: adminUserId || null,
            first_name: firstName || 'Unknown',
            last_name: lastName || 'Customer',
            email_address: email,
            phone: phone || null,
            event_type: standardizedEventType || 'other',
            event_date: parsedEventDate,
            venue_name: (enrichedVenueInfo?.venue_name || location || null),
            venue_address: (enrichedVenueInfo?.venue_address || null),
            special_requests: message || null,
            lead_status: 'New',
            lead_source: 'Website',
            lead_stage: 'Initial Inquiry',
            lead_temperature: 'Warm',
            communication_preference: 'email',
            how_heard_about_us: 'Website Contact Form',
            notes: `Initial inquiry submitted via website contact form on ${new Date().toLocaleDateString()}. Recovery attempt ${recoveryAttempts}.`,
            last_contacted_date: new Date().toISOString(),
            last_contact_type: 'form_submission',
            opt_in_status: true,
            lead_score: 50,
            priority_level: 'Medium'
          };
          
          // Try to insert (ignore if duplicate)
          const { data: newContact, error: insertError } = await supabase
            .from('contacts')
            .insert([minimalContactData])
            .select()
            .single();
          
          if (!insertError && newContact) {
            console.log('✅ Recovery successful! Contact created:', newContact.id);
            recoveryContact = newContact;
            criticalOperations.contactRecord.success = true;
            criticalOperations.contactRecord.id = newContact.id;
            break;
          } else if (insertError?.code === '23505') {
            // Unique constraint violation - contact already exists
            console.log('⚠️ Contact already exists, attempting to fetch it...');
            
            // Try to find existing contact by email
            const { data: existingContact, error: fetchError } = await supabase
              .from('contacts')
              .select('id')
              .eq('email_address', email)
              .is('deleted_at', null)
              .maybeSingle();
            
            if (!fetchError && existingContact) {
              console.log('✅ Found existing contact:', existingContact.id);
              recoveryContact = existingContact;
              criticalOperations.contactRecord.success = true;
              criticalOperations.contactRecord.id = existingContact.id;
              break;
            }
          }
          
          if (recoveryAttempts < maxRecoveryAttempts) {
            const waitTime = Math.min(1000 * Math.pow(2, recoveryAttempts - 1), 3000);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } catch (recoveryError) {
          console.error(`❌ Recovery attempt ${recoveryAttempts} failed:`, recoveryError);
          if (recoveryAttempts >= maxRecoveryAttempts) {
            console.error('❌ All recovery attempts failed');
          }
        }
      }
      
      // If recovery failed, this is a critical error
      if (!recoveryContact) {
        console.error('❌ CRITICAL FAILURE: Unable to create contact after all recovery attempts');
        console.error('❌ This should never happen - contact creation is required');
        throw new Error('Failed to create contact record after multiple attempts. Please contact support.');
      }
    }
    
    // VERIFICATION: Ensure contact was actually created
    if (!criticalOperations.contactRecord.success || !criticalOperations.contactRecord.id) {
      console.error('❌ CRITICAL: Contact record verification failed');
      console.error('Contact record state:', criticalOperations.contactRecord);
      
      // Final verification attempt - query by email
      try {
        const { data: verifyContact, error: verifyError } = await supabase
          .from('contacts')
          .select('id')
          .eq('email_address', email)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!verifyError && verifyContact) {
          console.log('✅ Verification successful - found contact:', verifyContact.id);
          criticalOperations.contactRecord.success = true;
          criticalOperations.contactRecord.id = verifyContact.id;
        } else {
          throw new Error('Contact verification failed - contact does not exist in database');
        }
      } catch (verifyError) {
        console.error('❌ Verification failed:', verifyError);
        throw new Error('Failed to verify contact creation. Please contact support.');
      }
    }
    
    console.log('✅ Contact record guaranteed:', criticalOperations.contactRecord.id);

    // Auto-create quote, invoice, and contract for the new contact
    console.log('🎯 Auto-creating quote, invoice, and contract...');
    try {
      // Fetch the complete contact record
      const { data: fullContact, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', criticalOperations.contactRecord.id)
        .is('deleted_at', null)
        .single();

      if (fetchError || !fullContact) {
        console.warn('⚠️ Could not fetch contact for auto-creation, skipping:', fetchError?.message);
      } else {
        const creationResults = await autoCreateQuoteInvoiceContract(fullContact, supabase);
        
        if (creationResults.quote.success || creationResults.invoice.success || creationResults.contract.success) {
          console.log('✅ Auto-creation completed with partial/full success');
          // Store results in critical operations for logging
          criticalOperations.autoCreation = creationResults;
        } else {
          console.warn('⚠️ Auto-creation completed but all records failed to create');
          console.warn('   This is non-critical - records can be created manually later');
        }
      }
    } catch (autoCreationError) {
      console.error('❌ Error during auto-creation (non-critical):', autoCreationError);
      // Don't fail the entire request if auto-creation fails
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

    // Generate service selection link
    let serviceSelectionLink = null;
    try {
      const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/service-selection/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: criticalOperations.contactRecord.id,
          email: email,
          name: name,
          eventType: eventType,
          eventDate: eventDate,
          expiresInDays: 30
        })
      });

      if (linkResponse.ok) {
        const linkData = await linkResponse.json();
        serviceSelectionLink = linkData.link;
        console.log('✅ Service selection link generated:', serviceSelectionLink);
      } else {
        console.warn('⚠️ Failed to generate service selection link, continuing without it');
      }
    } catch (linkError) {
      console.warn('⚠️ Error generating service selection link:', linkError.message);
      // Continue without the link - not critical
    }

    // Only send emails if Resend API key is configured
    if (resend && process.env.RESEND_API_KEY) {
      // Check if this is a wedding submission
      const isWedding = eventType && eventType.toLowerCase().includes('wedding');
      const contactId = criticalOperations.contactRecord?.id;
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
      
      // Build wedding-specific links section
      let weddingLinksSection = '';
      if (isWedding && contactId) {
        const questionnaireLink = `${baseUrl}/quote/${contactId}/questionnaire`;
        const scheduleLink = `${baseUrl}/schedule`;
        
        weddingLinksSection = `
          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px; font-size: 20px;">🎵 Get Started on Your Wedding Planning</h3>
            <p style="color: #1e3a8a; margin-bottom: 20px; line-height: 1.6;">
              Want to get started right away? Here are two ways to move forward:
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; max-width: 400px; margin: 0 auto;">
              <a href="${questionnaireLink}" 
                 style="display: block; background: #fcba00; color: #000; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; text-align: center; transition: background 0.3s;">
                📋 Start Wedding Music Questionnaire
              </a>
              <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.5;">
                Help us understand your music preferences, special songs, and the vibe you're going for. This will help us create the perfect playlist for your big day!
              </p>
              
              <a href="${scheduleLink}" 
                 style="display: block; background: #3b82f6; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; text-align: center; transition: background 0.3s; margin-top: 10px;">
                📅 Schedule a Free Consultation
              </a>
              <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.5;">
                Book a time to discuss your wedding in detail. We'll go over your vision, answer questions, and make sure everything is perfect for your special day.
              </p>
            </div>
          </div>
        `;
      } else if (!isWedding) {
        // For non-wedding events, still offer consultation
        const scheduleLink = `${baseUrl}/schedule`;
        weddingLinksSection = `
          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px; font-size: 20px;">📅 Schedule a Free Consultation</h3>
            <p style="color: #1e3a8a; margin-bottom: 20px; line-height: 1.6;">
              Want to discuss your event in detail? Book a time that works for you:
            </p>
            <a href="${scheduleLink}" 
               style="display: inline-block; background: #3b82f6; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Schedule Your Consultation →
            </a>
          </div>
        `;
      }
      
      // Format the customer email content
      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fcba00, #e6a800); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="https://m10djcompany.com/M10-Rotating-Logo-200px-Small.gif" alt="M10 DJ Company Animated Logo" style="max-width: 120px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
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
            
            ${weddingLinksSection}
            
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
            <img src="https://m10djcompany.com/M10-Rotating-Logo-200px-Small.gif" alt="M10 DJ Company Animated Logo" style="max-width: 100px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
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
        // Send customer confirmation email with tracking
        const customerEmailResult = await resend.emails.send({
          from: 'M10 DJ Company <hello@m10djcompany.com>', // Using verified custom domain
          to: [email],
          subject: `Thank you for contacting M10 DJ Company - ${eventType} Inquiry`,
          html: customerEmailHtml,
          // Enable email open tracking via Resend webhooks
          headers: {
            'X-Entity-Ref-ID': criticalOperations.contactRecord.id || 'unknown'
          }
        });

        // Store email tracking record for sent event
        if (customerEmailResult.data?.id && criticalOperations.contactRecord.id) {
          try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            await supabase.from('email_tracking').insert({
              email_id: customerEmailResult.data.id,
              recipient_email: email,
              sender_email: 'hello@m10djcompany.com',
              subject: `Thank you for contacting M10 DJ Company - ${eventType} Inquiry`,
              event_type: 'sent',
              contact_id: criticalOperations.contactRecord.id,
              metadata: {
                name: name,
                event_type: eventType,
                email_type: 'confirmation'
              },
              created_at: new Date().toISOString()
            });
            
            console.log('✅ Customer confirmation email sent and tracking record created');
            console.log(`   Email ID: ${customerEmailResult.data.id}`);
          } catch (trackingError) {
            console.warn('⚠️ Failed to create email tracking record:', trackingError.message);
            // Don't fail if tracking fails
          }
        }

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

    // CRITICAL: Ensure we ALWAYS have a valid ID for the quote page
    // This is the most important part - we MUST have a quoteId
    // Prefer contactId (from contacts table), fallback to submissionId (from contact_submissions table)
    const quoteId = criticalOperations.contactRecord.id || criticalOperations.dbSubmission.id;
    
    // This should NEVER happen since dbSubmission.id is set before this point
    // But add extra safety check with retry logic
    if (!quoteId) {
      console.error('❌ CRITICAL: No valid ID available for quote page!');
      console.error('Critical operations state:', criticalOperations);
      console.error('Attempting to re-fetch submission ID...');
      
      // Last resort: try to get the submission ID from the database
      try {
        const { data: lastSubmission, error: fetchError } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!fetchError && lastSubmission?.id) {
          console.log('✅ Recovered submission ID:', lastSubmission.id);
          criticalOperations.dbSubmission.id = lastSubmission.id;
          const recoveredQuoteId = criticalOperations.contactRecord.id || lastSubmission.id;
          
          const successResponse = { 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you soon.',
            submissionId: lastSubmission.id,
            contactId: criticalOperations.contactRecord.id,
            quoteId: recoveredQuoteId,
            formData: {
              name: sanitizedData.name,
              email: sanitizedData.email,
              phone: sanitizedData.phone,
              eventType: sanitizedData.eventType,
              eventDate: sanitizedData.eventDate,
              location: sanitizedData.location
            }
          };
          
          if (idempotencyKey) {
            serverIdempotency.markProcessed(idempotencyKey, successResponse);
          }
          
          return res.status(200).json(successResponse);
        }
      } catch (recoveryError) {
        console.error('❌ Failed to recover submission ID:', recoveryError);
      }
      
      // If we still don't have an ID, this is a critical failure
      // But we'll still return success with form data so user can proceed
      console.error('❌ CRITICAL FAILURE: Unable to generate quote ID');
      return res.status(200).json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you soon.',
        submissionId: null,
        contactId: null,
        quoteId: null,
        formData: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          eventType: sanitizedData.eventType,
          eventDate: sanitizedData.eventDate,
          location: sanitizedData.location
        },
        _warning: 'Quote link unavailable - please contact us directly'
      });
    }

    console.log('✅ Quote ID guaranteed:', quoteId, '(type:', typeof quoteId, ')');
    console.log('   Source:', criticalOperations.contactRecord.id ? 'contact' : 'submission');

    // Include form data in response as backup for quote page
    const successResponse = { 
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      submissionId: dbSubmission.id,
      contactId: criticalOperations.contactRecord.id,
      quoteId: quoteId, // Explicit quoteId field - guaranteed to exist
      formData: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        eventType: sanitizedData.eventType,
        eventDate: sanitizedData.eventDate,
        location: sanitizedData.location
      }
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