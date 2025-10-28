/**
 * Generate Service Selection Link
 * Creates a unique, secure link for a contact to select their services
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contactId, expiresInDays = 30 } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'contactId required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Generate token using database function
    const { data: tokenData } = await supabase
      .rpc('generate_selection_token');

    const token = tokenData;

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store token
    const { data: createdToken, error: tokenError } = await supabase
      .from('service_selection_tokens')
      .insert({
        contact_id: contactId,
        token: token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    // Update contact
    await supabase
      .from('contacts')
      .update({
        service_selection_sent: true,
        service_selection_sent_at: new Date().toISOString()
      })
      .eq('id', contactId);

    // Generate the link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const selectionLink = `${baseUrl}/select-services/${token}`;

    console.log(`✅ Generated service selection link for contact ${contactId}`);

    res.status(200).json({
      success: true,
      token: token,
      link: selectionLink,
      expires_at: expiresAt.toISOString(),
      contact_id: contactId
    });

  } catch (error) {
    console.error('❌ Error generating service selection link:', error);
    res.status(500).json({ 
      error: 'Failed to generate link',
      message: error.message 
    });
  }
}

