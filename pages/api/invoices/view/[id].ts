/**
 * Public Invoice Viewing Page
 * Allows customers to view their invoice without authentication
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  try {
    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', invoice.contact_id)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Build line items HTML
    const lineItemsHtml = (invoice.line_items || [])
      .map((item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">
            ${item.description}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            $${item.unit_price.toFixed(2)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
            $${item.total.toFixed(2)}
          </td>
        </tr>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #fcba00;
            padding-bottom: 20px;
          }
          .company-info h1 {
            margin: 0;
            color: #fcba00;
            font-size: 28px;
          }
          .company-info p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h2 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .invoice-info p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .invoice-meta h3 {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            letter-spacing: 1px;
          }
          .invoice-meta p {
            margin: 5px 0;
            color: #333;
          }
          .invoice-meta strong {
            display: block;
            margin-top: 10px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #fcba00;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .totals-box {
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .totals-row.total {
            border-bottom: 2px solid #fcba00;
            padding: 15px 0;
            font-weight: bold;
            font-size: 18px;
            color: #fcba00;
          }
          .notes {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 40px;
          }
          .notes h3 {
            margin-top: 0;
            color: #333;
          }
          .notes p {
            margin: 0;
            color: #666;
            line-height: 1.6;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
          }
          .print-button {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-button button {
            background: #fcba00;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .print-button button:hover {
            background: #e6a800;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 0;
            }
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="print-button">
            <button onclick="window.print()">🖨️ Print Invoice</button>
          </div>

          <div class="header">
            <div class="company-info">
              <h1>M10 DJ Company</h1>
              <p>65 Stewart Rd, Eads, Tennessee 38028</p>
              <p>📞 (901) 410-2020</p>
              <p>📧 m10djcompany@gmail.com</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>${invoice.invoice_number}</strong></p>
              <p>Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <p>Due: ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <p style="color: ${invoice.status === 'draft' ? '#ff9800' : '#4caf50'}; margin-top: 10px;">
                Status: <strong>${invoice.status.toUpperCase()}</strong>
              </p>
            </div>
          </div>

          <div class="invoice-meta">
            <div>
              <h3>Bill To</h3>
              <strong>${contact.first_name} ${contact.last_name}</strong>
              <p>${contact.email_address || contact.primary_email || 'No email'}</p>
              <p>${contact.phone || 'No phone'}</p>
              ${contact.event_name ? `<p><strong>Event:</strong> ${contact.event_name}</p>` : ''}
              ${contact.event_date ? `<p><strong>Event Date:</strong> ${new Date(contact.event_date).toLocaleDateString('en-US')}</p>` : ''}
            </div>
            <div>
              <h3>Event Details</h3>
              <p><strong>Event Type:</strong> ${contact.event_type || 'N/A'}</p>
              ${contact.venue_name ? `<p><strong>Venue:</strong> ${contact.venue_name}</p>` : ''}
              ${contact.guest_count ? `<p><strong>Guests:</strong> ${contact.guest_count}</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>$${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Tax:</span>
                <span>$${invoice.tax.toFixed(2)}</span>
              </div>
              <div class="totals-row total">
                <span>Total Due:</span>
                <span>$${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
            <div class="notes">
              <h3>Notes</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>This invoice was generated on ${new Date(invoice.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}.</p>
            <p>Thank you for your business! Questions? Contact us at (901) 410-2020 or m10djcompany@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
}

