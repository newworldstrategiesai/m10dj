/**
 * Generate Invoice PDF (PDFKit Version)
 * More reliable PDF generation without browser
 */

const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');
const { createClient } = require('@supabase/supabase-js');
const { isPlatformAdmin } = require('@/utils/auth-helpers/platform-admin');
const { getOrganizationContext } = require('@/utils/organization-helpers');
const { generateInvoicePDFBuffer } = require('@/utils/invoice-pdf-generator');

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

    // Use shared PDF generation utility (handles line items fetching internally)
    const pdfBuffer = await generateInvoicePDFBuffer(invoice, supabaseAdmin);
    console.log(`PDF generation complete. Total size: ${pdfBuffer.length} bytes`);

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};

