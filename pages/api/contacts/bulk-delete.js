import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin using email-based authentication
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'  // Ben Murray - Owner
    ];
    const isAdmin = adminEmails.includes(session.user.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    // Soft delete by setting deleted_at timestamp
    // First check if deleted_at column exists, if not, we'll use a different approach
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .in('id', contactIds)
      .is('deleted_at', null);

    if (fetchError) {
      console.error('Error fetching contacts:', fetchError);
      // If deleted_at doesn't exist, try direct delete
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);

      if (deleteError) {
        console.error('Database error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete contacts', details: deleteError.message });
      }

      return res.status(200).json({ 
        success: true,
        message: `Successfully deleted ${contactIds.length} contact(s)`,
        deleted: contactIds.length
      });
    }

    // Try soft delete first
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds);

    if (updateError) {
      // If soft delete fails (column might not exist), try hard delete
      console.log('Soft delete failed, attempting hard delete:', updateError.message);
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);

      if (deleteError) {
        console.error('Database error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete contacts', details: deleteError.message });
      }
    }

    return res.status(200).json({ 
      success: true,
      message: `Successfully deleted ${contactIds.length} contact(s)`,
      deleted: contactIds.length
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

