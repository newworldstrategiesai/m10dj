/**
 * API endpoint to link a visitor session to contact info
 * 
 * POST /api/tracking/link-contact
 * 
 * Called when a visitor provides their email, phone, or name
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      visitorId,
      email,
      phone,
      name,
      contactId,
      contactSubmissionId,
    } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    // At least one contact field is required
    if (!email && !phone && !name && !contactId && !contactSubmissionId) {
      return res.status(400).json({ error: 'At least one contact field is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Link visitor to contact info
    const { error } = await supabase
      .rpc('link_visitor_to_contact', {
        p_visitor_id: visitorId,
        p_email: email || null,
        p_phone: phone || null,
        p_name: name || null,
        p_contact_id: contactId || null,
        p_contact_submission_id: contactSubmissionId || null,
      });

    if (error) {
      console.error('Error linking visitor to contact:', error);
      return res.status(500).json({ error: 'Failed to link contact' });
    }

    // Also update the has_submitted_form flag if this was a form submission
    if (contactSubmissionId) {
      await supabase
        .from('visitor_sessions')
        .update({ has_submitted_form: true })
        .eq('id', visitorId);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in link contact:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

