/**
 * Invoice PDF Generator Utility
 * Generates PDF buffer for invoices (reusable for email attachments)
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';

/**
 * Generate PDF buffer for an invoice
 * @param {Object} invoice - Invoice object
 * @param {Object} supabaseAdmin - Supabase admin client
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateInvoicePDFBuffer(invoice, supabaseAdmin) {
  // Fetch line items
  const { data: lineItemsFromTable } = await supabaseAdmin
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('created_at', { ascending: true });

  let lineItems = lineItemsFromTable || [];
  
  // If no line items from table, check the line_items JSONB field
  if (lineItems.length === 0 && invoice.line_items) {
    try {
      const parsed = typeof invoice.line_items === 'string' 
        ? JSON.parse(invoice.line_items) 
        : invoice.line_items;
      
      if (Array.isArray(parsed)) {
        lineItems = parsed.map(item => ({
          description: item.description || item.name || 'Service',
          quantity: item.quantity || 1,
          rate: item.rate || item.unit_price || item.price || 0,
          total: item.total || item.total_amount || (item.rate || item.unit_price || item.price || 0) * (item.quantity || 1)
        }));
      }
    } catch (e) {
      console.error('Error parsing invoice.line_items JSONB:', e);
    }
  }

  // Generate payment token if doesn't exist
  let paymentToken = invoice.payment_token;
  if (!paymentToken) {
    const crypto = require('crypto');
    paymentToken = crypto.randomBytes(32).toString('hex');
    
    await supabaseAdmin
      .from('invoices')
      .update({ payment_token: paymentToken })
      .eq('id', invoice.id);
  }

  const paymentUrl = `${siteUrl}/pay/${paymentToken}`;

  // Generate QR code
  let qrCodeDataUrl = null;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (qrError) {
    console.error('Error generating QR code:', qrError);
  }

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true
  });

  // Collect PDF in buffer
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Wait for PDF to finish
  const pdfBuffer = await new Promise((resolve, reject) => {
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    doc.on('error', (err) => {
      console.error('PDFKit error:', err);
      reject(err);
    });
    
    // Generate PDF content
    try {
      generateInvoicePDF(doc, invoice, lineItems || [], paymentUrl, qrCodeDataUrl);
    } catch (pdfError) {
      console.error('Error in generateInvoicePDF:', pdfError);
      reject(pdfError);
    }
    
    // Finalize PDF
    doc.end();
  });

  return pdfBuffer;
}

/**
 * Generate invoice PDF content (internal function)
 */
function generateInvoicePDF(doc, invoice, lineItems, paymentUrl, qrCodeDataUrl) {
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

  // Colors
  const brandGold = '#fcba00';
  const darkGray = '#111827';
  const mediumGray = '#6b7280';
  const lightGray = '#e5e7eb';

  let yPosition = 50;

  // Header - Company Name
  doc
    .fontSize(28)
    .fillColor(brandGold)
    .font('Helvetica-Bold')
    .text('M10 DJ Company', 50, yPosition);
  
  yPosition += 35;

  // Company Info
  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Professional DJ Services • (901) 410-2020', 50, yPosition)
    .text('djbenmurray@gmail.com • Memphis, TN', 50, yPosition + 12);

  yPosition += 40;

  // Divider Line
  doc
    .strokeColor(brandGold)
    .lineWidth(3)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 25;

  // Invoice Number and Status
  doc
    .fontSize(24)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(invoice.invoice_number, 50, yPosition);

  // Status Badge
  const statusColors = {
    'paid': '#10b981',
    'overdue': '#ef4444',
    'partial': '#f59e0b',
    'sent': '#3b82f6',
    'viewed': '#3b82f6'
  };
  const statusColor = statusColors[invoice.invoice_status?.toLowerCase()] || mediumGray;

  doc
    .fontSize(12)
    .fillColor(statusColor)
    .font('Helvetica-Bold')
    .text(invoice.invoice_status?.toUpperCase() || 'DRAFT', 450, yPosition + 5, {
      width: 95,
      align: 'right'
    });

  yPosition += 40;

  // Invoice Title
  if (invoice.invoice_title) {
    doc
      .fontSize(16)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(invoice.invoice_title, 50, yPosition);
    yPosition += 25;
  }

  // Client Info Section
  yPosition += 10;
  doc
    .fontSize(12)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('Bill To:', 50, yPosition);
  
  yPosition += 18;
  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica')
    .text(invoice.contacts?.first_name && invoice.contacts?.last_name 
      ? `${invoice.contacts.first_name} ${invoice.contacts.last_name}`
      : invoice.contact_name || 'Client', 50, yPosition);
  
  if (invoice.contacts?.email_address) {
    yPosition += 15;
    doc
      .fontSize(10)
      .fillColor(mediumGray)
      .text(invoice.contacts.email_address, 50, yPosition);
  }

  yPosition += 30;

  // Invoice Details Table
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 15;

  // Table Header
  doc
    .fontSize(11)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('Description', 50, yPosition)
    .text('Qty', 400, yPosition)
    .text('Rate', 450, yPosition)
    .text('Amount', 500, yPosition, { align: 'right' });

  yPosition += 20;

  // Line Items
  lineItems.forEach((item) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.rate || item.unit_price || 0;
    const total = item.total || item.total_amount || (unitPrice * quantity);

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(item.description || 'Service', 50, yPosition, { width: 340 })
      .text(quantity.toString(), 400, yPosition)
      .text(formatCurrency(unitPrice), 450, yPosition)
      .text(formatCurrency(total), 500, yPosition, { align: 'right' });

    yPosition += 20;

    // Check if we need a new page
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
  });

  yPosition += 10;

  // Totals
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 15;

  const subtotal = invoice.subtotal || invoice.total_amount || 0;
  const tax = invoice.tax || 0;
  const total = invoice.total_amount || (subtotal + tax);

  // Totals section - ensure proper alignment with padding from right edge
  const totalsLabelX = 400;
  const totalsAmountX = 540; // End at 540 with 5px padding from right edge (545)
  const totalsAmountWidth = 70; // Sufficient width for currency values

  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica')
    .text('Subtotal:', totalsLabelX, yPosition)
    .text(formatCurrency(subtotal), totalsAmountX, yPosition, { align: 'right', width: totalsAmountWidth });

  if (tax > 0) {
    yPosition += 18;
    doc
      .text('Tax:', totalsLabelX, yPosition)
      .text(formatCurrency(tax), totalsAmountX, yPosition, { align: 'right', width: totalsAmountWidth });
  }

  yPosition += 20;
  doc
    .strokeColor(brandGold)
    .lineWidth(2)
    .moveTo(totalsLabelX, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 15;
  doc
    .fontSize(14)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('Total:', totalsLabelX, yPosition)
    .text(formatCurrency(total), totalsAmountX, yPosition, { align: 'right', width: totalsAmountWidth });

  yPosition += 40;

  // Payment Section
  if (invoice.invoice_status?.toLowerCase() !== 'paid') {
    doc
      .fontSize(12)
      .fillColor(mediumGray)
      .font('Helvetica-Bold')
      .text('Payment Information:', 50, yPosition);

    yPosition += 20;
    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica')
      .text('Pay online:', 50, yPosition)
      .text(paymentUrl, 50, yPosition + 15, { 
        width: 495,
        link: paymentUrl,
        underline: true
      });

    // QR Code
    if (qrCodeDataUrl) {
      try {
        const qrImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrImage, 400, yPosition - 10, { width: 100, height: 100 });
      } catch (imgError) {
        console.error('Error adding QR code to PDF:', imgError);
      }
    }
  }

  // Notes
  if (invoice.notes) {
    yPosition += 60;
    doc
      .fontSize(11)
      .fillColor(mediumGray)
      .font('Helvetica-Bold')
      .text('Notes:', 50, yPosition);
    
    yPosition += 15;
    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(invoice.notes, 50, yPosition, { width: 495 });
  }

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(
        `M10 DJ Company • (901) 410-2020 • djbenmurray@gmail.com`,
        50,
        750,
        { align: 'center', width: 495 }
      );
  }
}

module.exports = {
  generateInvoicePDFBuffer
};
