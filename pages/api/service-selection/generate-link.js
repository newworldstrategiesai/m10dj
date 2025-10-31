/**
 * API: Generate Service Selection Link
 * Creates a secure token and returns a personalized service selection URL
 */

import crypto from 'crypto';
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, eventType, eventDate } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find or create contact
    let contact;
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('email_address', email)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingContact) {
      contact = existingContact;
    } else {
      // Create new contact
      const nameParts = (name || 'Guest').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email_address: email,
          event_type: eventType || 'other',
          event_date: eventDate || null,
          lead_status: 'new',
          lead_source: 'Email Link',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        return res.status(500).json({ error: 'Failed to create contact' });
      }

      contact = newContact;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Store token with contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        service_selection_token: token,
        service_selection_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('Error updating contact with token:', updateError);
      return res.status(500).json({ error: 'Failed to generate link' });
    }

    // Generate link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/select-services/${token}`;

    return res.status(200).json({
      success: true,
      link,
      contactId: contact.id
    });

  } catch (error) {
    console.error('Error generating service selection link:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
