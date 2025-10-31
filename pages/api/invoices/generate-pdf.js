/**
 * Generate Invoice PDF
 * Creates a professional PDF from invoice data
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID required' });
  }

  let browser;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice_summary')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Fetch line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
    }

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice, lineItems || []);

    // Launch browser and generate PDF
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdf.length);

    res.status(200).send(pdf);

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
}

function generateInvoiceHTML(invoice, lineItems) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#10b981';
      case 'overdue':
        return '#ef4444';
      case 'partial':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const lineItemsHTML = lineItems.map((item, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px 0; font-size: 14px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${item.description}</div>
        ${item.notes ? `<div style="font-size: 12px; color: #6b7280;">${item.notes}</div>` : ''}
      </td>
      <td style="padding: 16px 0; text-align: center; font-size: 14px; color: #374151;">${item.quantity}</td>
      <td style="padding: 16px 0; text-align: right; font-size: 14px; color: #374151;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 16px 0; text-align: right; font-size: 14px; font-weight: 600; color: #111827;">${formatCurrency(item.total_amount)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          padding: 0;
          line-height: 1.6;
        }
        .container {
          max-width: 100%;
        }
        .header {
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #fcba00;
        }
        .company-name {
          font-size: 32px;
          font-weight: 800;
          color: #000;
          margin-bottom: 4px;
          background: linear-gradient(135deg, #fcba00 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .company-info {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }
        .invoice-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .invoice-number {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: ${getStatusColor(invoice.invoice_status)};
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .info-block {
          flex: 1;
          padding-right: 30px;
        }
        .info-block:last-child {
          padding-right: 0;
        }
        .info-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .info-content {
          font-size: 14px;
          color: #374151;
        }
        .info-content strong {
          color: #111827;
          font-weight: 600;
        }
        .info-content p {
          margin: 4px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        thead {
          background: #f9fafb;
          border-top: 2px solid #e5e7eb;
          border-bottom: 2px solid #e5e7eb;
        }
        thead th {
          padding: 12px 0;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        thead th:first-child {
          text-align: left;
        }
        thead th:last-child {
          text-align: right;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          min-width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .totals-row.subtotal {
          color: #6b7280;
        }
        .totals-row.total {
          border-top: 2px solid #e5e7eb;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .totals-row.paid {
          color: #10b981;
          font-weight: 600;
        }
        .totals-row.balance {
          border-top: 2px solid #fcba00;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 20px;
          font-weight: 700;
          color: #f59e0b;
        }
        .notes {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #fcba00;
        }
        .notes-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }
        .notes-content {
          font-size: 14px;
          color: #374151;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        .footer-contact {
          margin-top: 12px;
          font-size: 13px;
          color: #374151;
        }
        .overdue-banner {
          background: #fee2e2;
          border: 2px solid #fca5a5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 30px;
          color: #991b1b;
        }
        .overdue-banner strong {
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-name">M10 DJ Company</div>
          <div class="company-info">
            Professional DJ Services • (901) 410-2020<br>
            djbenmurray@gmail.com • Memphis, TN
          </div>
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">
          <div>
            <div class="invoice-number">${invoice.invoice_number}</div>
            ${invoice.invoice_title ? `<div style="color: #6b7280; font-size: 16px; margin-top: 4px;">${invoice.invoice_title}</div>` : ''}
          </div>
          <div class="status-badge">${invoice.invoice_status.toUpperCase()}</div>
        </div>

        ${invoice.days_overdue > 0 ? `
          <div class="overdue-banner">
            <strong>⚠️ THIS INVOICE IS OVERDUE</strong>
            Payment was due ${invoice.days_overdue} days ago on ${formatDate(invoice.due_date)}
          </div>
        ` : ''}

        <!-- Info Sections -->
        <div class="info-section">
          <!-- Bill To -->
          <div class="info-block">
            <div class="info-title">Bill To</div>
            <div class="info-content">
              <p><strong>${invoice.first_name} ${invoice.last_name}</strong></p>
              <p>${invoice.email_address}</p>
              ${invoice.phone ? `<p>${invoice.phone}</p>` : ''}
              ${invoice.address ? `<p>${invoice.address}</p>` : ''}
              ${invoice.city && invoice.state ? `<p>${invoice.city}, ${invoice.state}</p>` : ''}
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="info-block">
            <div class="info-title">Invoice Details</div>
            <div class="info-content">
              <p><strong>Issue Date:</strong> ${formatDate(invoice.invoice_date)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
              ${invoice.event_date ? `<p><strong>Event Date:</strong> ${formatDate(invoice.event_date)}</p>` : ''}
              ${invoice.venue_name ? `<p><strong>Venue:</strong> ${invoice.venue_name}</p>` : ''}
              ${invoice.event_type ? `<p><strong>Event Type:</strong> ${invoice.event_type}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">DESCRIPTION</th>
              <th style="text-align: center;">QTY</th>
              <th style="text-align: right;">UNIT PRICE</th>
              <th style="text-align: right;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHTML}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <div class="totals-table">
            <div class="totals-row subtotal">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="totals-row subtotal">
              <span>Tax:</span>
              <span>${formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div class="totals-row total">
              <span>Total:</span>
              <span>${formatCurrency(invoice.total_amount)}</span>
            </div>
            ${invoice.amount_paid > 0 ? `
              <div class="totals-row paid">
                <span>Paid:</span>
                <span>${formatCurrency(invoice.amount_paid)}</span>
              </div>
            ` : ''}
            <div class="totals-row balance">
              <span>Balance Due:</span>
              <span>${formatCurrency(invoice.balance_due)}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
          <div class="notes">
            <div class="notes-title">Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <div>Thank you for your business!</div>
          <div class="footer-contact">
            Questions? Contact us at (901) 410-2020 or djbenmurray@gmail.com
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

