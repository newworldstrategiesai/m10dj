const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, payment_intent } = req.query;

  if (!session_id && !payment_intent) {
    return res.status(400).json({ error: 'session_id or payment_intent is required' });
  }

  try {
    let session = null;
    let paymentIntent = null;

    // Try to get session first (more complete data)
    if (session_id) {
      session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['payment_intent']
      });
      paymentIntent = session.payment_intent;
    } else if (payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
    }

    if (!paymentIntent && !session) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const metadata = session?.metadata || paymentIntent?.metadata || {};
    const invoiceId = metadata.invoice_id;
    
    // Get invoice and contract information
    let invoiceData = null;
    let contractData = null;

    if (invoiceId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, contact_id')
        .eq('id', invoiceId)
        .single();

      if (!invoiceError && invoice) {
        invoiceData = {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount
        };

        // Fetch contract if it exists
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select('id, contract_number, status, signing_token')
          .eq('invoice_id', invoice.id)
          .single();

        if (!contractError && contract) {
          contractData = {
            id: contract.id,
            contract_number: contract.contract_number,
            status: contract.status,
            signing_url: contract.signing_token 
              ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-contract/${contract.signing_token}`
              : null
          };
        }
      }
    }

    const amount = session?.amount_total 
      ? session.amount_total / 100 
      : (paymentIntent?.amount ? paymentIntent.amount / 100 : 0);

    console.log('✅ Payment verified:', {
      id: session?.id || paymentIntent?.id,
      status: session?.payment_status || paymentIntent?.status,
      amount,
      invoice_id: invoiceId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      status: session?.payment_status || paymentIntent?.status,
      amount,
      currency: session?.currency || paymentIntent?.currency || 'usd',
      transaction_id: session?.payment_intent?.id || paymentIntent?.id,
      invoice_id: invoiceId,
      invoice_number: invoiceData?.invoice_number || metadata.invoice_number,
      invoice: invoiceData,
      contract: contractData
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
}
