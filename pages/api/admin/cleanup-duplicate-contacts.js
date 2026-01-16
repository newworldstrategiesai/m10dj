import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      return res.status(403).json({ error: 'Only platform admins can cleanup duplicates' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all contacts (non-deleted)
    const { data: allContacts, error: fetchError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch contacts', details: fetchError.message });
    }

    if (!allContacts || allContacts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No contacts to process',
        deleted: 0,
        kept: 0
      });
    }

    // Group contacts by email, phone, or name+phone
    const emailMap = new Map();
    const phoneMap = new Map();
    const namePhoneMap = new Map();
    const duplicateIds = new Set();
    const keptIds = new Set();

    // First pass: email deduplication
    for (const contact of allContacts) {
      const email = contact.email_address?.toLowerCase()?.trim();
      if (email && email.length > 0) {
        const existing = emailMap.get(email);
        if (!existing) {
          emailMap.set(email, contact);
          keptIds.add(contact.id);
        } else {
          // Keep the more complete or newer one
          const contactDate = new Date(contact.created_at || 0);
          const existingDate = new Date(existing.created_at || 0);
          if (contactDate > existingDate || 
              (contact.phone && !existing.phone) ||
              (contact.organization_id && !existing.organization_id)) {
            // Replace with better contact
            emailMap.set(email, contact);
            duplicateIds.add(existing.id);
            keptIds.delete(existing.id);
            keptIds.add(contact.id);
          } else {
            duplicateIds.add(contact.id);
          }
        }
      }
    }

    // Second pass: phone deduplication (for contacts without emails)
    for (const contact of allContacts) {
      if (duplicateIds.has(contact.id) || keptIds.has(contact.id)) continue;
      
      const phone = contact.phone?.replace(/\D/g, '');
      if (phone && phone.length >= 10) {
        const phoneKey = phone.slice(-10);
        const existing = phoneMap.get(phoneKey);
        if (!existing) {
          phoneMap.set(phoneKey, contact);
          keptIds.add(contact.id);
        } else {
          // Keep the more complete or newer one
          const contactDate = new Date(contact.created_at || 0);
          const existingDate = new Date(existing.created_at || 0);
          if (contactDate > existingDate || 
              (contact.email_address && !existing.email_address) ||
              (contact.organization_id && !existing.organization_id)) {
            phoneMap.set(phoneKey, contact);
            duplicateIds.add(existing.id);
            keptIds.delete(existing.id);
            keptIds.add(contact.id);
          } else {
            duplicateIds.add(contact.id);
          }
        }
      }
    }

    // Third pass: name + phone deduplication (for contacts without emails)
    for (const contact of allContacts) {
      if (duplicateIds.has(contact.id) || keptIds.has(contact.id)) continue;
      
      const phone = contact.phone?.replace(/\D/g, '');
      const firstName = contact.first_name?.toLowerCase()?.trim();
      const lastName = contact.last_name?.toLowerCase()?.trim();
      
      if (phone && phone.length >= 10 && firstName && lastName) {
        const phoneKey = phone.slice(-10);
        const namePhoneKey = `${firstName}_${lastName}_${phoneKey}`;
        const existing = namePhoneMap.get(namePhoneKey);
        
        if (!existing) {
          namePhoneMap.set(namePhoneKey, contact);
          keptIds.add(contact.id);
        } else {
          // Keep the more complete or newer one
          const contactDate = new Date(contact.created_at || 0);
          const existingDate = new Date(existing.created_at || 0);
          if (contactDate > existingDate || 
              (contact.email_address && !existing.email_address) ||
              (contact.organization_id && !existing.organization_id)) {
            namePhoneMap.set(namePhoneKey, contact);
            duplicateIds.add(existing.id);
            keptIds.delete(existing.id);
            keptIds.add(contact.id);
          } else {
            duplicateIds.add(contact.id);
          }
        }
      }
    }

    // Convert duplicate IDs to array
    const duplicateIdsArray = Array.from(duplicateIds);

    if (duplicateIdsArray.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No duplicates found',
        deleted: 0,
        kept: keptIds.size,
        total: allContacts.length
      });
    }

    // Soft delete duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('contacts')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', duplicateIdsArray);

    if (deleteError) {
      return res.status(500).json({
        error: 'Failed to delete duplicates',
        details: deleteError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully removed ${duplicateIdsArray.length} duplicate contact(s)`,
      deleted: duplicateIdsArray.length,
      kept: keptIds.size,
      total: allContacts.length,
      duplicateIds: duplicateIdsArray
    });

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    if (res.headersSent) return;
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
