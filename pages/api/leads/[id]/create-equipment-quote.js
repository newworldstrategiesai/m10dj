/**
 * Create Equipment Rental Quote
 * 
 * Creates a quote_selection and invoice for an equipment rental inquiry
 * when the customer confirms their intent to book.
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { ensureInvoiceExists } from '@/utils/ensure-invoice-exists';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    const { id } = req.query; // contact_submission ID
    const { equipmentDetails, totalPrice, packageName } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Submission ID is required' });
    }

    if (!totalPrice || totalPrice < 300) {
      return res.status(400).json({ 
        error: 'Total price must be at least $300',
        minimum: 300
      });
    }

    // Use service role for queries
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get submission data
    let submissionQuery = adminSupabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id);

    if (!isAdmin && orgId) {
      submissionQuery = submissionQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: submission, error: submissionError } = await submissionQuery.single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify organization ownership
    if (!isAdmin && submission.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 2. Ensure contact record exists (convert from submission if needed)
    let contactId = id;
    let contact = null;

    // Check if contact already exists
    const { data: existingContact } = await adminSupabase
      .from('contacts')
      .select('id, organization_id')
      .eq('email_address', submission.email)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
      contact = existingContact;
      console.log(`✅ Using existing contact: ${contactId}`);
    } else {
      // Create contact from submission
      console.log(`📝 Creating contact from submission: ${id}`);

      // Parse name into first/last
      const nameParts = (submission.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const contactData = {
        user_id: session.user.id,
        first_name: firstName,
        last_name: lastName,
        email_address: submission.email,
        phone: submission.phone,
        event_type: submission.event_type,
        event_date: submission.event_date,
        venue_name: submission.location,
        lead_status: 'Contacted',
        lead_source: 'Website',
        lead_stage: 'Quote Provided',
        organization_id: submission.organization_id || orgId,
        communication_preference: submission.phone ? 'any' : 'email',
        special_requests: submission.message,
        notes: submission.notes
      };

      const { data: newContact, error: contactError } = await adminSupabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (contactError) {
        console.error('Error creating contact:', contactError);
        return res.status(500).json({ 
          error: 'Failed to create contact',
          details: contactError.message 
        });
      }

      contactId = newContact.id;
      contact = newContact;
      console.log(`✅ Created contact: ${contactId}`);
    }

    // 3. Check if quote already exists
    const { data: existingQuote } = await adminSupabase
      .from('quote_selections')
      .select('id, invoice_id')
      .eq('lead_id', contactId)
      .maybeSingle();

    let quoteId = null;
    let invoiceId = null;

    if (existingQuote) {
      quoteId = existingQuote.id;
      invoiceId = existingQuote.invoice_id;
      console.log(`✅ Using existing quote: ${quoteId}`);
    } else {
      // 4. Create quote_selection
      const finalPackageName = packageName || equipmentDetails?.packageName || `Equipment Rental - $${totalPrice}`;
      
      const quoteData = {
        lead_id: contactId,
        package_id: 'equipment_rental',
        package_name: finalPackageName,
        package_price: totalPrice,
        addons: equipmentDetails?.addons || [],
        total_price: totalPrice,
        status: 'pending',
        organization_id: submission.organization_id || orgId || contact?.organization_id,
        metadata: {
          equipment_rental: true,
          original_submission_id: id,
          equipment_details: equipmentDetails
        }
      };

      const { data: newQuote, error: quoteError } = await adminSupabase
        .from('quote_selections')
        .insert([quoteData])
        .select()
        .single();

      if (quoteError) {
        console.error('Error creating quote:', quoteError);
        return res.status(500).json({ 
          error: 'Failed to create quote',
          details: quoteError.message 
        });
      }

      quoteId = newQuote.id;
      console.log(`✅ Created quote: ${quoteId}`);
    }

    // 5. Ensure invoice exists
    const invoiceResult = await ensureInvoiceExists(contactId, adminSupabase);

    if (!invoiceResult.success) {
      console.error('Error ensuring invoice exists:', invoiceResult.error);
      // Continue anyway - invoice can be created later
    } else {
      invoiceId = invoiceResult.invoice_id;
      console.log(`✅ Invoice ready: ${invoiceId}`);
    }

    // 6. Update submission status
    await adminSupabase
      .from('contact_submissions')
      .update({ 
        status: 'quoted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // 7. Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
    const quoteUrl = `${baseUrl}/quote/${contactId}`;
    const invoiceUrl = `${baseUrl}/quote/${contactId}/invoice`;
    const paymentUrl = `${baseUrl}/quote/${contactId}/payment`;

    return res.status(200).json({
      success: true,
      quoteId,
      contactId,
      invoiceId,
      urls: {
        quote: quoteUrl,
        invoice: invoiceUrl,
        payment: paymentUrl
      },
      message: 'Equipment rental quote created successfully'
    });

  } catch (error) {
    console.error('Error creating equipment quote:', error);
    return res.status(500).json({ 
      error: 'Failed to create equipment quote',
      details: error.message 
    });
  }
}

