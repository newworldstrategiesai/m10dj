// API endpoint to update payment method for a crowd request
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, paymentMethod } = req.body;

  if (!requestId || !paymentMethod) {
    return res.status(400).json({ error: 'Request ID and payment method are required' });
  }

  const validMethods = ['card', 'cashapp', 'venmo', 'cash', 'other'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('crowd_requests')
      .update({
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating payment method:', error);
      return res.status(500).json({ error: 'Failed to update payment method' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error updating payment method:', error);
    return res.status(500).json({
      error: 'Failed to update payment method',
      message: error.message,
    });
  }
}

