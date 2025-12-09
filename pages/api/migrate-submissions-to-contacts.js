import { createClient } from '@/utils/supabase/server';

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient();
    
    // Get admin user ID from environment
    const adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
    if (!adminUserId) {
      return res.status(500).json({ 
        error: 'DEFAULT_ADMIN_USER_ID not configured in environment variables' 
      });
    }

    console.log('Starting migration of contact submissions to contacts table...');
    console.log('Admin User ID:', adminUserId);

    // 1. Fetch all contact submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch submissions', details: fetchError });
    }

    console.log(`Found ${submissions.length} contact submissions to migrate`);

    // 2. Get existing contacts to avoid duplicates
    const { data: existingContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('email_address, phone')
      .eq('user_id', adminUserId);

    if (contactsError) {
      console.error('Error fetching existing contacts:', contactsError);
      return res.status(500).json({ error: 'Failed to fetch existing contacts', details: contactsError });
    }

    // Create lookup sets for existing contacts
    const existingEmails = new Set(existingContacts.map(c => c.email_address?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existingContacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));

    console.log(`Found ${existingEmails.size} existing email addresses and ${existingPhones.size} existing phone numbers`);

    const results = {
      total: submissions.length,
      created: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // 3. Process each submission
    for (const submission of submissions) {
      try {
        // Check for duplicates
        const submissionEmail = submission.email?.toLowerCase();
        const submissionPhone = submission.phone?.replace(/\D/g, '');
        
        const isDuplicateEmail = submissionEmail && existingEmails.has(submissionEmail);
        const isDuplicatePhone = submissionPhone && existingPhones.has(submissionPhone);

        if (isDuplicateEmail || isDuplicatePhone) {
          results.skipped++;
          results.details.push({
            submission_id: submission.id,
            name: submission.name,
            email: submission.email,
            status: 'skipped',
            reason: isDuplicateEmail ? 'duplicate_email' : 'duplicate_phone'
          });
          continue;
        }

        // Parse name into first_name and last_name
        const nameParts = submission.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Standardize event type
        const standardizeEventType = (type) => {
          if (!type) return 'other';
          const lower = type.toLowerCase();
          if (lower.includes('wedding')) return 'wedding';
          if (lower.includes('corporate')) return 'corporate';
          if (lower.includes('school') || lower.includes('dance')) return 'school_dance';
          if (lower.includes('holiday') || lower.includes('christmas')) return 'holiday_party';
          if (lower.includes('private') || lower.includes('birthday')) return 'private_party';
          return 'other';
        };

        // Map submission status to lead status
        const mapLeadStatus = (status) => {
          switch (status?.toLowerCase()) {
            case 'new': return 'New';
            case 'contacted': return 'Contacted';
            case 'quoted': return 'Proposal Sent';
            case 'booked': return 'Booked';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Lost';
            default: return 'New';
          }
        };

        // Determine lead temperature based on how recent the submission is
        const getLeadTemperature = (createdAt) => {
          const daysSince = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
          if (daysSince <= 7) return 'Hot';
          if (daysSince <= 30) return 'Warm';
          return 'Cold';
        };

        // Create contact record
        const contactData = {
          // Core Identity
          user_id: adminUserId,
          
          // Personal Information
          first_name: firstName,
          last_name: lastName,
          phone: submission.phone,
          email_address: submission.email,
          
          // Event Information
          event_type: standardizeEventType(submission.event_type),
          event_date: submission.event_date,
          venue_name: submission.location, // Map location to venue_name
          
          // Lead Management
          lead_status: mapLeadStatus(submission.status),
          lead_source: 'Website',
          lead_stage: 'Initial Inquiry',
          lead_temperature: getLeadTemperature(submission.created_at),
          lead_quality: 'Medium',
          lead_score: 50, // Default middle score
          
          // Communication
          communication_preference: submission.phone ? 'any' : 'email',
          last_contacted_date: submission.last_contact_date || null,
          
          // Music & Entertainment
          special_requests: submission.message,
          
          // Business Tracking
          assigned_to: adminUserId,
          priority_level: 'Medium',
          
          // Additional Info
          notes: submission.notes || null,
          tags: [submission.event_type, 'migrated_from_submissions'].filter(Boolean),
          
          // Timestamps
          created_at: submission.created_at,
          updated_at: submission.updated_at
        };

        // Insert the contact
        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id, first_name, last_name, email_address')
          .single();

        if (insertError) {
          console.error(`Error inserting contact for ${submission.name}:`, insertError);
          results.errors++;
          results.details.push({
            submission_id: submission.id,
            name: submission.name,
            email: submission.email,
            status: 'error',
            error: insertError.message
          });
          continue;
        }

        // Add to existing sets to prevent duplicate creation in this batch
        if (submissionEmail) existingEmails.add(submissionEmail);
        if (submissionPhone) existingPhones.add(submissionPhone);

        results.created++;
        results.details.push({
          submission_id: submission.id,
          contact_id: newContact.id,
          name: submission.name,
          email: submission.email,
          status: 'created'
        });

        console.log(`✅ Created contact: ${firstName} ${lastName} (${submission.email})`);

      } catch (error) {
        console.error(`Error processing submission ${submission.id}:`, error);
        results.errors++;
        results.details.push({
          submission_id: submission.id,
          name: submission.name,
          email: submission.email,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('Migration completed!');
    console.log(`Results: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`);

    return res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      results,
      summary: {
        total_submissions: results.total,
        contacts_created: results.created,
        duplicates_skipped: results.skipped,
        errors_encountered: results.errors
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
}