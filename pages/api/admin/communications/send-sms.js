import { createClient } from '@/utils/supabase/server';

// Note: You'll need to install and configure Twilio for SMS functionality
// npm install twilio
// const twilio = require('twilio');
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, to, message } = req.body;

  if (!contactId || !to || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return res.status(500).json({ 
      error: 'SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.' 
    });
  }

  try {
    // For now, we'll simulate SMS sending since Twilio requires setup
    // Uncomment and configure the following when you have Twilio set up:
    
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const smsResult = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    */

    // Simulate SMS for demo purposes
    const smsResult = {
      sid: 'demo_' + Date.now(),
      status: 'sent'
    };

    // Log the communication in database
    const supabase = createClient();
    
    // Get organization_id from contact
    let organizationId = null;
    const { data: contact } = await supabase
      .from('contacts')
      .select('organization_id')
      .eq('id', contactId)
      .single();
    
    if (contact?.organization_id) {
      organizationId = contact.organization_id;
    } else {
      // Try contact_submissions if not found in contacts
      const { data: submission } = await supabase
        .from('contact_submissions')
        .select('organization_id')
        .eq('id', contactId)
        .single();
      
      if (submission?.organization_id) {
        organizationId = submission.organization_id;
      }
    }
    
    const { error: logError } = await supabase
      .from('communication_log')
      .insert([{
        contact_submission_id: contactId,
        communication_type: 'sms',
        direction: 'outbound',
        subject: null,
        content: message,
        sent_by: 'Admin',
        sent_to: to,
        status: 'sent', // or smsResult.status
        organization_id: organizationId, // Set organization_id for multi-tenant isolation
        metadata: {
          twilio_sid: smsResult.sid || 'demo',
          simulated: true // Remove this when using real Twilio
        }
      }]);

    if (logError) {
      console.error('Error logging SMS communication:', logError);
      // Don't fail the request if logging fails
    }

    // Update last contact date on the submission
    const { error: updateError } = await supabase
      .from('contact_submissions')
      .update({ 
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('Error updating last contact date:', updateError);
    }

    return res.status(200).json({ 
      success: true, 
      smsId: smsResult.sid,
      message: process.env.NODE_ENV === 'development' 
        ? 'SMS simulated successfully (configure Twilio for production)' 
        : 'SMS sent successfully'
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Try to log the failed attempt
    try {
      const supabase = createClient();
      
      // Get organization_id from contact
      let organizationId = null;
      const { data: contact } = await supabase
        .from('contacts')
        .select('organization_id')
        .eq('id', contactId)
        .single();
      
      if (contact?.organization_id) {
        organizationId = contact.organization_id;
      } else {
        // Try contact_submissions if not found in contacts
        const { data: submission } = await supabase
          .from('contact_submissions')
          .select('organization_id')
          .eq('id', contactId)
          .single();
        
        if (submission?.organization_id) {
          organizationId = submission.organization_id;
        }
      }
      
      await supabase
        .from('communication_log')
        .insert([{
          contact_submission_id: contactId,
          communication_type: 'sms',
          direction: 'outbound',
          subject: null,
          content: message,
          sent_by: 'Admin',
          sent_to: to,
          status: 'failed',
          organization_id: organizationId, // Set organization_id for multi-tenant isolation
          metadata: { error: error.message }
        }]);
    } catch (logError) {
      console.error('Error logging failed SMS:', logError);
    }

    return res.status(500).json({ 
      error: 'Failed to send SMS', 
      details: error.message 
    });
  }
}

/*
To set up Twilio for production SMS:

1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for sending SMS
4. Set these environment variables:
   - TWILIO_ACCOUNT_SID=your_account_sid
   - TWILIO_AUTH_TOKEN=your_auth_token
   - TWILIO_PHONE_NUMBER=your_twilio_phone_number

5. Install Twilio SDK:
   npm install twilio

6. Uncomment the Twilio code above
*/