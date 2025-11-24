/**
 * Get Current User's Organization
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.status(200).json({ organization });
  } catch (error) {
    console.error('Error getting organization:', error);
    return res.status(500).json({
      error: 'Failed to get organization',
      message: error.message,
    });
  }
}

