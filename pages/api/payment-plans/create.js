/**
 * Create Payment Plan
 * Setup partial payments or installments for an invoice
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    invoiceId,
    planType, // 'partial', 'installment'
    installments // Array of installment details
  } = req.body;

  if (!invoiceId || !planType || !installments || !Array.isArray(installments)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, contacts(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const totalAmount = invoice.total_amount;

    // Validate installments total equals invoice total
    const installmentsTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
    if (Math.abs(installmentsTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        error: 'Installments total does not match invoice total',
        installmentsTotal,
        invoiceTotal: totalAmount
      });
    }

    // Determine plan name
    let planName;
    if (planType === 'partial') {
      planName = `Deposit + Balance (${installments.length} payments)`;
    } else {
      planName = `${installments.length}-Part Payment Plan`;
    }

    // Create payment plan
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .insert({
        invoice_id: invoiceId,
        contact_id: invoice.contact_id,
        plan_name: planName,
        plan_type: planType,
        total_amount: totalAmount,
        status: 'active'
      })
      .select()
      .single();

    if (planError) {
      throw new Error(`Failed to create payment plan: ${planError.message}`);
    }

    // Create installments
    const installmentsToInsert = installments.map((inst, index) => ({
      payment_plan_id: paymentPlan.id,
      invoice_id: invoiceId,
      installment_number: index + 1,
      installment_name: inst.name || `Payment ${index + 1} of ${installments.length}`,
      amount: inst.amount,
      due_date: inst.dueDate,
      status: 'pending'
    }));

    const { error: installmentsError } = await supabase
      .from('payment_installments')
      .insert(installmentsToInsert);

    if (installmentsError) {
      // Rollback: delete payment plan
      await supabase.from('payment_plans').delete().eq('id', paymentPlan.id);
      throw new Error(`Failed to create installments: ${installmentsError.message}`);
    }

    // Update invoice with payment plan reference
    await supabase
      .from('invoices')
      .update({
        has_payment_plan: true,
        payment_plan_id: paymentPlan.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    // If partial payment, set deposit amount
    if (planType === 'partial' && installments.length >= 1) {
      await supabase
        .from('invoices')
        .update({
          deposit_amount: installments[0].amount
        })
        .eq('id', invoiceId);
    }

    console.log(`✅ Created ${planType} payment plan for invoice ${invoice.invoice_number}`);

    res.status(200).json({
      success: true,
      paymentPlan,
      installmentsCount: installments.length,
      message: 'Payment plan created successfully'
    });

  } catch (error) {
    console.error('Error creating payment plan:', error);
    res.status(500).json({
      error: 'Failed to create payment plan',
      message: error.message
    });
  }
}

