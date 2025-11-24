// API endpoint to set/clear view-as organization for super admins
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Set view-as organization
    try {
      const supabase = createServerSupabaseClient({ req, res });
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is platform admin
      if (!isPlatformAdmin(session.user.email)) {
        return res.status(403).json({ error: 'Platform admin access required' });
      }

      const { organizationId } = req.body;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      // Verify organization exists
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single();

      if (orgError || !org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Set cookie (30 days expiration)
      const cookieOptions = [
        `admin_view_as_org_id=${organizationId}`,
        'Path=/',
        'Max-Age=2592000', // 30 days
        'SameSite=Lax',
        'HttpOnly',
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
      ].filter(Boolean).join('; ');

      res.setHeader('Set-Cookie', cookieOptions);

      return res.status(200).json({
        success: true,
        organization: {
          id: org.id,
          name: org.name,
        },
      });
    } catch (error) {
      console.error('Error setting view-as:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    // Clear view-as organization
    try {
      const supabase = createServerSupabaseClient({ req, res });
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is platform admin
      if (!isPlatformAdmin(session.user.email)) {
        return res.status(403).json({ error: 'Platform admin access required' });
      }

      // Clear cookie
      const cookieOptions = [
        'admin_view_as_org_id=',
        'Path=/',
        'Max-Age=0',
        'SameSite=Lax',
        'HttpOnly',
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
      ].filter(Boolean).join('; ');

      res.setHeader('Set-Cookie', cookieOptions);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error clearing view-as:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}


