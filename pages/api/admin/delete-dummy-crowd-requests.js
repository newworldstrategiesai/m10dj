// API endpoint to delete all dummy crowd requests for an organization
// This allows admins to easily remove sample/dummy data

const { createClient } = require('@supabase/supabase-js');
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = session.user;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const organizationId = organization.id;

    // Find all dummy requests for this organization
    const { data: dummyRequests, error: findError } = await supabaseAdmin
      .from('crowd_requests')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('admin_notes', '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.');

    if (findError) {
      console.error('Error finding dummy requests:', findError);
      return res.status(500).json({ 
        error: 'Failed to find dummy requests', 
        details: findError.message 
      });
    }

    if (!dummyRequests || dummyRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No dummy data found to delete',
        deleted: 0
      });
    }

    const dummyRequestIds = dummyRequests.map(req => req.id);

    // Delete all dummy requests
    const { error: deleteError } = await supabaseAdmin
      .from('crowd_requests')
      .delete()
      .in('id', dummyRequestIds);

    if (deleteError) {
      console.error('Error deleting dummy requests:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete dummy requests', 
        details: deleteError.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${dummyRequestIds.length} dummy request(s)`,
      deleted: dummyRequestIds.length
    });

  } catch (error) {
    console.error('Error deleting dummy crowd requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
