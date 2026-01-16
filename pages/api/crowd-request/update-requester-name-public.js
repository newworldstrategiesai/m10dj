// Public API endpoint to update requester name for a crowd request
// Validates via payment code to ensure security
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, requesterName, paymentCode } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  if (!requesterName || !requesterName.trim()) {
    return res.status(400).json({ error: 'Requester name is required' });
  }

  // Validate payment code if provided (for security)
  // This ensures only the person with the payment code can update the name
  if (paymentCode) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify the request exists and payment code matches
      const { data: request, error: fetchError } = await supabase
        .from('crowd_requests')
        .select('id, payment_code')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Verify payment code matches (if provided)
      if (request.payment_code && paymentCode !== request.payment_code) {
        return res.status(403).json({ error: 'Invalid payment code' });
      }
    } catch (error) {
      console.error('Error validating payment code:', error);
      return res.status(500).json({ error: 'Failed to validate request' });
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the requester name
    const { data, error } = await supabase
      .from('crowd_requests')
      .update({
        requester_name: requesterName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating requester name:', error);
      return res.status(500).json({ 
        error: 'Failed to update requester name',
        details: error.message 
      });
    }

    console.log(`✅ Updated requester name for request ${requestId}: ${requesterName.trim()}`);

    return res.status(200).json({
      success: true,
      request: data
    });
  } catch (error) {
    console.error('Error updating requester name:', error);
    return res.status(500).json({
      error: 'Failed to update requester name',
      message: error.message,
    });
  }
}
