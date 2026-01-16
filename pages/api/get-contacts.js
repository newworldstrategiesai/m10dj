import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { search, eventType, leadStatus, limit = 100 } = req.query;

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get view-as organization ID from cookie (if admin is viewing as another org)
    const viewAsOrgId = getViewAsOrgIdFromRequest(req);

    // Get organization context (null for admins, org_id for SaaS users, or viewAsOrgId if in view-as mode)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email,
      viewAsOrgId
    );

    let query = supabase
      .from('contacts')
      .select('*')
      .is('deleted_at', null); // Only get non-deleted contacts

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      query = query.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      // SaaS user without organization - return empty
      return res.status(200).json({
        contacts: [],
        summary: {
          total_contacts: 0,
          new_leads: 0,
          booked_events: 0,
          upcoming_events: 0,
          follow_ups_due: 0
        }
      });
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Add search functionality
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email_address.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }

    // Filter by lead status
    if (leadStatus && leadStatus !== 'all') {
      query = query.eq('lead_status', leadStatus);
    }

    const { data: contacts, error } = await query;

    // Debug logging
    console.log('Admin check:', { 
      userEmail: session.user.email, 
      isAdmin, 
      contactsCount: contacts?.length || 0 
    });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    // For super admins, deduplicate contacts by email or phone
    // This prevents showing multiple entries for the same person
    let deduplicatedContacts = contacts || [];
    if (isAdmin && contacts && contacts.length > 0) {
      const emailMap = new Map(); // Deduplicate by email (most reliable)
      const phoneMap = new Map(); // Deduplicate by phone (secondary)
      const namePhoneMap = new Map(); // Deduplicate by name + phone (tertiary)
      const processedIds = new Set();
      
      // First pass: group by email (most reliable identifier)
      for (const contact of contacts) {
        const email = contact.email_address?.toLowerCase()?.trim();
        if (email && email.length > 0) {
          const existing = emailMap.get(email);
          if (!existing) {
            emailMap.set(email, contact);
            processedIds.add(contact.id);
          } else {
            // Keep the contact with more complete data or most recent
            const contactDate = new Date(contact.created_at || 0);
            const existingDate = new Date(existing.created_at || 0);
            if (contactDate > existingDate || 
                (contact.phone && !existing.phone) ||
                (contact.organization_id && !existing.organization_id)) {
              emailMap.set(email, contact);
              // Remove old one from processedIds
              processedIds.delete(existing.id);
              processedIds.add(contact.id);
            }
          }
        }
      }
      
      // Second pass: group remaining contacts by phone (if no email match)
      // Use last 10 digits for matching to handle different formatting
      for (const contact of contacts) {
        if (processedIds.has(contact.id)) continue;
        
        const phone = contact.phone?.replace(/\D/g, '');
        if (phone && phone.length >= 10) {
          // Use last 10 digits as key for better matching
          const phoneKey = phone.slice(-10);
          const existing = phoneMap.get(phoneKey);
          if (!existing) {
            phoneMap.set(phoneKey, contact);
            processedIds.add(contact.id);
          } else {
            // Keep the contact with more complete data or most recent
            const contactDate = new Date(contact.created_at || 0);
            const existingDate = new Date(existing.created_at || 0);
            if (contactDate > existingDate || 
                (contact.email_address && !existing.email_address) ||
                (contact.organization_id && !existing.organization_id)) {
              phoneMap.set(phoneKey, contact);
              // Remove the old one from processedIds so we don't count it
              processedIds.delete(existing.id);
              processedIds.add(contact.id);
            }
          }
        }
      }
      
      // Third pass: match by name + phone for contacts without emails
      // This catches cases like "Ben Murray" with same phone but no email
      for (const contact of contacts) {
        if (processedIds.has(contact.id)) continue;
        
        const phone = contact.phone?.replace(/\D/g, '');
        const firstName = contact.first_name?.toLowerCase()?.trim();
        const lastName = contact.last_name?.toLowerCase()?.trim();
        
        if (phone && phone.length >= 10 && firstName && lastName) {
          const phoneKey = phone.slice(-10);
          const namePhoneKey = `${firstName}_${lastName}_${phoneKey}`;
          const existing = namePhoneMap.get(namePhoneKey);
          
          if (!existing) {
            namePhoneMap.set(namePhoneKey, contact);
            processedIds.add(contact.id);
          } else {
            // Keep the contact with more complete data or most recent
            const contactDate = new Date(contact.created_at || 0);
            const existingDate = new Date(existing.created_at || 0);
            if (contactDate > existingDate || 
                (contact.email_address && !existing.email_address) ||
                (contact.organization_id && !existing.organization_id)) {
              namePhoneMap.set(namePhoneKey, contact);
              processedIds.delete(existing.id);
              processedIds.add(contact.id);
            }
          }
        }
      }
      
      // Build final deduplicated list
      // Start with all unique contacts from email and phone maps
      const uniqueContactsSet = new Map();
      
      // Add all email-deduplicated contacts
      for (const contact of emailMap.values()) {
        uniqueContactsSet.set(contact.id, contact);
      }
      
      // Add phone-deduplicated contacts (only if not already added via email)
      for (const contact of phoneMap.values()) {
        if (!uniqueContactsSet.has(contact.id)) {
          uniqueContactsSet.set(contact.id, contact);
        }
      }
      
      // Add name+phone-deduplicated contacts (only if not already added)
      for (const contact of namePhoneMap.values()) {
        if (!uniqueContactsSet.has(contact.id)) {
          uniqueContactsSet.set(contact.id, contact);
        }
      }
      
      // Add any remaining contacts that weren't processed (no email or phone)
      for (const contact of contacts) {
        if (!processedIds.has(contact.id) && !uniqueContactsSet.has(contact.id)) {
          uniqueContactsSet.set(contact.id, contact);
        }
      }
      
      // Convert to array
      deduplicatedContacts = Array.from(uniqueContactsSet.values());
      
      // Sort by created_at descending to maintain chronological order
      deduplicatedContacts.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      
      console.log('Deduplication results:', {
        originalCount: contacts.length,
        deduplicatedCount: deduplicatedContacts.length,
        removed: contacts.length - deduplicatedContacts.length,
        emailMatches: emailMap.size,
        phoneMatches: phoneMap.size,
        namePhoneMatches: namePhoneMap.size,
        processedIds: processedIds.size,
        uniqueContactsInFinal: uniqueContactsSet.size
      });
    }

    // Get summary statistics
    let summaryQuery = supabase
      .from('contacts_summary')
      .select('*');

    // For SaaS users, filter summary by organization_id. Platform admins see all summaries.
    if (!isAdmin && orgId) {
      // Note: contacts_summary may need organization_id column added
      // For now, filter by user_id as fallback
      summaryQuery = summaryQuery.eq('user_id', session.user.id);
    }

    const { data: summary } = await summaryQuery.single();

    res.status(200).json({
      contacts: deduplicatedContacts,
      summary: summary || {
        total_contacts: deduplicatedContacts.length,
        new_leads: deduplicatedContacts.filter(c => c.lead_status === 'New').length,
        booked_events: deduplicatedContacts.filter(c => c.lead_status === 'Booked').length,
        upcoming_events: 0,
        follow_ups_due: 0
      }
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}