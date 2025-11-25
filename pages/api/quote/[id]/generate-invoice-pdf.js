/**
 * Generate Quote Invoice PDF with Payment Link and QR Code
 * Creates a PDF invoice for a quote with clickable payment link and scannable QR code
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Quote ID required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch lead/quote data
    const [leadResponse, quoteResponse] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('quote_selections')
        .select('*')
        .eq('lead_id', id)
        .single()
    ]);

    if (leadResponse.error || !leadResponse.data) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResponse.data;
    const quote = quoteResponse.data || {};

    // Generate payment URL
    const paymentUrl = `${siteUrl}/quote/${id}/payment`;

    // Generate QR code as data URL
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
      // Continue without QR code if generation fails
      qrCodeDataUrl = null;
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true
    });

    // Collect PDF in buffer
    const chunks = [];
    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
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
        generateQuoteInvoicePDF(doc, lead, quote, paymentUrl, qrCodeDataUrl);
      } catch (pdfError) {
        console.error('Error in generateQuoteInvoicePDF:', pdfError);
        reject(pdfError);
      }
      
      // Finalize PDF
      doc.end();
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${lead.first_name}-${lead.last_name}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send the buffer as binary
    return res.status(200).end(pdfBuffer, 'binary');

  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to generate PDF',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

function generateQuoteInvoicePDF(doc, lead, quote, paymentUrl, qrCodeDataUrl) {
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

  // Invoice Title
  doc
    .fontSize(24)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('INVOICE', 50, yPosition);

  yPosition += 40;

  // Two Column Section - Bill To & Invoice Details
  const leftCol = 50;
  const rightCol = 320;

  // Bill To
  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('BILL TO', leftCol, yPosition);

  yPosition += 15;

  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Customer', leftCol, yPosition);

  yPosition += 14;

  if (lead.email_address) {
    doc
      .font('Helvetica')
      .text(lead.email_address, leftCol, yPosition);
    yPosition += 14;
  }

  if (lead.phone) {
    doc.text(lead.phone, leftCol, yPosition);
    yPosition += 14;
  }

  // Invoice Details (right column)
  let rightYPos = yPosition - (lead.phone ? 28 : 14);

  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('INVOICE DETAILS', rightCol, rightYPos);

  rightYPos += 15;

  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Date:', rightCol, rightYPos);
  
  doc
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(formatDate(new Date().toISOString()), rightCol + 80, rightYPos);

  if (lead.event_date) {
    rightYPos += 14;
    doc
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Event Date:', rightCol, rightYPos);
    
    doc
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(formatDate(lead.event_date), rightCol + 80, rightYPos);
  }

  if (lead.venue_name) {
    rightYPos += 14;
    doc
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Venue:', rightCol, rightYPos);
    
    doc
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(lead.venue_name, rightCol + 80, rightYPos, { width: 165 });
  }

  yPosition += 60;

  // Line Items Section
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
  const amountCol = 450;

  doc
    .rect(50, tableTop, 495, 25)
    .fill('#f9fafb');

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('DESCRIPTION', descCol, tableTop + 8)
    .text('AMOUNT', amountCol, tableTop + 8);

  yPosition += 30;

  // Package/Service
  if (quote.package_name) {
    doc
      .strokeColor(lightGray)
      .lineWidth(1)
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .stroke();

    yPosition += 10;

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(quote.package_name, descCol, yPosition, { width: 380 });

    doc
      .font('Helvetica')
      .text(formatCurrency(quote.package_price || 0), amountCol, yPosition, { width: 95, align: 'right' });

    yPosition += 20;
  }

  // Add-ons
  const addons = quote.addons || quote.custom_addons || [];
  addons.forEach((addon) => {
    if (yPosition > 500) {
      doc.addPage();
      yPosition = 50;
    }

    doc
      .strokeColor(lightGray)
      .lineWidth(1)
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .stroke();

    yPosition += 10;

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(addon.name || 'Add-on', descCol, yPosition, { width: 380 });

    doc
      .text(formatCurrency(addon.price || 0), amountCol, yPosition, { width: 95, align: 'right' });

    yPosition += 20;
  });

  // Final line
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 20;

  // Totals Section
  const totalsX = 370;
  
  const subtotal = (quote.package_price || 0) + (addons.reduce((sum, addon) => sum + (addon.price || 0), 0));
  const discountAmount = quote.discount_value || 0;
  const discountType = quote.discount_type;
  
  let total = subtotal;
  if (discountType === 'percentage' && discountAmount > 0) {
    total = subtotal * (1 - discountAmount / 100);
  } else if (discountType === 'flat' && discountAmount > 0) {
    total = subtotal - discountAmount;
  } else {
    total = quote.total_price || subtotal;
  }

  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Subtotal:', totalsX, yPosition)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text(formatCurrency(subtotal), totalsX + 120, yPosition, { width: 55, align: 'right' });

  if (discountAmount > 0) {
    yPosition += 16;
    doc
      .font('Helvetica')
      .fillColor(mediumGray)
      .text(`Discount${discountType === 'percentage' ? ` (${discountAmount}%)` : ''}:`, totalsX, yPosition)
      .font('Helvetica-Bold')
      .fillColor('#ef4444')
      .text(`-${formatCurrency(discountType === 'percentage' ? subtotal * (discountAmount / 100) : discountAmount)}`, totalsX + 120, yPosition, { width: 55, align: 'right' });
  }

  yPosition += 20;

  // Total line
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(totalsX, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 12;

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text('Total:', totalsX, yPosition)
    .text(formatCurrency(total), totalsX + 120, yPosition, { width: 55, align: 'right' });

  yPosition += 30;

  // Payment Section with QR Code
  if (yPosition > 600) {
    doc.addPage();
    yPosition = 50;
  }

  // Payment section box
  doc
    .rect(50, yPosition, 495, 120)
    .fillAndStroke('#f0f9ff', brandGold)
    .lineWidth(2);

  yPosition += 15;

  doc
    .fontSize(14)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('PAY ONLINE', 60, yPosition);

  yPosition += 20;

  // Payment link (clickable)
  const linkYPos = yPosition;
  doc
    .fontSize(11)
    .fillColor('#2563eb')
    .font('Helvetica')
    .text('Click here to pay:', 60, yPosition);

  yPosition += 16;

  doc
    .fontSize(10)
    .fillColor('#1e40af')
    .font('Helvetica')
    .text(paymentUrl, 60, yPosition, { 
      width: 350,
      link: paymentUrl,
      underline: true
    });

  // QR Code on the right
  if (qrCodeDataUrl) {
    try {
      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      
      // Add QR code image
      doc.image(qrBuffer, 420, linkYPos - 5, { 
        width: 100,
        height: 100
      });

      // QR code label
      doc
        .fontSize(9)
        .fillColor(mediumGray)
        .font('Helvetica')
        .text('Scan to pay', 420, linkYPos + 100, { 
          width: 100,
          align: 'center'
        });
    } catch (imgError) {
      console.error('Error adding QR code image:', imgError);
    }
  }

  yPosition += 50;

  // Footer
  yPosition = 750;

  doc
    .strokeColor(lightGray)
    .lineWidth(2)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 15;

  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Thank you for your business!', 50, yPosition, { align: 'center', width: 495 });

  yPosition += 18;

  doc
    .fontSize(9)
    .text('Questions? Contact us at (901) 410-2020 or djbenmurray@gmail.com', 50, yPosition, { 
      align: 'center', 
      width: 495 
    });
}

export const config = {
  api: {
    responseLimit: '10mb',
  },
};

