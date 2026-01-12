// API endpoint to create dummy crowd requests for new users
// This allows new users to see sample data in their admin panel to understand the UI

const { createClient } = require('@supabase/supabase-js');
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Check if dummy data already exists for this organization
    const { data: existingDummyRequests } = await supabaseAdmin
      .from('crowd_requests')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('admin_notes', '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.')
      .limit(1);

    if (existingDummyRequests && existingDummyRequests.length > 0) {
      return res.status(400).json({ 
        error: 'Dummy data already exists for this organization',
        message: 'Dummy data can only be created once per organization'
      });
    }

    // Sample dummy data - varied to show different features
    const dummyRequests = [
      {
        request_type: 'song_request',
        song_title: 'Bohemian Rhapsody',
        song_artist: 'Queen',
        requester_name: 'Sarah M.',
        amount_requested: 2000, // $20.00
        amount_paid: 2000,
        payment_status: 'paid',
        payment_method: 'card',
        status: 'played',
        is_fast_track: false,
        fast_track_fee: 0,
        priority_order: 1000,
        admin_notes: '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        paid_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        played_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
      {
        request_type: 'song_request',
        song_title: 'Dancing Queen',
        song_artist: 'ABBA',
        requester_name: 'Mike T.',
        amount_requested: 1500, // $15.00
        amount_paid: 1500,
        payment_status: 'paid',
        payment_method: 'cashapp',
        status: 'playing',
        is_fast_track: true,
        fast_track_fee: 1000, // $10.00
        priority_order: 50,
        admin_notes: '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        paid_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        request_type: 'song_request',
        song_title: 'Sweet Caroline',
        song_artist: 'Neil Diamond',
        requester_name: 'Jessica L.',
        amount_requested: 1000, // $10.00
        amount_paid: 0,
        payment_status: 'pending',
        payment_method: 'venmo',
        status: 'new',
        is_fast_track: false,
        fast_track_fee: 0,
        priority_order: 1000,
        admin_notes: '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      },
      {
        request_type: 'shoutout',
        recipient_name: 'Happy Birthday to Emma!',
        recipient_message: 'Hope you have an amazing day!',
        requester_name: 'Alex R.',
        amount_requested: 2500, // $25.00
        amount_paid: 2500,
        payment_status: 'paid',
        payment_method: 'card',
        status: 'acknowledged',
        is_fast_track: false,
        fast_track_fee: 0,
        priority_order: 1000,
        admin_notes: '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        paid_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        request_type: 'song_request',
        song_title: 'Don\'t Stop Believin\'',
        song_artist: 'Journey',
        requester_name: 'Chris D.',
        amount_requested: 3000, // $30.00
        amount_paid: 0,
        payment_status: 'pending',
        payment_method: 'cash',
        status: 'new',
        is_fast_track: false,
        fast_track_fee: 0,
        priority_order: 1000,
        admin_notes: '⚠️ DUMMY DATA - Not real data. This is sample data to help you explore the UI.',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      },
    ];

    // Add organization_id to all requests
    const requestsToInsert = dummyRequests.map(req => ({
      ...req,
      organization_id: organizationId,
      event_qr_code: `dummy-${organizationId}-${Date.now()}`,
      updated_at: new Date().toISOString(),
    }));

    // Insert dummy requests
    const { data: createdRequests, error: createError } = await supabaseAdmin
      .from('crowd_requests')
      .insert(requestsToInsert)
      .select('id, song_title, song_artist, requester_name, amount_requested, payment_status, status');

    if (createError) {
      console.error('Error creating dummy crowd requests:', createError);
      return res.status(500).json({ 
        error: 'Failed to create dummy crowd requests', 
        details: createError.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dummy data created successfully',
      created: createdRequests.length,
      requests: createdRequests
    });

  } catch (error) {
    console.error('Error creating dummy crowd requests:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
