/**
 * Generate Invoice PDF (PDFKit Version)
 * More reliable PDF generation without browser
 */

const PDFDocument = require('pdfkit');
const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');
const { createClient } = require('@supabase/supabase-js');
const { isPlatformAdmin } = require('@/utils/auth-helpers/platform-admin');
const { getOrganizationContext } = require('@/utils/organization-helpers');

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

    // Fetch line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
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
        generateInvoicePDF(doc, invoice, lineItems || []);
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

function generateInvoicePDF(doc, invoice, lineItems) {
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
  
  doc
    .fontSize(10)
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Subtotal:', totalsX, yPosition)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text(formatCurrency(invoice.subtotal), totalsX + 120, yPosition, { width: 55, align: 'right' });

  yPosition += 16;

  doc
    .font('Helvetica')
    .fillColor(mediumGray)
    .text('Tax:', totalsX, yPosition)
    .font('Helvetica-Bold')
    .fillColor(darkGray)
    .text(formatCurrency(invoice.tax_amount || 0), totalsX + 120, yPosition, { width: 55, align: 'right' });

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
    .text(formatCurrency(invoice.total_amount), totalsX + 120, yPosition, { width: 55, align: 'right' });

  if (invoice.amount_paid > 0) {
    yPosition += 20;
    
    doc
      .fontSize(11)
      .fillColor('#10b981')
      .font('Helvetica-Bold')
      .text('Paid:', totalsX, yPosition)
      .text(formatCurrency(invoice.amount_paid), totalsX + 120, yPosition, { width: 55, align: 'right' });
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

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#f59e0b')
    .text('Balance Due:', totalsX, yPosition)
    .text(formatCurrency(invoice.balance_due), totalsX + 120, yPosition, { width: 55, align: 'right' });

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

