/**
 * Payment Link Helper
 * Generates secure payment links for invoices
 */

const crypto = require('crypto');

/**
 * Generate a secure payment token
 */
function generatePaymentToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate payment link for an invoice
 */
function generatePaymentLink(invoice, baseUrl) {
  const token = invoice.payment_token || generatePaymentToken();
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
  
  return {
    token,
    link: `${siteUrl}/pay/${token}`
  };
}

/**
 * Send invoice with payment link
 */
async function sendInvoiceWithPaymentLink(invoice, contact, supabase, resend) {
  try {
    // Generate payment link if doesn't exist
    let paymentToken = invoice.payment_token;
    if (!paymentToken) {
      paymentToken = generatePaymentToken();
      
      // Update invoice with payment token
      await supabase
        .from('invoices')
        .update({ payment_token: paymentToken })
        .eq('id', invoice.id);
    }

    const paymentLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/pay/${paymentToken}`;

    // Format line items for email
    const lineItemsHtml = (invoice.line_items || []).map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #111827;">${item.description}</div>
          <div style="font-size: 14px; color: #6b7280;">${item.quantity || 1} × $${(item.rate || 0).toFixed(2)}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          $${(item.total || 0).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #fcba00 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #000; font-size: 28px;">M10 DJ Company</h1>
            <p style="margin: 10px 0 0; color: #000; font-size: 16px; opacity: 0.9;">Invoice</p>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Greeting -->
            <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
              Hi ${contact.first_name}!
            </p>

            <p style="margin: 0 0 30px; font-size: 16px; color: #374151;">
              Thank you for choosing M10 DJ Company for your event! Here's your invoice:
            </p>

            <!-- Invoice Details -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Issue Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()}</td>
                </tr>
                ${invoice.due_date ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${new Date(invoice.due_date).toLocaleDateString()}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                      ${invoice.status === 'paid' ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Line Items -->
            <div style="margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px; font-size: 18px; color: #111827;">Services</h2>
              <table style="width: 100%; border-collapse: collapse;">
                ${lineItemsHtml}
                <tr>
                  <td style="padding: 16px 12px 0; font-size: 14px; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 16px 12px 0; text-align: right; font-weight: 600;">$${(invoice.subtotal || invoice.total_amount || 0).toFixed(2)}</td>
                </tr>
                ${invoice.tax > 0 ? `
                <tr>
                  <td style="padding: 8px 12px 0; font-size: 14px; color: #6b7280;">Tax:</td>
                  <td style="padding: 8px 12px 0; text-align: right; font-weight: 600;">$${invoice.tax.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 16px 12px 0; font-size: 18px; font-weight: bold; color: #111827;">Total:</td>
                  <td style="padding: 16px 12px 0; text-align: right; font-size: 24px; font-weight: bold; color: #fcba00;">$${(invoice.total_amount || 0).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${invoice.status !== 'paid' ? `
            <!-- Payment Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${paymentLink}" style="display: inline-block; background: #fcba00; color: #000; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                💳 Pay Invoice Now
              </a>
            </div>

            <!-- Payment Link -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e40af;">Payment Link:</p>
              <p style="margin: 0; font-size: 12px; color: #3b82f6; word-break: break-all;">
                <a href="${paymentLink}" style="color: #3b82f6;">${paymentLink}</a>
              </p>
            </div>
            ` : `
            <!-- Paid Status -->
            <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #166534;">✅ This invoice has been paid</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: #15803d;">Thank you for your payment!</p>
            </div>
            `}

            ${invoice.notes ? `
            <!-- Notes -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">Notes:</p>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">${invoice.notes}</p>
            </div>
            ` : ''}

            <!-- Contact Info -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">Questions? Contact us:</p>
              <p style="margin: 0 0 5px; font-size: 14px; color: #374151;">
                📞 <a href="tel:9014102020" style="color: #fcba00; text-decoration: none;">(901) 410-2020</a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #374151;">
                ✉️ <a href="mailto:djbenmurray@gmail.com" style="color: #fcba00; text-decoration: none;">djbenmurray@gmail.com</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0;">Looking forward to making your event amazing!</p>
              <p style="margin: 10px 0 0;">Best, Ben Murray | M10 DJ Company</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    if (resend) {
      await resend.emails.send({
        from: 'M10 DJ Company <noreply@m10djcompany.com>',
        to: contact.email_address,
        subject: `Invoice ${invoice.invoice_number} from M10 DJ Company`,
        html: emailHtml
      });
    }

    console.log(`✅ Invoice email sent with payment link: ${paymentLink}`);

    return {
      success: true,
      paymentLink,
      paymentToken
    };

  } catch (error) {
    console.error('Error sending invoice with payment link:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generatePaymentToken,
  generatePaymentLink,
  sendInvoiceWithPaymentLink
};

