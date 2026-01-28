/**
 * Invoice-Stripe Sync Validation Cron Job
 * Runs periodically to ensure invoices stay in sync with Stripe payments
 * 
 * This job:
 * 1. Finds invoices with Stripe session IDs but missing payment records
 * 2. Verifies payment status in Stripe
 * 3. Creates missing payment records
 * 4. Updates invoice status if needed
 * 5. Alerts admin of any sync issues
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'djbenmurray@gmail.com';

export default async function handler(req, res) {
  // Verify cron secret for security
  if (CRON_SECRET && req.headers['authorization'] !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const issues = [];
    const fixed = [];
    const stats = {
      invoicesChecked: 0,
      invoicesFixed: 0,
      syncIssuesFound: 0,
      stripeErrors: 0
    };

    console.log('🔄 Starting invoice-Stripe sync validation...');

    // Check if specific invoice ID provided (for manual sync from admin page)
    const invoiceId = req.query?.invoice_id;

    // STEP 1: Find invoices with Stripe session IDs but missing payment records
    let query = supabase
      .from('invoices')
      .select('id, invoice_number, invoice_status, total_amount, amount_paid, balance_due, stripe_session_id, stripe_payment_intent, contact_id, organization_id, created_at')
      .or('stripe_session_id.not.is.null,stripe_payment_intent.not.is.null')
      .order('created_at', { ascending: false });

    if (invoiceId) {
      // If specific invoice ID provided, only check that one
      query = query.eq('id', invoiceId);
    } else {
      // Otherwise check last 100 invoices
      query = query.limit(100);
    }

    const { data: invoicesWithStripe, error: invoiceError } = await query;

    if (invoiceError) {
      console.error('Error fetching invoices:', invoiceError);
      return res.status(500).json({ error: 'Failed to fetch invoices', details: invoiceError.message });
    }

    stats.invoicesChecked = invoicesWithStripe?.length || 0;
    console.log(`📊 Checking ${stats.invoicesChecked} invoices with Stripe IDs...`);

    // STEP 2: For each invoice, verify payment records exist and match Stripe
    for (const invoice of invoicesWithStripe || []) {
      try {
        // Check if payment record exists
        const { data: payments, error: paymentError } = await supabase
          .from('payments')
          .select('id, total_amount, gratuity, payment_status, stripe_session_id, stripe_payment_intent')
          .eq('invoice_id', invoice.id)
          .eq('payment_status', 'Paid');

        const hasPaymentRecord = payments && payments.length > 0;
        const paymentTotal = payments?.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0) || 0;

        // If invoice has Stripe session but no payment record, verify with Stripe
        if ((invoice.stripe_session_id || invoice.stripe_payment_intent) && !hasPaymentRecord) {
          let stripePaymentStatus = null;
          let stripeAmount = null;
          let stripeSession = null;
          let stripePaymentIntent = null;

          try {
            // Retrieve from Stripe
            if (invoice.stripe_session_id) {
              stripeSession = await stripe.checkout.sessions.retrieve(invoice.stripe_session_id, {
                expand: ['payment_intent']
              });
              stripePaymentStatus = stripeSession.payment_status;
              stripeAmount = stripeSession.amount_total / 100;
              stripePaymentIntent = stripeSession.payment_intent?.id || stripeSession.payment_intent;
            } else if (invoice.stripe_payment_intent) {
              stripePaymentIntent = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent);
              stripePaymentStatus = stripePaymentIntent.status === 'succeeded' ? 'paid' : stripePaymentIntent.status;
              stripeAmount = stripePaymentIntent.amount / 100;
            }

            // If payment succeeded in Stripe but no payment record exists, create it
            if (stripePaymentStatus === 'paid' || stripePaymentStatus === 'succeeded') {
              const metadata = stripeSession?.metadata || stripePaymentIntent?.metadata || {};
              const gratuityAmount = metadata.gratuity_amount ? parseFloat(metadata.gratuity_amount) : 0;
              const basePaymentAmount = stripeAmount - gratuityAmount;

              // Create payment record
              const paymentRecord = {
                contact_id: invoice.contact_id,
                invoice_id: invoice.id,
                payment_name: 'Invoice Payment',
                total_amount: basePaymentAmount,
                gratuity: gratuityAmount,
                payment_status: 'Paid',
                payment_method: 'Credit Card',
                transaction_date: new Date().toISOString().split('T')[0],
                payment_notes: `Stripe ${invoice.stripe_session_id ? 'Session' : 'Payment Intent'}: ${invoice.stripe_session_id || invoice.stripe_payment_intent}`,
                organization_id: invoice.organization_id || null,
                stripe_session_id: invoice.stripe_session_id,
                stripe_payment_intent: stripePaymentIntent?.id || invoice.stripe_payment_intent,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const { error: insertError } = await supabase
                .from('payments')
                .insert(paymentRecord);

              if (insertError) {
                if (insertError.code !== '23505') { // Ignore duplicate key errors
                  issues.push({
                    invoice_id: invoice.id,
                    invoice_number: invoice.invoice_number,
                    issue: 'Failed to create payment record',
                    error: insertError.message,
                    stripe_status: stripePaymentStatus,
                    stripe_amount: stripeAmount
                  });
                  stats.syncIssuesFound++;
                }
              } else {
                fixed.push({
                  invoice_id: invoice.id,
                  invoice_number: invoice.invoice_number,
                  action: 'Created missing payment record',
                  amount: basePaymentAmount,
                  gratuity: gratuityAmount
                });
                stats.invoicesFixed++;
              }
            }
          } catch (stripeError) {
            console.error(`Error checking Stripe for invoice ${invoice.invoice_number}:`, stripeError);
            stats.stripeErrors++;
            issues.push({
              invoice_id: invoice.id,
              invoice_number: invoice.invoice_number,
              issue: 'Stripe API error',
              error: stripeError.message
            });
          }
        }

        // STEP 3: Verify invoice status matches payment reality
        if (hasPaymentRecord) {
          const invoiceTotal = parseFloat(invoice.total_amount) || 0;
          const shouldBePaid = paymentTotal >= invoiceTotal;
          const currentStatus = invoice.invoice_status;

          // If payment records show invoice should be paid but status is wrong
          if (shouldBePaid && currentStatus !== 'Paid') {
            // Update invoice status
            const { error: updateError } = await supabase
              .from('invoices')
              .update({
                invoice_status: 'Paid',
                amount_paid: paymentTotal,
                balance_due: 0,
                paid_date: invoice.paid_date || new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', invoice.id);

            if (updateError) {
              issues.push({
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                issue: 'Status mismatch - payment records show paid but invoice status is incorrect',
                current_status: currentStatus,
                payment_total: paymentTotal,
                invoice_total: invoiceTotal,
                error: updateError.message
              });
              stats.syncIssuesFound++;
            } else {
              fixed.push({
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                action: 'Updated invoice status to Paid',
                payment_total: paymentTotal
              });
              stats.invoicesFixed++;
            }
          }

          // If invoice is marked as Paid but has no payment records
          if (currentStatus === 'Paid' && !hasPaymentRecord && !invoice.stripe_session_id && !invoice.stripe_payment_intent) {
            issues.push({
              invoice_id: invoice.id,
              invoice_number: invoice.invoice_number,
              issue: 'Invoice marked as Paid but no payment records or Stripe IDs found',
              severity: 'high'
            });
            stats.syncIssuesFound++;
          }
        }

      } catch (error) {
        console.error(`Error processing invoice ${invoice.invoice_number}:`, error);
        issues.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          issue: 'Processing error',
          error: error.message
        });
        stats.syncIssuesFound++;
      }
    }

    // STEP 4: Send alert if issues found
    if (issues.length > 0 && ADMIN_EMAIL) {
      try {
        const { Resend } = require('resend');
        const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        
        if (resend) {
          await resend.emails.send({
            from: 'M10 DJ Company <hello@m10djcompany.com>',
            to: [ADMIN_EMAIL],
            subject: `⚠️ Invoice-Stripe Sync Issues Found (${issues.length})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #fff; margin: 0;">⚠️ Invoice-Stripe Sync Issues</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
                  <p><strong>Issues Found:</strong> ${issues.length}</p>
                  <p><strong>Invoices Fixed:</strong> ${fixed.length}</p>
                  <p><strong>Checked:</strong> ${stats.invoicesChecked} invoices</p>
                  
                  ${issues.length > 0 ? `
                    <h3>Issues:</h3>
                    <ul>
                      ${issues.map(issue => `
                        <li>
                          <strong>${issue.invoice_number}</strong>: ${issue.issue}
                          ${issue.error ? `<br><small>Error: ${issue.error}</small>` : ''}
                        </li>
                      `).join('')}
                    </ul>
                  ` : ''}
                  
                  <div style="margin-top: 20px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/admin/invoices" 
                       style="background: #f59e0b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      View Invoices Dashboard
                    </a>
                  </div>
                </div>
              </div>
            `
          });
        }
      } catch (emailError) {
        console.error('Failed to send sync alert email:', emailError);
      }
    }

    console.log('✅ Sync validation complete:', {
      checked: stats.invoicesChecked,
      fixed: stats.invoicesFixed,
      issues: stats.syncIssuesFound
    });

    return res.status(200).json({
      success: true,
      stats,
      fixed: fixed.length,
      issues: issues.length,
      details: {
        fixed: fixed.slice(0, 10), // Limit response size
        issues: issues.slice(0, 10)
      },
      message: `Checked ${stats.invoicesChecked} invoices. Fixed ${stats.invoicesFixed} issues. Found ${stats.syncIssuesFound} remaining issues.`
    });

  } catch (error) {
    console.error('❌ Error in invoice-Stripe sync validation:', error);
    return res.status(500).json({
      error: 'Failed to validate invoice-Stripe sync',
      message: error.message
    });
  }
}
