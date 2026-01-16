// Preview route for invoice emails
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { generatePaymentToken } from '@/utils/payment-link-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate context-aware footer message for invoice emails
 */
function generateInvoiceFooterMessage(invoice, contact = null) {
  // Check if event has already happened
  const eventDate = invoice.event_date || contact?.event_date || null;
  const isPastEvent = eventDate ? new Date(eventDate) < new Date() : false;
  
  // Check if this is equipment rental
  const isEquipmentRental = (() => {
    // Check invoice title
    const title = (invoice.invoice_title || '').toLowerCase();
    if (title.includes('rental') || title.includes('equipment')) {
      return true;
    }
    
    // Check line items for rental keywords
    const lineItems = invoice.line_items || [];
    const rentalKeywords = ['rental', 'rent', 'equipment', 'speaker', 'sound system', 'lighting'];
    const hasRentalItems = lineItems.some(item => {
      const description = (item.description || '').toLowerCase();
      return rentalKeywords.some(keyword => description.includes(keyword));
    });
    
    // If it's equipment rental and no DJ service keywords, it's likely rental-only
    const djServiceKeywords = ['dj', 'mc', 'emcee', 'music', 'entertainment', 'coordination'];
    const hasDjServices = lineItems.some(item => {
      const description = (item.description || '').toLowerCase();
      return djServiceKeywords.some(keyword => description.includes(keyword));
    });
    
    return hasRentalItems && !hasDjServices;
  })();
  
  // Generate appropriate message based on context
  if (isPastEvent && isEquipmentRental) {
    return 'Thank you for your business!';
  } else if (isPastEvent) {
    return 'Thank you for choosing M10 DJ Company!';
  } else if (isEquipmentRental) {
    return 'Looking forward to providing your equipment!';
  } else {
    return 'Looking forward to making your event amazing!';
  }
}

/**
 * Preview the invoice email HTML
 * Returns the rendered HTML without sending
 * 
 * Route: POST /api/invoices/[id]/preview
 * 
 * This route is used by the InvoiceEmailActions component to preview
 * invoice emails before sending them to clients.
 */
export default async function handler(req, res) {
  // CRITICAL: Always set JSON content type first to prevent HTML 404 responses
  // This must be done BEFORE any async operations to ensure we always return JSON
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.error('[Invoice Preview API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables before proceeding
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Invoice Preview API] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey
    });
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Missing required environment variables'
    });
  }

  // Require admin authentication with better error handling
  let user;
  try {
    user = await requireAdmin(req, res);
    if (!user) {
      if (!res.headersSent) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return;
    }
  } catch (authError) {
    // requireAdmin throws errors, so catching here means auth failed
    if (res.headersSent) {
      // Headers already sent, can't send response
      return;
    }
    console.error('[Invoice Preview API] Auth error:', {
      message: authError?.message,
      name: authError?.name,
      stack: authError?.stack?.substring(0, 200)
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }

  const { id: invoiceId } = req.query;

  if (!invoiceId) {
    console.error('[Invoice Preview API] Missing invoice ID');
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  // Validate invoiceId is a string (not an array)
  const invoiceIdString = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;
  
  if (!invoiceIdString || typeof invoiceIdString !== 'string') {
    console.error('[Invoice Preview API] Invalid invoice ID format:', invoiceId);
    return res.status(400).json({ error: 'Invalid invoice ID format' });
  }

  console.log('[Invoice Preview API] Processing preview for invoice:', invoiceIdString);

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
      .eq('id', invoiceIdString)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Use invoice_email_address if present, otherwise use contact email
    const invoiceEmail = invoice.invoice_email_address || invoice.contacts?.email_address;
    
    // Allow preview even without email (use placeholder)
    const contact = invoice.contacts || {
      first_name: 'Client',
      last_name: '',
      email_address: null
    };
    
    // Override contact email with invoice email if present
    if (invoiceEmail) {
      contact.email_address = invoiceEmail;
    }
    
    // Fetch full contact details including event_date if not already loaded
    let fullContact = contact;
    if (contact.id && !contact.event_date) {
      const { data: contactData } = await supabaseAdmin
        .from('contacts')
        .select('event_date')
        .eq('id', contact.id)
        .single();
      if (contactData) {
        fullContact = { ...contact, event_date: contactData.event_date };
      }
    }

    // Ensure invoice has payment token (generate if needed for preview)
    let paymentToken = invoice.payment_token;
    if (!paymentToken) {
      paymentToken = generatePaymentToken();
    }

    // Return special code if email is missing (so component can prompt admin)
    const hasEmail = !!invoiceEmail;
    const currentEmail = invoiceEmail || '';
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
          <!-- Compact Premium Header -->
          <div style="background: linear-gradient(135deg, #fcba00 0%, #f5a500 50%, #d97706 100%); padding: 16px 20px; text-align: center; border-radius: 8px 8px 0 0; box-shadow: 0 2px 8px rgba(252, 186, 0, 0.15);">
            <!-- Logo and Badge in one line -->
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="text-align: center; vertical-align: middle;">
                  <img src="${logoUrl}" alt="M10 DJ Company" style="max-width: 100px; height: auto; display: inline-block; vertical-align: middle; margin-right: 12px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
                  <div style="display: none; color: #000; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; vertical-align: middle;">M10</div>
                  <span style="display: inline-block; background: rgba(0, 0, 0, 0.12); padding: 4px 12px; border-radius: 12px; vertical-align: middle;">
                    <span style="color: #000; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Invoice</span>
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 30px 25px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Greeting -->
            <p style="margin: 0 0 16px; font-size: 16px; color: #374151;">
              Hi ${contact.first_name || 'Client'}!
            </p>

            <p style="margin: 0 0 24px; font-size: 16px; color: #374151;">
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
              <p style="margin: 0;">${generateInvoiceFooterMessage(invoice, fullContact)}</p>
              <p style="margin: 10px 0 0;">Best, Ben Murray | M10 DJ Company</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('[Invoice Preview API] Successfully generated preview for invoice:', invoiceIdString);
    
    // Ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      html: emailHtml,
      subject: `Invoice ${invoice.invoice_number || 'N/A'} from M10 DJ Company`,
      hasEmail: !!hasEmail,
      email: invoiceEmail || '',
      contactId: invoice.contact_id || invoice.contacts?.id
    });
  } catch (error) {
    console.error('[Invoice Preview API] Error previewing invoice email:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack?.substring(0, 500)
    });
    const errorMessage = error instanceof Error ? error.message : 'Failed to preview email';
    
    // Ensure JSON response even on error - CRITICAL to prevent HTML 404
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        error: 'Failed to preview email',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    } else {
      // Headers already sent, log but can't send response
      console.error('[Invoice Preview API] Headers already sent, cannot send error response');
    }
  }
}
