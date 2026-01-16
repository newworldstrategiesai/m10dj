import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Merge multiple contacts into one primary contact
 * 
 * POST /api/admin/merge-contacts
 * Body: {
 *   primaryContactId: string,  // The contact to keep
 *   duplicateContactIds: string[]  // Contacts to merge into primary
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    const user = await requireAdmin(req, res);
    
    // Verify platform admin
    const isAdmin = isPlatformAdmin(user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only platform admins can merge contacts' });
    }

    const { primaryContactId, duplicateContactIds } = req.body;

    if (!primaryContactId || !Array.isArray(duplicateContactIds) || duplicateContactIds.length === 0) {
      return res.status(400).json({ 
        error: 'primaryContactId and duplicateContactIds array are required' 
      });
    }

    // Ensure primary contact is not in duplicates list
    if (duplicateContactIds.includes(primaryContactId)) {
      return res.status(400).json({ 
        error: 'Primary contact cannot be in duplicate list' 
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch primary contact
    const { data: primaryContact, error: primaryError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', primaryContactId)
      .is('deleted_at', null)
      .single();

    if (primaryError || !primaryContact) {
      return res.status(404).json({ error: 'Primary contact not found' });
    }

    // Fetch duplicate contacts
    const { data: duplicates, error: duplicatesError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .in('id', duplicateContactIds)
      .is('deleted_at', null);

    if (duplicatesError) {
      return res.status(500).json({ error: 'Failed to fetch duplicate contacts', details: duplicatesError.message });
    }

    if (!duplicates || duplicates.length === 0) {
      return res.status(400).json({ error: 'No valid duplicate contacts found' });
    }

    // Merge data: combine best fields from duplicates into primary
    let mergedData = { ...primaryContact };
    
    for (const duplicate of duplicates) {
      // Merge email if primary doesn't have one
      if (!mergedData.email_address && duplicate.email_address) {
        mergedData.email_address = duplicate.email_address;
      }
      
      // Merge phone if primary doesn't have one
      if (!mergedData.phone && duplicate.phone) {
        mergedData.phone = duplicate.phone;
      }
      
      // Merge notes
      if (duplicate.notes) {
        const existingNotes = mergedData.notes || '';
        const duplicateNotes = duplicate.notes || '';
        mergedData.notes = existingNotes 
          ? `${existingNotes}\n\n--- Merged from duplicate contact (${duplicate.id}) ---\n${duplicateNotes}`
          : duplicateNotes;
      }
      
      // Merge other fields if primary is missing them
      if (!mergedData.venue_name && duplicate.venue_name) {
        mergedData.venue_name = duplicate.venue_name;
      }
      if (!mergedData.venue_address && duplicate.venue_address) {
        mergedData.venue_address = duplicate.venue_address;
      }
      if (!mergedData.event_date && duplicate.event_date) {
        mergedData.event_date = duplicate.event_date;
      }
      if (!mergedData.organization_id && duplicate.organization_id) {
        mergedData.organization_id = duplicate.organization_id;
      }
    }

    // Update primary contact with merged data
    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({
        ...mergedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', primaryContactId);

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update primary contact', 
        details: updateError.message 
      });
    }

    // Reassign related records to primary contact
    const reassignments = {
      events: 0,
      invoices: 0,
      payments: 0,
      quote_selections: 0,
      contracts: 0,
      crowd_requests: 0
    };

    // Reassign events/projects
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id')
      .in('submission_id', duplicateContactIds);
    
    if (!eventsError && events && events.length > 0) {
      const { error: updateEventsError } = await supabaseAdmin
        .from('events')
        .update({ submission_id: primaryContactId })
        .in('submission_id', duplicateContactIds);
      
      if (!updateEventsError) {
        reassignments.events = events.length;
      }
    }

    // Reassign invoices
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .in('contact_id', duplicateContactIds);
    
    if (!invoicesError && invoices && invoices.length > 0) {
      const { error: updateInvoicesError } = await supabaseAdmin
        .from('invoices')
        .update({ contact_id: primaryContactId })
        .in('contact_id', duplicateContactIds);
      
      if (!updateInvoicesError) {
        reassignments.invoices = invoices.length;
      }
    }

    // Reassign payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('id')
      .in('contact_id', duplicateContactIds);
    
    if (!paymentsError && payments && payments.length > 0) {
      const { error: updatePaymentsError } = await supabaseAdmin
        .from('payments')
        .update({ contact_id: primaryContactId })
        .in('contact_id', duplicateContactIds);
      
      if (!updatePaymentsError) {
        reassignments.payments = payments.length;
      }
    }

    // Reassign quote_selections
    const { data: quotes, error: quotesError } = await supabaseAdmin
      .from('quote_selections')
      .select('id')
      .in('lead_id', duplicateContactIds);
    
    if (!quotesError && quotes && quotes.length > 0) {
      const { error: updateQuotesError } = await supabaseAdmin
        .from('quote_selections')
        .update({ lead_id: primaryContactId })
        .in('lead_id', duplicateContactIds);
      
      if (!updateQuotesError) {
        reassignments.quote_selections = quotes.length;
      }
    }

    // Reassign contracts
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .in('contact_id', duplicateContactIds);
    
    if (!contractsError && contracts && contracts.length > 0) {
      const { error: updateContractsError } = await supabaseAdmin
        .from('contracts')
        .update({ contact_id: primaryContactId })
        .in('contact_id', duplicateContactIds);
      
      if (!updateContractsError) {
        reassignments.contracts = contracts.length;
      }
    }

    // Reassign crowd_requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('crowd_requests')
      .select('id')
      .in('event_id', duplicateContactIds);
    
    if (!requestsError && requests && requests.length > 0) {
      const { error: updateRequestsError } = await supabaseAdmin
        .from('crowd_requests')
        .update({ event_id: primaryContactId })
        .in('event_id', duplicateContactIds);
      
      if (!updateRequestsError) {
        reassignments.crowd_requests = requests.length;
      }
    }

    // Soft delete duplicate contacts
    const { error: deleteError } = await supabaseAdmin
      .from('contacts')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', duplicateContactIds);

    if (deleteError) {
      return res.status(500).json({
        error: 'Failed to delete duplicate contacts',
        details: deleteError.message,
        reassignments // Return what was reassigned even if delete failed
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully merged ${duplicateContactIds.length} contact(s) into primary contact`,
      primaryContactId,
      mergedContactIds: duplicateContactIds,
      reassignments,
      totalReassigned: Object.values(reassignments).reduce((sum, count) => sum + count, 0)
    });

  } catch (error) {
    console.error('Error merging contacts:', error);
    if (res.headersSent) return;
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
