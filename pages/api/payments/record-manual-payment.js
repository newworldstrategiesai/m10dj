/**
 * Record a manual payment (Venmo, Cash App, etc.)
 * This allows clients or admins to record payments made outside of Stripe
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    leadId, 
    amount, 
    paymentMethod, // 'Venmo', 'Cash App', 'Check', 'Cash', etc.
    transactionId, // Transaction ID or receipt number
    paymentNotes, // Additional notes
    paymentType, // 'deposit', 'full', 'remaining'
    transactionDate // Optional: date of transaction (defaults to today)
  } = req.body;

  if (!leadId || !amount || !paymentMethod) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['leadId', 'amount', 'paymentMethod']
    });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find the contact_id from the lead_id
    // The lead_id in quote_selections is typically the contact_id directly
    let contactId = leadId; // Default assumption

    // Verify the contact exists
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id, email_address, first_name, last_name')
      .eq('id', leadId)
      .single();

    if (!contact) {
      // Try to find via quote_selections -> contacts
      const { data: quoteSelection } = await supabaseAdmin
        .from('quote_selections')
        .select('lead_id')
        .eq('lead_id', leadId)
        .single();

      if (quoteSelection) {
        // lead_id is the contact_id
        contactId = leadId;
      } else {
        return res.status(404).json({ error: 'Contact not found for this lead ID' });
      }
    } else {
      contactId = contact.id;
    }

    // Get quote data to determine payment details
    const { data: quoteData } = await supabaseAdmin
      .from('quote_selections')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (!quoteData) {
      return res.status(404).json({ error: 'Quote not found for this lead ID' });
    }

    // Determine payment name
    let paymentName = 'Payment';
    if (paymentType === 'deposit') {
      paymentName = 'Deposit';
    } else if (paymentType === 'remaining') {
      paymentName = 'Remaining Balance';
    } else if (paymentType === 'full') {
      paymentName = 'Full Payment';
    } else {
      // Auto-detect based on amount and existing payments
      const { data: existingPayments } = await supabaseAdmin
        .from('payments')
        .select('total_amount')
        .eq('contact_id', contactId)
        .eq('payment_status', 'Paid');

      const totalPaid = existingPayments?.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0) || 0;
      const totalDue = Number(quoteData.total_price) || 0;

      if (totalPaid === 0) {
        paymentName = amount >= totalDue * 0.9 ? 'Full Payment' : 'Deposit';
      } else {
        paymentName = 'Remaining Balance';
      }
    }

    // Create payment record
    const paymentRecord = {
      contact_id: contactId,
      payment_name: paymentName,
      total_amount: Number(amount),
      payment_status: 'Paid', // Manual payments are marked as paid when recorded
      payment_method: paymentMethod,
      transaction_date: transactionDate || new Date().toISOString().split('T')[0],
      payment_notes: transactionId 
        ? `${paymentMethod} Transaction: ${transactionId}${paymentNotes ? ` | ${paymentNotes}` : ''}`
        : (paymentNotes || `${paymentMethod} payment recorded manually`),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return res.status(500).json({ 
        error: 'Failed to create payment record',
        details: paymentError.message 
      });
    }

    // Update quote_selections payment status
    const { data: allPayments } = await supabaseAdmin
      .from('payments')
      .select('total_amount')
      .eq('contact_id', contactId)
      .eq('payment_status', 'Paid');
    
    const totalPaid = allPayments?.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0) || 0;

    const totalDue = Number(quoteData.total_price) || 0;
    const newPaymentStatus = totalPaid >= totalDue ? 'paid' : 'partial';

    const { error: quoteUpdateError } = await supabaseAdmin
      .from('quote_selections')
      .update({
        payment_status: newPaymentStatus,
        deposit_amount: paymentType === 'deposit' ? Number(amount) : quoteData.deposit_amount,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    if (quoteUpdateError) {
      console.error('Error updating quote_selections:', quoteUpdateError);
      // Payment was created, but quote update failed - still return success but log error
    }

    res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.total_amount,
        paymentMethod: payment.payment_method,
        status: payment.payment_status,
        transactionDate: payment.transaction_date
      },
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error recording manual payment:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

