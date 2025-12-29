// API endpoint to disable AI assistant for specific customers
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Require admin authentication to disable AI
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Clean phone number for matching
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Get contact to find organization_id
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, organization_id')
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (contactError) {
      console.error('Error finding contact:', contactError);
      return res.status(500).json({ error: 'Failed to find contact' });
    }

    const organizationId = contact?.organization_id;

    // Update contact to disable AI
    const { data, error } = await supabase
      .from('contacts')
      .update({
        custom_fields: { ai_disabled: true },
        notes: `AI assistant disabled via admin on ${new Date().toLocaleDateString()}`
      })
      .eq('id', contact.id)
      .is('deleted_at', null);

    if (error) {
      console.error('Error disabling AI:', error);
      return res.status(500).json({ error: 'Failed to disable AI' });
    }

    // Log the AI disable action with organization_id
    await supabase
      .from('sms_conversations')
      .insert([{
        phone_number: phoneNumber,
        message_content: 'AI assistant disabled by admin',
        direction: 'outbound',
        message_type: 'admin',
        organization_id: organizationId, // Set organization_id for multi-tenant isolation
        created_at: new Date().toISOString()
      }]);

    res.status(200).json({ 
      success: true, 
      message: 'AI disabled for customer',
      phoneNumber: phoneNumber 
    });

  } catch (error) {
    console.error('Error in disable-ai endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
