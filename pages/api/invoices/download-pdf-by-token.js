/**
 * Download Invoice PDF by Payment Token
 * Public endpoint for payment page - no authentication required
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice by payment token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('payment_token', token)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    // Verify token matches
    if (invoice.payment_token !== token) {
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    // Fetch contact details
    let contact = null;
    if (invoice.contact_id) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, phone')
        .eq('id', invoice.contact_id)
        .single();
      contact = contactData;
    }

    // Fetch line items from line_items JSONB column
    // Note: invoice_line_items table doesn't exist - invoices use line_items JSONB column
    let lineItems = [];
    if (invoice.line_items) {
      try {
        const parsed = typeof invoice.line_items === 'string' 
          ? JSON.parse(invoice.line_items) 
          : invoice.line_items;
        lineItems = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing invoice.line_items JSONB:', e);
        lineItems = [];
      }
    }

    // Map line items to consistent format
    lineItems = lineItems.map(item => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      rate: item.rate || item.unit_price || 0,
      total: item.total || item.amount || (item.rate || item.unit_price || 0) * (item.quantity || 1)
    }));

    // Generate payment URL
    const paymentUrl = `${siteUrl}/pay/${token}`;

    // Generate QR code
    let qrCodeDataUrl;
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
      qrCodeDataUrl = null;
    }

    // Prepare invoice data for PDF generation
    const invoiceForPDF = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_title: invoice.invoice_title || null,
      invoice_date: invoice.invoice_date || invoice.issue_date || new Date().toISOString(),
      due_date: invoice.due_date,
      event_date: invoice.event_date || null,
      venue_name: invoice.venue_name || null,
      venue_address: invoice.venue_address || null,
      subtotal: invoice.subtotal || 0,
      tax_amount: invoice.tax_amount || invoice.tax || 0,
      tax_rate: invoice.tax_rate || null,
      discount_amount: invoice.discount_amount || 0,
      total_amount: invoice.total_amount || 0,
      invoice_status: invoice.invoice_status || invoice.status || 'sent',
      notes: invoice.notes || null,
      contact: contact || {
        first_name: 'Client',
        last_name: '',
        email_address: null,
        phone: null
      }
    };

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
        generateInvoicePDF(doc, invoiceForPDF, lineItems, paymentUrl, qrCodeDataUrl);
      } catch (pdfError) {
        console.error('Error in generateInvoicePDF:', pdfError);
        reject(pdfError);
      }
      
      // Finalize PDF
      doc.end();
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[download-pdf-by-token] Unexpected error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error?.message || 'An unexpected error occurred'
    });
  }
}

function generateInvoicePDF(doc, invoice, lineItems, paymentUrl, qrCodeDataUrl) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
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
      .font('Helvetica-Bold')
      .text(invoice.invoice_title, 50, yPosition);
    yPosition += 25;
  }

  // Two Column Section - Bill To & Invoice Details
  const leftCol = 50;
  const rightCol = 320;
  const sectionStartY = yPosition;

  // Bill To Section
  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('BILL TO', leftCol, yPosition);

  yPosition += 15;

  const contactName = `${invoice.contact?.first_name || ''} ${invoice.contact?.last_name || ''}`.trim() || 'Customer';
  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(contactName, leftCol, yPosition);

  yPosition += 14;

  if (invoice.contact?.email_address) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(invoice.contact.email_address, leftCol, yPosition);
    yPosition += 12;
  }

  if (invoice.contact?.phone) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(invoice.contact.phone, leftCol, yPosition);
    yPosition += 12;
  }

  // Invoice Details (right column)
  let rightYPos = sectionStartY;

  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('INVOICE DETAILS', rightCol, rightYPos);

  rightYPos += 15;

  doc
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Date:', rightCol, rightYPos);
  
  doc
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(formatDate(invoice.invoice_date), rightCol + 80, rightYPos);

  rightYPos += 14;

  doc
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Due Date:', rightCol, rightYPos);
  
  doc
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(formatDate(invoice.due_date), rightCol + 80, rightYPos);

  if (invoice.event_date) {
    rightYPos += 14;
    doc
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Event Date:', rightCol, rightYPos);
    
    doc
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(formatDate(invoice.event_date), rightCol + 80, rightYPos);
  }

  if (invoice.venue_name) {
    rightYPos += 14;
    doc
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Venue:', rightCol, rightYPos);
    
    doc
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(invoice.venue_name, rightCol + 80, rightYPos, { width: 165 });
  }

  yPosition += 80;

  // Line Items Table
  yPosition += 10;
  
  doc
    .fontSize(10)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('LINE ITEMS', 50, yPosition);

  yPosition += 20;

  // Table Header
  const tableTop = yPosition;
  const descCol = 50;
  const qtyCol = 350;
  const priceCol = 420;
  const amountCol = 490;

  doc
    .rect(50, tableTop, 495, 25)
    .fill('#f9fafb');

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('DESCRIPTION', descCol, tableTop + 8)
    .text('QTY', qtyCol, tableTop + 8)
    .text('PRICE', priceCol, tableTop + 8)
    .text('AMOUNT', amountCol, tableTop + 8);

  yPosition += 30;

  // Table Rows
  if (lineItems.length === 0) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('No line items', descCol, yPosition);
    yPosition += 20;
  } else {
    lineItems.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const rowHeight = 25;
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      
      doc
        .rect(50, yPosition, 495, rowHeight)
        .fill(bgColor);

      doc
        .fontSize(9)
        .fillColor(darkGray)
        .font('Helvetica')
        .text(item.description || 'Line Item', descCol, yPosition + 8, {
          width: 280
        })
        .text(String(item.quantity || 1), qtyCol, yPosition + 8)
        .text(formatCurrency(item.rate || 0), priceCol, yPosition + 8)
        .text(formatCurrency(item.total || 0), amountCol, yPosition + 8);

      yPosition += rowHeight;
    });
  }

  yPosition += 20;

  // Totals Section
  const totalsStartY = yPosition;
  const totalsLabelX = 400; // Left position for labels
  const totalsAmountX = 535; // Right position for amounts
  const totalsAmountWidth = 65; // Width for right-aligned amounts

  if (invoice.subtotal && invoice.subtotal !== invoice.total_amount) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Subtotal:', totalsLabelX, yPosition);
    
    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(formatCurrency(invoice.subtotal), totalsAmountX, yPosition, { width: totalsAmountWidth, align: 'right' });
    
    yPosition += 15;
  }

  if (invoice.tax_rate && invoice.tax_rate > 0) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(`Tax (${invoice.tax_rate}%):`, totalsLabelX, yPosition);
    
    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(formatCurrency(invoice.tax_amount || 0), totalsAmountX, yPosition, { width: totalsAmountWidth, align: 'right' });
    
    yPosition += 15;
  }

  if (invoice.discount_amount && invoice.discount_amount > 0) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Discount:', totalsLabelX, yPosition);
    
    doc
      .fontSize(9)
      .fillColor('#10b981')
      .font('Helvetica-Bold')
      .text(`-${formatCurrency(invoice.discount_amount)}`, totalsAmountX, yPosition, { width: totalsAmountWidth, align: 'right' });
    
    yPosition += 15;
  }

  // Total Amount
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(totalsLabelX, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 10;

  // Total label on left, amount on right
  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('Total:', totalsLabelX, yPosition);
  
  doc
    .fontSize(16)
    .fillColor(brandGold)
    .font('Helvetica-Bold')
    .text(formatCurrency(invoice.total_amount || 0), totalsAmountX, yPosition, { width: totalsAmountWidth, align: 'right' });

  yPosition += 40;

  // Notes Section
  if (invoice.notes) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica-Bold')
      .text('NOTES', 50, yPosition);
    
    yPosition += 15;
    
    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(invoice.notes, 50, yPosition, {
        width: 495,
        align: 'left'
      });
    
    yPosition += 30;
  }

  // Payment Section with QR Code
  if (yPosition > 600) {
    doc.addPage();
    yPosition = 50;
  }

  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 20;

  doc
    .fontSize(10)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('PAYMENT', 50, yPosition);

  yPosition += 15;

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Pay online securely:', 50, yPosition);

  yPosition += 12;

  doc
    .fontSize(8)
    .fillColor(brandGold)
    .font('Helvetica')
    .text(paymentUrl, 50, yPosition, {
      width: 300,
      link: paymentUrl
    });

  // QR Code (if available)
  if (qrCodeDataUrl) {
    try {
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrCodeBuffer, 400, yPosition - 10, { width: 100, height: 100 });
    } catch (qrError) {
      console.error('Error adding QR code to PDF:', qrError);
    }
  }

  yPosition += 40;

  // Footer
  const footerY = 750;
  doc
    .fontSize(8)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Thank you for your business!', 50, footerY, {
      width: 495,
      align: 'center'
    });
}
