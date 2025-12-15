// API endpoint to update payment status for a crowd request
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, paymentStatus, paymentMethod, amountPaid, paidAt } = req.body;

  if (!requestId || !paymentStatus) {
    return res.status(400).json({ error: 'Request ID and payment status are required' });
  }

  // Validate payment status
  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build update object
    const updateData = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    // If marking as paid, update amount_paid and paid_at
    if (paymentStatus === 'paid') {
      updateData.paid_at = paidAt || new Date().toISOString();
      
      // Update amount_paid if provided, otherwise use amount_requested
      if (amountPaid) {
        updateData.amount_paid = amountPaid;
      } else {
        // Get the current request to use amount_requested if amount_paid not provided
        const { data: currentRequest } = await supabase
          .from('crowd_requests')
          .select('amount_requested, fast_track_fee, next_fee')
          .eq('id', requestId)
          .single();
        
        if (currentRequest) {
          // Calculate total: base amount + fees
          const totalAmount = currentRequest.amount_requested + 
                             (currentRequest.fast_track_fee || 0) + 
                             (currentRequest.next_fee || 0);
          updateData.amount_paid = totalAmount;
        }
      }
    }

    // Update payment method if provided
    if (paymentMethod) {
      updateData.payment_method = paymentMethod;
    }

    // Update the crowd request
    const { data, error } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      return res.status(500).json({ 
        error: 'Failed to update payment status',
        details: error.message 
      });
    }

    console.log(`✅ Updated payment status for request ${requestId}: ${paymentStatus}`);

    return res.status(200).json({
      success: true,
      request: data
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      error: 'Failed to update payment status',
      message: error.message,
    });
  }
}

