// API endpoint to update song details for a crowd request
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, songTitle, songArtist } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  if (!songTitle || !songTitle.trim()) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the crowd request with song details
    const { data, error } = await supabase
      .from('crowd_requests')
      .update({
        song_title: songTitle.trim(),
        song_artist: songArtist?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating song details:', error);
      return res.status(500).json({ error: 'Failed to update song details' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log(`✅ Updated song details for request ${requestId}`);

    return res.status(200).json({
      success: true,
      request: data
    });
  } catch (error) {
    console.error('❌ Error updating song details:', error);
    return res.status(500).json({
      error: 'Failed to update song details',
      message: error.message
    });
  }
}

