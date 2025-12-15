// Endpoint to view recent webhook processing logs
// Note: This is a simple implementation. For production, consider using a proper logging service
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent crowd requests that were updated via webhook (have payment_intent_id and paid_at)
    const { data: recentPayments, error } = await supabase
      .from('crowd_requests')
      .select('id, payment_intent_id, payment_status, amount_paid, paid_at, created_at, updated_at')
      .not('payment_intent_id', 'is', null)
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching payment logs:', error);
      return res.status(500).json({ error: 'Failed to fetch payment logs' });
    }

    // Group by date
    const groupedByDate = {};
    recentPayments?.forEach((payment) => {
      const date = new Date(payment.paid_at).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(payment);
    });

    // Calculate stats
    const stats = {
      totalPayments: recentPayments?.length || 0,
      totalAmount: recentPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0,
      byStatus: {},
      recentActivity: Object.keys(groupedByDate).slice(0, 7), // Last 7 days
    };

    recentPayments?.forEach((payment) => {
      const status = payment.payment_status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      stats,
      recentPayments: recentPayments?.slice(0, 20) || [], // Most recent 20
      groupedByDate,
      note: 'This shows payments that were successfully processed. Check server logs for webhook processing details.',
    });
  } catch (error) {
    console.error('Error in webhook logs endpoint:', error);
    return res.status(500).json({
      error: 'Failed to fetch webhook logs',
      message: error.message,
    });
  }
}

