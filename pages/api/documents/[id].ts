/**
 * Public Documents Viewing Page (Invoice + Contract Combined)
 * Allows customers to view their invoice and contract together
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
    return res.status(400).json({ error: 'Document ID is required' });
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

    // Fetch associated contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('invoice_id', invoice.id)
      .single();

    // Build line items HTML
    const lineItemsHtml = (invoice.line_items || [])
      .map((item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: left; color: #333;">
            ${item.description}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #333;">
            $${item.unit_price.toFixed(2)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #fcba00;">
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
        <title>${invoice.invoice_number} - Invoice & Contract</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
            line-height: 1.6;
          }
          .wrapper {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #fcba00 0%, #e6a800 100%);
            color: #000;
            padding: 40px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .controls {
            background: white;
            padding: 20px 40px;
            display: flex;
            gap: 10px;
            justify-content: center;
            border-bottom: 1px solid #e0e0e0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .controls button {
            background: #fcba00;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .controls button:hover {
            background: #e6a800;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .controls button.secondary {
            background: #f0f0f0;
            color: #333;
          }
          .controls button.secondary:hover {
            background: #e0e0e0;
          }
          .content {
            background: white;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .document-section {
            margin-bottom: 60px;
            padding-bottom: 40px;
            border-bottom: 3px solid #fcba00;
          }
          .document-section:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          .section-title {
            font-size: 24px;
            color: #fcba00;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .section-icon {
            font-size: 28px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-block h3 {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .info-block p {
            color: #333;
            margin: 4px 0;
          }
          .info-block strong {
            color: #fcba00;
          }
          .company-header {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #fcba00;
          }
          .company-info h2 {
            font-size: 20px;
            color: #fcba00;
            margin-bottom: 10px;
          }
          .company-info p {
            font-size: 14px;
            color: #666;
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          thead {
            background: #f8f9fa;
            border-top: 2px solid #fcba00;
            border-bottom: 2px solid #fcba00;
          }
          th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }
          .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals {
            width: 320px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }
          .totals-row.total {
            border-top: 2px solid #fcba00;
            border-bottom: 2px solid #fcba00;
            padding: 15px 0;
            font-weight: bold;
            font-size: 16px;
            color: #fcba00;
            margin: 10px 0;
          }
          .contract-preview {
            background: #f8f9fa;
            border: 2px solid #fcba00;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 20px;
          }
          .contract-preview h4 {
            color: #fcba00;
            margin-bottom: 15px;
            font-size: 16px;
          }
          .contract-preview p {
            color: #666;
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.6;
          }
          .contract-link-box {
            background: #fff3cd;
            border: 2px solid #fcba00;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .contract-link-box p {
            margin: 10px 0;
            font-size: 14px;
            color: #333;
          }
          .contract-link-box a {
            display: inline-block;
            background: #fcba00;
            color: #000;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 10px;
            transition: all 0.2s;
          }
          .contract-link-box a:hover {
            background: #e6a800;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-draft {
            background: #fff3cd;
            color: #856404;
          }
          .status-signed {
            background: #d4edda;
            color: #155724;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
          }
          @media print {
            body {
              background: white;
            }
            .controls,
            .footer {
              display: none;
            }
            .wrapper {
              padding: 0;
            }
          }
          @media (max-width: 768px) {
            .header {
              padding: 30px 20px;
            }
            .content {
              padding: 20px;
            }
            .info-grid {
              grid-template-columns: 1fr;
            }
            .company-header {
              grid-template-columns: 1fr;
            }
            table {
              font-size: 12px;
            }
            td, th {
              padding: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>📋 Your Event Documents</h1>
            <p>Invoice & Service Agreement for ${contact.first_name} ${contact.last_name}</p>
          </div>

          <div class="controls">
            <button onclick="window.print()">🖨️ Print All</button>
            <button class="secondary" onclick="document.getElementById('invoice').scrollIntoView({behavior:'smooth'})">Invoice</button>
            ${contract ? '<button class="secondary" onclick="document.getElementById(\'contract\').scrollIntoView({behavior:\'smooth\'})">Contract</button>' : ''}
            <button class="secondary" onclick="history.back()">← Back</button>
          </div>

          <div class="content">
            <!-- INVOICE SECTION -->
            <div id="invoice" class="document-section">
              <div class="section-title">
                <span class="section-icon">💰</span>
                Invoice & Pricing
              </div>

              <div class="company-header">
                <div>
                  <div class="company-info">
                    <h2>M10 DJ Company</h2>
                    <p>65 Stewart Rd, Eads, Tennessee 38028</p>
                    <p>📞 (901) 410-2020</p>
                    <p>📧 m10djcompany@gmail.com</p>
                  </div>
                </div>
                <div>
                  <div class="info-block">
                    <h3>Invoice Number</h3>
                    <p><strong>${invoice.invoice_number}</strong></p>
                  </div>
                  <div class="info-block" style="margin-top: 15px;">
                    <h3>Status</h3>
                    <p><span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
                  </div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-block">
                  <h3>📌 Billing To</h3>
                  <p><strong>${contact.first_name} ${contact.last_name}</strong></p>
                  <p>${contact.email_address || contact.primary_email || 'No email'}</p>
                  <p>${contact.phone || 'No phone'}</p>
                </div>
                <div class="info-block">
                  <h3>📅 Dates</h3>
                  <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-block">
                  <h3>🎉 Event Details</h3>
                  <p><strong>Type:</strong> ${contact.event_type || 'N/A'}</p>
                  ${contact.event_date ? `<p><strong>Date:</strong> ${new Date(contact.event_date).toLocaleDateString('en-US')}</p>` : ''}
                  ${contact.venue_name ? `<p><strong>Venue:</strong> ${contact.venue_name}</p>` : ''}
                  ${contact.guest_count ? `<p><strong>Guest Count:</strong> ${contact.guest_count}</p>` : ''}
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Service Description</th>
                    <th style="text-align: center; width: 80px;">Qty</th>
                    <th style="text-align: right; width: 120px;">Unit Price</th>
                    <th style="text-align: right; width: 120px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
              </table>

              <div class="totals-container">
                <div class="totals">
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
                <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #fcba00;">
                  <h4 style="margin: 0 0 10px 0; color: #333;">Additional Notes</h4>
                  <p style="margin: 0; color: #666;">${invoice.notes}</p>
                </div>
              ` : ''}
            </div>

            <!-- CONTRACT SECTION -->
            ${contract ? `
              <div id="contract" class="document-section">
                <div class="section-title">
                  <span class="section-icon">✍️</span>
                  Service Agreement & Contract
                </div>

                <div class="contract-link-box">
                  <p>📝 <strong>Please review and sign your service agreement</strong></p>
                  <p style="font-size: 13px; color: #666;">Click the button below to view and sign your contract electronically.</p>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-contract/${contract.signing_token}" target="_blank">
                    🔗 View & Sign Contract
                  </a>
                  <p style="font-size: 12px; color: #999; margin-top: 10px;">
                    This link expires on ${new Date(contract.signing_token_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div class="contract-preview">
                  <h4>Contract Summary</h4>
                  <p>
                    <strong>Total Agreement Amount:</strong> $${contract.total_amount.toFixed(2)}<br>
                    <strong>Deposit Required:</strong> $${contract.deposit_amount.toFixed(2)} (${contract.deposit_percentage}%)<br>
                    <strong>Remaining Balance:</strong> $${(contract.total_amount - contract.deposit_amount).toFixed(2)}<br>
                    <strong>Event Type:</strong> ${contract.event_type}<br>
                    <strong>Event Date:</strong> ${new Date(contract.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br>
                    <strong>Venue:</strong> ${contract.venue_name || 'TBD'}<br>
                    <strong>Status:</strong> <span class="status-badge status-${contract.status}">${contract.status.toUpperCase()}</span>
                  </p>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 6px; border-left: 4px solid #2196f3;">
                  <h4 style="margin: 0 0 10px 0; color: #1565c0;">Next Steps</h4>
                  <ol style="margin: 0; padding-left: 20px; color: #555;">
                    <li>Review your service agreement and pricing</li>
                    <li>Sign the contract electronically using the link above</li>
                    <li>Submit your ${contract.deposit_percentage}% deposit to secure your date</li>
                    <li>We'll confirm receipt and send you additional details</li>
                  </ol>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>
              Questions about your invoice or contract? Contact us at <strong>(901) 410-2020</strong> or <strong>m10djcompany@gmail.com</strong>
            </p>
            <p style="margin-top: 10px; opacity: 0.7;">
              Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

