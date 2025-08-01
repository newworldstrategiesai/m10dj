import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return the current user's ID - they can use this as the admin ID
    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    return res.status(200).json({
      success: true,
      message: 'Current user information',
      data: {
        userId: currentUserId,
        email: currentUserEmail,
        environmentVariable: {
          name: 'DEFAULT_ADMIN_USER_ID',
          value: currentUserId,
          instructions: `Add this to your .env.local file:
DEFAULT_ADMIN_USER_ID=${currentUserId}

This will assign all contact form submissions to your user account.`
        }
      }
    });

  } catch (error) {
    console.error('Get admin user ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user ID',
      details: error.message
    });
  }
}