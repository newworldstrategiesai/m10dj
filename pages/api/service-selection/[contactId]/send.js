import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { sendServiceSelectionEmail, generateServiceSelectionLink } from '@/utils/service-selection-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Send service selection email to client
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { contactId } = req.query;

  if (!contactId) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Validate email address
    if (!contact.email_address) {
      return res.status(400).json({ 
        error: 'Email address is required',
        code: 'MISSING_EMAIL',
        contactId: contact.id,
        message: 'Please add an email address to the contact before sending.'
      });
    }

    // Generate service selection link if not already generated
    // This ensures the link is in the database
    const serviceSelectionLink = generateServiceSelectionLink(contact);

    // Send email using the helper function
    const result = await sendServiceSelectionEmail(contact, serviceSelectionLink);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to send email' 
      });
    }

    // Optionally update contact status or note that email was sent
    await supabaseAdmin
      .from('contacts')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    res.status(200).json({
      success: true,
      message: 'Service selection email sent successfully',
      emailId: result.emailId,
      link: serviceSelectionLink
    });
  } catch (error) {
    console.error('Error sending service selection email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      message: error.message 
    });
  }
}
