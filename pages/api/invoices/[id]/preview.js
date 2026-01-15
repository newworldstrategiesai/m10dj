import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { generatePaymentToken } from '@/utils/payment-link-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Preview the invoice email HTML
 * Returns the rendered HTML without sending
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: invoiceId } = req.query;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with contact details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email_address
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Validate contact
    if (!invoice.contacts || !invoice.contacts.email_address) {
      return res.status(400).json({ error: 'Contact email address is required' });
    }

    // Ensure invoice has payment token (generate if needed for preview)
    let paymentToken = invoice.payment_token;
    if (!paymentToken) {
      paymentToken = generatePaymentToken();
    }

    const contact = invoice.contacts;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
    const paymentLink = `${baseUrl}/pay/${paymentToken}`;
    const logoUrl = `${baseUrl}/m10-black-clear-png.png`;

    // Format line items for email
    const lineItems = invoice.line_items || [];
    const lineItemsHtml = lineItems.map(item => {
      const quantity = item.quantity || 1;
      const unitPrice = item.rate || item.unit_price || 0;
      const total = item.total || item.total_amount || (unitPrice * quantity);
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 500; color: #111827;">${item.description || 'Service'}</div>
            <div style="font-size: 14px; color: #6b7280;">${quantity} × $${unitPrice.toFixed(2)}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            $${total.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    // Generate email HTML (same as sendInvoiceWithPaymentLink)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Premium Header -->
          <div style="background: linear-gradient(135deg, #fcba00 0%, #f5a500 50%, #d97706 100%); padding: 25px 20px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 12px rgba(252, 186, 0, 0.2); position: relative; overflow: hidden;">
            <!-- Decorative elements (subtle) -->
            <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -20px; left: -20px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.06); border-radius: 50%;"></div>
            
            <!-- Logo -->
            <div style="position: relative; z-index: 1; margin-bottom: 12px;">
              <img src="${logoUrl}" alt="M10 DJ Company" style="max-width: 140px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div style="display: none; color: #000; font-size: 20px; font-weight: 700; letter-spacing: 1px;">M10 DJ COMPANY</div>
            </div>
            
            <!-- Invoice Badge -->
            <div style="position: relative; z-index: 1; display: inline-block; background: rgba(0, 0, 0, 0.15); padding: 6px 18px; border-radius: 16px;">
              <p style="margin: 0; color: #000; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Invoice</p>
            </div>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Greeting -->
            <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
              Hi ${contact.first_name || 'Client'}!
            </p>

            <p style="margin: 0 0 30px; font-size: 16px; color: #374151;">
              Thank you for choosing M10 DJ Company for your event! Here's your invoice:
            </p>

            <!-- Invoice Details -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${invoice.invoice_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Issue Date:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${new Date(invoice.issue_date || invoice.created_at || Date.now()).toLocaleDateString()}</td>
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
                      ${invoice.invoice_status === 'paid' || invoice.status === 'paid' ? 'PAID' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Line Items -->
            <div style="margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px; font-size: 18px; color: #111827;">Services</h2>
              <table style="width: 100%; border-collapse: collapse;">
                ${lineItemsHtml || '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #6b7280;">No line items</td></tr>'}
                <tr>
                  <td style="padding: 16px 12px 0; font-size: 14px; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 16px 12px 0; text-align: right; font-weight: 600;">$${(invoice.subtotal || invoice.total_amount || 0).toFixed(2)}</td>
                </tr>
                ${invoice.tax_amount && invoice.tax_amount > 0 ? `
                <tr>
                  <td style="padding: 8px 12px 0; font-size: 14px; color: #6b7280;">Tax:</td>
                  <td style="padding: 8px 12px 0; text-align: right; font-weight: 600;">$${invoice.tax_amount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 16px 12px 0; font-size: 18px; font-weight: bold; color: #111827;">Total:</td>
                  <td style="padding: 16px 12px 0; text-align: right; font-size: 24px; font-weight: bold; color: #fcba00;">$${(invoice.total_amount || 0).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${(invoice.invoice_status !== 'paid' && invoice.status !== 'paid') ? `
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

    res.status(200).json({
      success: true,
      html: emailHtml,
      subject: `Invoice ${invoice.invoice_number || 'N/A'} from M10 DJ Company`
    });
  } catch (error) {
    console.error('Error previewing invoice email:', error);
    res.status(500).json({ error: 'Failed to preview email' });
  }
}
