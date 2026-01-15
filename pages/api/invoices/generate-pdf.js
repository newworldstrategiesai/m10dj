/**
 * Generate Invoice PDF (PDFKit Version)
 * More reliable PDF generation without browser
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');
const { createClient } = require('@supabase/supabase-js');
const { isPlatformAdmin } = require('@/utils/auth-helpers/platform-admin');
const { getOrganizationContext } = require('@/utils/organization-helpers');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID required' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Check subscription access for invoices feature (skip for platform admins)
    if (!isAdmin) {
      const { canAccessAdminPage } = require('@/utils/subscription-access');
      const access = await canAccessAdminPage(supabase, session.user.email, 'invoices');
      
      if (!access.canAccess) {
        return res.status(403).json({
          error: 'Subscription required',
          message: access.reason || 'This feature requires a Professional subscription.',
          upgradeRequired: true,
          requiredTier: access.requiredTier || 'professional'
        });
      }
    }

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Use service role for queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice details with organization filtering
    let invoiceQuery = supabaseAdmin
      .from('invoice_summary')
      .select('*')
      .eq('id', invoiceId);

    // For SaaS users, filter by organization_id. Platform admins see all invoices.
    if (!isAdmin && orgId) {
      invoiceQuery = invoiceQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: invoice, error: invoiceError } = await invoiceQuery.single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Fetch line items from invoice_line_items table
    const { data: lineItemsFromTable, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items from table:', lineItemsError);
    }

    // If no line items from table, check the line_items JSONB field on the invoice
    let lineItems = lineItemsFromTable || [];
    if (lineItems.length === 0) {
      // Fetch invoice directly to get line_items JSONB field (invoice_summary view might not include it)
      const { data: directInvoiceData, error: directInvoiceError } = await supabase
        .from('invoices')
        .select('line_items')
        .eq('id', invoiceId)
        .single();
      
      console.log('📦 PDF: Checking invoice.line_items JSONB field:', {
        has_data: !!directInvoiceData,
        line_items: directInvoiceData?.line_items,
        error: directInvoiceError
      });
      
      if (directInvoiceData?.line_items) {
        try {
          // Parse the JSONB line_items field
          const jsonLineItems = typeof directInvoiceData.line_items === 'string' 
            ? JSON.parse(directInvoiceData.line_items) 
            : directInvoiceData.line_items;
          
          if (Array.isArray(jsonLineItems) && jsonLineItems.length > 0) {
            // Convert JSONB format to invoice_line_items format for PDF
            lineItems = jsonLineItems.map((item, index) => {
              const unitPrice = item.rate || item.unit_price || 0;
              const quantity = item.quantity || 1;
              const amount = item.amount || (unitPrice * quantity);
              
              return {
                id: `json-${index}`,
                description: item.description || '',
                quantity: quantity,
                unit_price: unitPrice,
                total_amount: amount,
                item_type: item.type || 'custom',
                notes: item.notes || null
              };
            });
            console.log('📦 PDF: Using line items from invoice.line_items JSONB field:', lineItems.length);
          }
        } catch (e) {
          console.error('Error parsing invoice.line_items JSONB in PDF generation:', e);
        }
      }
    }
    
    console.log('📦 PDF: Final line items count:', lineItems.length);

    // Fetch invoice directly to get payment_token (invoice_summary view might not include it)
    // If no payment_token exists, generate one and save it to the invoice
    let paymentToken = invoice.payment_token || invoice.qr_code_data;
    if (!paymentToken) {
      const { data: directInvoiceForToken, error: tokenError } = await supabase
        .from('invoices')
        .select('payment_token, qr_code_data')
        .eq('id', invoiceId)
        .single();
      
      if (directInvoiceForToken) {
        paymentToken = directInvoiceForToken.payment_token || directInvoiceForToken.qr_code_data;
      }
      
      // If still no token, generate one and save it to the invoice
      if (!paymentToken) {
        const crypto = require('crypto');
        paymentToken = crypto.randomBytes(32).toString('hex');
        
        // Save the generated token to the invoice
        const { error: updateTokenError } = await supabase
          .from('invoices')
          .update({ payment_token: paymentToken })
          .eq('id', invoiceId);
        
        if (updateTokenError) {
          console.error('Error saving payment_token to invoice:', updateTokenError);
        } else {
          console.log('📦 PDF: Generated and saved payment_token for invoice:', paymentToken.substring(0, 20) + '...');
        }
      } else {
        console.log('📦 PDF: Fetched payment_token from invoice:', {
          has_token: !!paymentToken,
          token: paymentToken ? paymentToken.substring(0, 20) + '...' : null
        });
      }
    }

    // Generate payment URL - always use payment_token route for invoices
    // This ensures customers go to the invoice payment page, not the quote selection page
    const paymentUrl = paymentToken 
      ? `${siteUrl}/pay/${paymentToken}`
      : null; // Don't show QR code if we can't generate a token
    
    console.log('📦 PDF: Using payment_token URL:', paymentUrl);

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
      console.log('📦 PDF: Generated QR code for payment URL:', paymentUrl);
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
      console.log(`Received chunk of size: ${chunk.length}`);
      chunks.push(chunk);
    });
    
    // Wait for PDF to finish
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`PDF generation complete. Total size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      doc.on('error', (err) => {
        console.error('PDFKit error:', err);
        reject(err);
      });
      
      // Generate PDF content
      try {
        console.log('📄 PDF: Generating PDF with data:', {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          line_items_count: lineItems.length,
          line_items: lineItems,
          subtotal: invoice.subtotal,
          total_amount: invoice.total_amount,
          payment_url: paymentUrl,
          has_qr_code: !!qrCodeDataUrl
        });
        generateInvoicePDF(doc, invoice, lineItems || [], paymentUrl, qrCodeDataUrl);
      } catch (pdfError) {
        console.error('Error in generateInvoicePDF:', pdfError);
        reject(pdfError);
      }
      
      // Finalize PDF
      doc.end();
    });

    console.log(`Sending PDF: ${pdfBuffer.length} bytes`);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
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
      .fontSize(14)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(invoice.invoice_title, 50, yPosition);
    yPosition += 25;
  }

  // Overdue Warning
  if (invoice.days_overdue > 0) {
    doc
      .rect(50, yPosition, 495, 40)
      .fillAndStroke('#fee2e2', '#fca5a5');
    
    doc
      .fontSize(11)
      .fillColor('#991b1b')
      .font('Helvetica-Bold')
      .text('⚠ THIS INVOICE IS OVERDUE', 60, yPosition + 8);
    
    doc
      .font('Helvetica')
      .text(`Payment was due ${invoice.days_overdue} days ago on ${formatDate(invoice.due_date)}`, 60, yPosition + 23);
    
    yPosition += 50;
  }

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
    .text(`${invoice.first_name} ${invoice.last_name}`, leftCol, yPosition);

  yPosition += 14;

  doc
    .font('Helvetica')
    .text(invoice.email_address, leftCol, yPosition);

  if (invoice.phone) {
    yPosition += 14;
    doc.text(invoice.phone, leftCol, yPosition);
  }

  if (invoice.address) {
    yPosition += 14;
    doc.text(invoice.address, leftCol, yPosition);
    
    if (invoice.city && invoice.state) {
      yPosition += 14;
      doc.text(`${invoice.city}, ${invoice.state}`, leftCol, yPosition);
    }
  }

  // Invoice Details (right column)
  let rightYPos = yPosition - (invoice.phone ? 42 : 28);

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
    .text('Issue Date:', rightCol, rightYPos);
  
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
    // Show message if no line items
    doc
      .fontSize(10)
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

    // Draw line
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
      .text(item.description, descCol, yPosition, { width: 280 });

    if (item.notes) {
      yPosition += 12;
      doc
        .fontSize(9)
        .fillColor(mediumGray)
        .font('Helvetica')
        .text(item.notes, descCol, yPosition, { width: 280 });
    }

    const itemYPos = yPosition - (item.notes ? 12 : 0);

    doc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(item.quantity.toString(), qtyCol, itemYPos, { width: 50, align: 'center' })
      .text(formatCurrency(item.unit_price), priceCol, itemYPos, { width: 60, align: 'right' })
      .font('Helvetica-Bold')
      .text(formatCurrency(item.total_amount), amountCol, itemYPos, { width: 55, align: 'right' });

    yPosition += 20;
    });
  }

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
  // Right-aligned position for amounts (consistent across all totals)
  // Page width is 545 (50 margin + 495 content), so we'll end at 540 with 5px padding
  const amountX = 540; // Position near right edge with padding
  const amountWidth = 70; // Sufficient width for currency values (allows for large amounts)
  
  // Calculate subtotal from line items if invoice subtotal is 0 or missing
  const calculatedSubtotal = lineItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const subtotalToUse = invoice.subtotal && invoice.subtotal > 0 ? invoice.subtotal : calculatedSubtotal;
  
  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Subtotal:', totalsX, yPosition)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text(formatCurrency(subtotalToUse), amountX, yPosition, { width: amountWidth, align: 'right' });

  yPosition += 16;

  doc
    .font('Helvetica')
    .fillColor(mediumGray)
    .text('Tax:', totalsX, yPosition)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text(formatCurrency(invoice.tax_amount || 0), amountX, yPosition, { width: amountWidth, align: 'right' });

  yPosition += 20;

  // Total line
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(totalsX, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 12;

  // Calculate total from subtotal + tax - discount if invoice total is 0 or missing
  const taxAmount = invoice.tax_amount || 0;
  const discountAmount = invoice.discount_amount || 0;
  const calculatedTotal = subtotalToUse + taxAmount - discountAmount;
  const totalToUse = invoice.total_amount && invoice.total_amount > 0 ? invoice.total_amount : calculatedTotal;
  
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text('Total:', totalsX, yPosition)
    .text(formatCurrency(totalToUse), amountX, yPosition, { width: amountWidth, align: 'right' });

  if (invoice.amount_paid > 0) {
    yPosition += 20;
    
    doc
      .fontSize(11)
      .fillColor('#10b981')
      .font('Helvetica-Bold')
      .text('Paid:', totalsX, yPosition)
      .text(formatCurrency(invoice.amount_paid), amountX, yPosition, { width: amountWidth, align: 'right' });
  }

  yPosition += 20;

  // Balance line
  doc
    .strokeColor(brandGold)
    .lineWidth(2)
    .moveTo(totalsX, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 12;

  // Calculate balance due from total - amount paid
  const balanceDueToUse = invoice.balance_due && invoice.balance_due > 0 
    ? invoice.balance_due 
    : (totalToUse - (invoice.amount_paid || 0));
  
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#f59e0b')
    .text('Balance Due:', totalsX, yPosition)
    .text(formatCurrency(balanceDueToUse), amountX, yPosition, { width: amountWidth, align: 'right' });

  // Payment section with QR code (if payment URL and QR code are provided)
  // Only show if we have a valid payment token URL (not quote selection route)
  if (paymentUrl && qrCodeDataUrl && paymentUrl.includes('/pay/')) {
    yPosition += 40;
    
    // Check if we need a new page
    if (yPosition > 600) {
      doc.addPage();
      yPosition = 50;
    }

    const paymentBoxStartY = yPosition;
    const paymentBoxHeight = 120;
    const paymentBoxPadding = 20;
    const leftColX = 50 + paymentBoxPadding;
    const rightColX = 380; // Start of right column
    
    // Payment box with styling - rounded corners effect with background
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
    // Calculate font size to fit URL on one line
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
    } catch (imgError) {
      console.error('Error adding QR code image to invoice PDF:', imgError);
    }

    yPosition = paymentBoxStartY + paymentBoxHeight + 20;
  }

  // Notes
  if (invoice.notes) {
    yPosition += 40;
    
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    doc
      .rect(50, yPosition, 495, 80)
      .fillAndStroke('#f9fafb', lightGray);

    doc
      .fontSize(11)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('NOTES', 60, yPosition + 10);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(mediumGray)
      .text(invoice.notes, 60, yPosition + 28, { width: 475 });

    yPosition += 90;
  }

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
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};

