// API endpoint to find crowd requests that might be missing from the admin panel
// Specifically looks for requests with Venmo payments that aren't showing up
const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('@/utils/auth-helpers/api-auth');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get query parameters
    const { 
      days = 7, // Default to last 7 days
      paymentMethod = 'venmo',
      paymentStatus = 'all' // 'all', 'pending', 'paid'
    } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    console.log(`🔍 Searching for requests from last ${days} days...`);
    
    // Build query
    let query = supabase
      .from('crowd_requests')
      .select('*')
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    // Filter by payment method if specified
    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
    }
    
    // Filter by payment status if specified
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }
    
    const { data: requests, error } = await query;
    
    if (error) {
      console.error('Error fetching requests:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch requests',
        details: error.message 
      });
    }
    
    // Group by organization_id to see which ones might be missing
    const byOrganization = {};
    const withoutOrganization = [];
    
    (requests || []).forEach(req => {
      if (req.organization_id) {
        if (!byOrganization[req.organization_id]) {
          byOrganization[req.organization_id] = [];
        }
        byOrganization[req.organization_id].push(req);
      } else {
        withoutOrganization.push(req);
      }
    });
    
    // Get organization details for context
    const orgIds = Object.keys(byOrganization);
    let organizations = {};
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', orgIds);
      
      if (orgs) {
        orgs.forEach(org => {
          organizations[org.id] = org;
        });
      }
    }
    
    // Analyze payment codes for Venmo requests
    const venmoRequests = (requests || []).filter(req => 
      req.payment_method === 'venmo' || 
      (req.payment_code && req.payment_status === 'pending')
    );
    
    return res.status(200).json({
      success: true,
      summary: {
        total: requests?.length || 0,
        with_organization: requests?.filter(r => r.organization_id).length || 0,
        without_organization: withoutOrganization.length,
        venmo_requests: venmoRequests.length,
        by_payment_status: {
          pending: requests?.filter(r => r.payment_status === 'pending').length || 0,
          paid: requests?.filter(r => r.payment_status === 'paid').length || 0,
          failed: requests?.filter(r => r.payment_status === 'failed').length || 0,
        }
      },
      requests: requests || [],
      by_organization: byOrganization,
      without_organization: withoutOrganization,
      organizations: organizations,
      venmo_requests: venmoRequests,
      note: 'Check "without_organization" array for requests that might not show up if they have no organization_id'
    });
  } catch (error) {
    console.error('Error finding missing requests:', error);
    return res.status(500).json({
      error: 'Failed to find missing requests',
      message: error.message,
    });
  }
}

