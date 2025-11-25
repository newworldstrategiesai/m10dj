import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const updateData = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, try to update in contacts table
    let { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!contactError && contactData) {
      // Update contact
      const contactUpdate = {};
      
      if (updateData.name) {
        const nameParts = updateData.name.split(' ');
        contactUpdate.first_name = nameParts[0] || '';
        contactUpdate.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      if (updateData.email) {
        contactUpdate.email_address = updateData.email;
      }
      
      if (updateData.eventDate) {
        contactUpdate.event_date = updateData.eventDate;
      }
      
      if (updateData.eventTime) {
        contactUpdate.event_time = updateData.eventTime;
      }
      
      if (updateData.location) {
        contactUpdate.venue_address = updateData.location;
      }
      
      if (updateData.venueAddress) {
        contactUpdate.venue_address = updateData.venueAddress;
      }
      
      if (updateData.venueName) {
        contactUpdate.venue_name = updateData.venueName;
      }
      
      if (updateData.eventTime) {
        contactUpdate.event_time = updateData.eventTime;
      }
      
      if (updateData.endTime) {
        contactUpdate.end_time = updateData.endTime;
      }
      
      if (updateData.guestCount) {
        contactUpdate.guest_count = parseInt(updateData.guestCount) || null;
      }
      
      if (updateData.specialRequests !== undefined) {
        contactUpdate.special_requests = updateData.specialRequests;
      }
      
      if (updateData.phone) {
        contactUpdate.phone = updateData.phone;
      }

      console.log('Updating contact with:', contactUpdate);
      
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update(contactUpdate)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating contact:', updateError);
        return res.status(500).json({ error: 'Failed to update contact', details: updateError.message });
      }

      if (!updatedContact) {
        console.error('No contact returned from update');
        return res.status(404).json({ error: 'Contact not found after update' });
      }

      console.log('Contact updated successfully:', updatedContact.id, 'event_date:', updatedContact.event_date);

      return res.status(200).json({
        success: true,
        data: {
          id: updatedContact.id,
          name: `${updatedContact.first_name || ''} ${updatedContact.last_name || ''}`.trim(),
          email: updatedContact.email_address,
          eventDate: updatedContact.event_date,
          eventTime: updatedContact.event_time,
          venue_name: updatedContact.venue_name,
          venue_address: updatedContact.venue_address,
          venueAddress: updatedContact.venue_address // Keep for backward compatibility
        }
      });
    }

    // If not found in contacts, try contact_submissions table
    let submissionId = id;
    if (!isNaN(id) && !isNaN(parseInt(id))) {
      submissionId = parseInt(id);
    }

    const { data: submissionData, error: submissionError } = await supabase
      .from('contact_submissions')
      .select('id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Update submission
    const submissionUpdate = {};
    
    if (updateData.name) {
      submissionUpdate.name = updateData.name;
    }
    
    if (updateData.email) {
      submissionUpdate.email = updateData.email;
    }
    
    if (updateData.eventDate) {
      submissionUpdate.event_date = updateData.eventDate;
    }
    
    if (updateData.eventTime) {
      submissionUpdate.event_time = updateData.eventTime;
    }
    
    if (updateData.location) {
      submissionUpdate.location = updateData.location;
    }
    
    if (updateData.venueAddress) {
      submissionUpdate.location = updateData.venueAddress; // For submissions, location is the address field
    }
    
    if (updateData.venueName) {
      submissionUpdate.venue_name = updateData.venueName;
    }
    
    if (updateData.eventTime) {
      submissionUpdate.event_time = updateData.eventTime;
    }
    
    if (updateData.guestCount) {
      submissionUpdate.guest_count = parseInt(updateData.guestCount) || null;
    }
    
    if (updateData.specialRequests !== undefined) {
      submissionUpdate.special_requests = updateData.specialRequests;
    }
    
    if (updateData.phone) {
      submissionUpdate.phone = updateData.phone;
    }

    const { data: updatedSubmission, error: updateSubmissionError } = await supabase
      .from('contact_submissions')
      .update(submissionUpdate)
      .eq('id', submissionId)
      .select()
      .single();

    if (updateSubmissionError) {
      console.error('Error updating submission:', updateSubmissionError);
      return res.status(500).json({ error: 'Failed to update submission', details: updateSubmissionError.message });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: updatedSubmission.id,
        name: updatedSubmission.name,
        email: updatedSubmission.email,
        eventDate: updatedSubmission.event_date,
        eventTime: updatedSubmission.event_time,
        venue_name: updatedSubmission.venue_name,
        venue_address: updatedSubmission.location, // For submissions, location is the address
        venueAddress: updatedSubmission.location // Keep for backward compatibility
      }
    });
  } catch (error) {
    console.error('Error in update lead API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

