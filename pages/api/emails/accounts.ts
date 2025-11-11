import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getEmailAccounts } from '@/utils/email-addresses';

/**
 * API route to get all email accounts
 * GET /api/emails/accounts
 * 
 * Returns list of email accounts that have received emails
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get configured email accounts with count of unread emails
    const accounts = getEmailAccounts();

    // Get unread count for each account
    const accountsWithCounts = await Promise.all(
      accounts.map(async (account) => {
        const { count } = await supabase
          .from('received_emails')
          .select('*', { count: 'exact', head: true })
          .contains('to_emails', [account.email])
          .eq('read', false)
          .eq('deleted', false);

        return {
          ...account,
          unreadCount: count || 0,
        };
      })
    );

    return res.status(200).json({ accounts: accountsWithCounts });

  } catch (error: any) {
    console.error('[API] Error in accounts endpoint:', error);
    return res.status(500).json({
      error: 'Failed to fetch accounts',
      details: error.message,
    });
  }
}

