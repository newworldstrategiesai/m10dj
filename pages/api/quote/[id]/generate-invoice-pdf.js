/**
 * Generate Quote Invoice PDF with Payment Link and QR Code
 * Creates a PDF invoice for a quote with clickable payment link and scannable QR code
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

    // Parse addons if it's a JSON string
    if (quote.addons && typeof quote.addons === 'string') {
      try {
        quote.addons = JSON.parse(quote.addons);
      } catch (e) {
        console.error('Error parsing addons:', e);
        quote.addons = [];
      }
    }
    if (quote.custom_addons && typeof quote.custom_addons === 'string') {
      try {
        quote.custom_addons = JSON.parse(quote.custom_addons);
      } catch (e) {
        console.error('Error parsing custom_addons:', e);
        quote.custom_addons = [];
      }
    }

    // Debug: Log quote structure
    console.log('Quote data:', {
      hasAddons: !!quote.addons,
      hasCustomAddons: !!quote.custom_addons,
      addonsType: typeof quote.addons,
      addonsValue: quote.addons,
      customAddonsType: typeof quote.custom_addons,
      customAddonsValue: quote.custom_addons
    });

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

  // Header - Company Logo
  let logoLoaded = false;
  const logoHeight = 50;
  const logoWidth = 80;
  const logoY = yPosition;
  
  // Calculate text block dimensions for alignment
  const companyNameFontSize = 14;
  const contactFontSize = 8;
  const spacingAfterName = 4;
  const spacingBetweenContactLines = 2;
  
  // Approximate text heights (font size * 1.2 is a good approximation for line height)
  const companyNameHeight = companyNameFontSize * 1.2;
  const contactLineHeight = contactFontSize * 1.2;
  const totalTextHeight = companyNameHeight + spacingAfterName + contactLineHeight + spacingBetweenContactLines + contactLineHeight;
  
  // Align logo and text block - try top alignment first, then adjust if needed
  // For better visual alignment, align the logo's visual center with the text block's visual center
  const logoYAdjusted = logoY;
  const textBlockStartY = logoY + 2; // Slight offset to account for text baseline vs logo top
  
  try {
    // Try multiple possible paths for the logo
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'logo-static.jpg'),
      path.join(process.cwd(), 'logo-static.jpg'),
      path.join(__dirname, '..', '..', '..', 'public', 'logo-static.jpg')
    ];
    
    let logoPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        logoPath = testPath;
        break;
      }
    }
    
    if (logoPath) {
      // Add logo image on the left, vertically centered with text block
      doc.image(logoPath, 50, logoYAdjusted, { 
        width: logoWidth,
        fit: [logoWidth, logoHeight]
      });
      logoLoaded = true;
    }
  } catch (logoError) {
    console.error('Error loading logo:', logoError);
  }

  // Company Name - positioned to the right of the logo, aligned with text block
  doc
    .fontSize(companyNameFontSize)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('M10 DJ Company', 50 + logoWidth + 10, textBlockStartY);
  
  // Company Info - positioned below the company name
  let textY = textBlockStartY + companyNameHeight + spacingAfterName;

  doc
    .fontSize(contactFontSize)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('(901) 410-2020 • djbenmurray@gmail.com', 50 + logoWidth + 10, textY);
  
  textY += contactLineHeight + spacingBetweenContactLines;
  
  doc
    .fontSize(contactFontSize)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Memphis, TN', 50 + logoWidth + 10, textY);

  // Position after header - use the bottom of whichever is lower (logo or text)
  const logoBottomY = logoYAdjusted + logoHeight;
  const textBottomY = textY + contactLineHeight;
  yPosition = Math.max(logoBottomY, textBottomY) + 20;

  // Divider Line
  doc
    .strokeColor(brandGold)
    .lineWidth(3)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 20;

  // Invoice Title
  doc
    .fontSize(28)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('INVOICE', 50, yPosition);

  yPosition += 35;

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

  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Customer', leftCol, yPosition);

  yPosition += 14;

  if (lead.email_address) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(lead.email_address, leftCol, yPosition);
    yPosition += 12;
  }

  if (lead.phone) {
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(lead.phone, leftCol, yPosition);
    yPosition += 12;
  }

  // Invoice Details (right column) - align with Bill To
  let rightYPos = sectionStartY;

  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica-Bold')
    .text('INVOICE DETAILS', rightCol, rightYPos);

  rightYPos += 15;

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Date:', rightCol, rightYPos);
  
  doc
    .fontSize(9)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text(formatDate(new Date().toISOString()), rightCol + 60, rightYPos);

  if (lead.event_date) {
    rightYPos += 13;
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Event Date:', rightCol, rightYPos);
    
    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(formatDate(lead.event_date), rightCol + 60, rightYPos);
  }

  if (lead.venue_name) {
    rightYPos += 13;
    doc
      .fontSize(9)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Venue:', rightCol, rightYPos);
    
    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(lead.venue_name, rightCol + 60, rightYPos, { width: 165 });
    
    // Add venue address if available
    if (lead.venue_address) {
      rightYPos += 11;
      doc
        .fontSize(8)
        .fillColor(mediumGray)
        .font('Helvetica')
        .text(lead.venue_address, rightCol + 60, rightYPos, { width: 165 });
    }
  }

  // Use the maximum Y position from both columns - reduced spacing
  yPosition = Math.max(yPosition, rightYPos) + 15;

  // Line Items Section
  doc
    .fontSize(11)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('LINE ITEMS', 50, yPosition);

  yPosition += 15;

  // Table Header
  const tableTop = yPosition;
  const descCol = 50;
  const amountCol = 450;

  // Header background
  doc
    .rect(50, tableTop, 495, 22)
    .fill('#f3f4f6');

  // Header border
  doc
    .rect(50, tableTop, 495, 22)
    .stroke(brandGold)
    .lineWidth(2);

  doc
    .fontSize(9)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('DESCRIPTION', descCol + 10, tableTop + 7)
    .text('AMOUNT', amountCol, tableTop + 7);

  yPosition += 25;

  // Package/Service
  if (quote.package_name) {
    doc
      .strokeColor(lightGray)
      .lineWidth(0.5)
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .stroke();

    yPosition += 8;

    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(quote.package_name, descCol + 10, yPosition, { width: 380 });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(formatCurrency(quote.package_price || 0), amountCol, yPosition, { width: 95, align: 'right' });

    yPosition += 15;
  }

  // Add-ons - handle both addons and custom_addons
  let addons = [];
  if (quote.addons) {
    addons = Array.isArray(quote.addons) ? quote.addons : [];
  } else if (quote.custom_addons) {
    addons = Array.isArray(quote.custom_addons) ? quote.custom_addons : [];
  }
  
  console.log('Processing addons:', {
    addonsCount: addons.length,
    addons: addons
  });
  
  addons.forEach((addon) => {
    doc
      .strokeColor(lightGray)
      .lineWidth(0.5)
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .stroke();

    yPosition += 8;

    doc
      .fontSize(9)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(addon.name || 'Add-on', descCol + 10, yPosition, { width: 380 });

    doc
      .fontSize(9)
      .text(formatCurrency(addon.price || 0), amountCol, yPosition, { width: 95, align: 'right' });

    yPosition += 15;
  });

  // Final line
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 12;

  // Totals Section - Right aligned
  const totalsX = 350;
  const totalsWidth = 195;
  
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

  // Totals box background
  doc
    .rect(totalsX, yPosition - 5, totalsWidth, discountAmount > 0 ? 60 : 45)
    .fill('#f9fafb')
    .stroke(lightGray)
    .lineWidth(1);

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Subtotal:', totalsX + 10, yPosition)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text(formatCurrency(subtotal), totalsX + 10, yPosition, { width: totalsWidth - 20, align: 'right' });

  if (discountAmount > 0) {
    yPosition += 12;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(mediumGray)
      .text(`Discount${discountType === 'percentage' ? ` (${discountAmount}%)` : ''}:`, totalsX + 10, yPosition)
      .font('Helvetica-Bold')
      .fillColor('#dc2626')
      .text(`-${formatCurrency(discountType === 'percentage' ? subtotal * (discountAmount / 100) : discountAmount)}`, totalsX + 10, yPosition, { width: totalsWidth - 20, align: 'right' });
  }

  yPosition += 12;

  // Total line
  doc
    .strokeColor(brandGold)
    .lineWidth(2)
    .moveTo(totalsX + 10, yPosition)
    .lineTo(totalsX + totalsWidth - 10, yPosition)
    .stroke();

  yPosition += 10;

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text('Total:', totalsX + 10, yPosition)
    .text(formatCurrency(total), totalsX + 10, yPosition, { width: totalsWidth - 20, align: 'right' });

  yPosition += 20;

  // Payment section - Improved design with better spacing and visual hierarchy
  const paymentBoxStartY = yPosition;
  const paymentBoxHeight = 120;
  const paymentBoxPadding = 20;
  const leftColX = 50 + paymentBoxPadding;
  const rightColX = 380; // Start of right column
  
  // Payment box with improved styling - rounded corners effect with background
  // Main box background
  doc
    .rect(50, paymentBoxStartY, 495, paymentBoxHeight)
    .fill('#f0f9ff');
  
  // Top border accent
  doc
    .rect(50, paymentBoxStartY, 495, 4)
    .fill(brandGold);
  
  // Bottom border
  doc
    .rect(50, paymentBoxStartY + paymentBoxHeight - 4, 495, 4)
    .fill(brandGold);
  
  // Left border accent
  doc
    .rect(50, paymentBoxStartY, 4, paymentBoxHeight)
    .fill(brandGold);
  
  // Right border accent
  doc
    .rect(50 + 495 - 4, paymentBoxStartY, 4, paymentBoxHeight)
    .fill(brandGold);

  // Reset yPosition for content inside the box
  let paymentContentY = paymentBoxStartY + paymentBoxPadding;

  // Left side: Payment instructions with better hierarchy
  doc
    .fontSize(16)
    .fillColor(darkGray)
    .font('Helvetica-Bold')
    .text('PAY ONLINE', leftColX, paymentContentY);

  paymentContentY += 22;

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Click here to pay:', leftColX, paymentContentY);

  paymentContentY += 12;

  // Clickable payment link with better styling
  const displayText = 'Pay Online';
  doc
    .fontSize(11)
    .fillColor('#2563eb')
    .font('Helvetica-Bold')
    .text(displayText, leftColX, paymentContentY, { 
      link: paymentUrl,
      underline: true
    });
  
  // Full URL below in smaller text for reference - ensure it stays on one line
  paymentContentY += 14;
  // Calculate font size to fit URL on one line - start larger and adjust if needed
  let urlFontSize = 9;
  doc.font('Helvetica');
  let urlWidth = doc.widthOfString(paymentUrl, { fontSize: urlFontSize });
  const maxUrlWidth = 320; // Max width available in left column
  
  // Try to increase font size first if there's room
  let testSize = 10;
  let testWidth = doc.widthOfString(paymentUrl, { fontSize: testSize });
  if (testWidth <= maxUrlWidth) {
    urlFontSize = testSize;
    urlWidth = testWidth;
  } else {
    // Reduce font size until URL fits on one line
    while (urlWidth > maxUrlWidth && urlFontSize > 6) {
      urlFontSize -= 0.5;
      urlWidth = doc.widthOfString(paymentUrl, { fontSize: urlFontSize });
    }
  }
  
  doc
    .fontSize(urlFontSize)
    .fillColor(mediumGray)
    .text(paymentUrl, leftColX, paymentContentY, { 
      width: maxUrlWidth + 50, // Add buffer to prevent wrapping
      link: null
    });

  // Right side: QR Code with better positioning
  if (qrCodeDataUrl) {
    try {
      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      
      // Position QR code on the right side, centered vertically in the box
      const qrCodeSize = 100;
      const qrCodeX = rightColX;
      
      // Calculate QR code position - center it vertically in the payment box
      const boxCenterY = paymentBoxStartY + (paymentBoxHeight / 2);
      const qrCodeY = boxCenterY - (qrCodeSize / 2); // Center the QR code vertically
      
      // Ensure QR code doesn't go outside the box boundaries
      const minQRY = paymentBoxStartY + 10; // Minimum Y with padding
      const maxQRY = paymentBoxStartY + paymentBoxHeight - qrCodeSize - 10;
      const finalQRY = Math.max(minQRY, Math.min(qrCodeY, maxQRY));
      
      // Add white background behind QR code for better contrast (within box bounds)
      const bgPadding = 5;
      const bgX = qrCodeX - bgPadding;
      const bgY = finalQRY - bgPadding;
      const bgSize = qrCodeSize + (bgPadding * 2);
      
      // Ensure background doesn't extend outside box
      if (bgY >= paymentBoxStartY && bgY + bgSize <= paymentBoxStartY + paymentBoxHeight) {
        doc
          .rect(bgX, bgY, bgSize, bgSize)
          .fill('#ffffff')
          .stroke(lightGray)
          .lineWidth(1);
      }
      
      // Add QR code image
      doc.image(qrBuffer, qrCodeX, finalQRY, { 
        width: qrCodeSize,
        height: qrCodeSize
      });

      // "Scan to pay" text removed per user request
    } catch (imgError) {
      console.error('Error adding QR code image:', imgError);
    }
  }

  // Footer - positioned right after payment box
  // Calculate footer position based on payment box end
  const footerY = paymentBoxStartY + paymentBoxHeight + 20;

  doc
    .strokeColor(lightGray)
    .lineWidth(2)
    .moveTo(50, footerY)
    .lineTo(545, footerY)
    .stroke();

  let footerTextY = footerY + 12;

  doc
    .fontSize(9)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Thank you for your business!', 50, footerTextY, { align: 'center', width: 495 });

  footerTextY += 14;

  doc
    .fontSize(8)
    .text('Questions? Contact us at (901) 410-2020 or djbenmurray@gmail.com', 50, footerTextY, { 
      align: 'center', 
      width: 495 
    });
}

export const config = {
  api: {
    responseLimit: '10mb',
  },
};

