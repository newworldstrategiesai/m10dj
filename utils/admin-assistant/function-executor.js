/**
 * Function Executor for Admin Assistant
 * 
 * Executes the actual operations when OpenAI calls functions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Execute a function call from the assistant
 */
export async function executeFunction(functionName, args, supabaseClient, userId) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);

  console.log(`🔧 Executing function: ${functionName}`, args);

  try {
    switch (functionName) {
      // ============================================
      // CONTACT & LEAD MANAGEMENT
      // ============================================
      case 'search_contacts':
        return await searchContacts(args, supabase);

      case 'get_contact_details':
        return await getContactDetails(args, supabase);

      case 'update_lead_status':
        return await updateLeadStatus(args, supabase);

      case 'add_contact_note':
        return await addContactNote(args, supabase);

      case 'create_contact':
        return await createContact(args, supabase, userId);

      case 'update_contact':
        return await updateContact(args, supabase);

      case 'delete_contacts':
        return await deleteContacts(args, supabase);

      // ============================================
      // QUOTE MANAGEMENT
      // ============================================
      case 'get_quote':
        return await getQuote(args, supabase);

      case 'create_quote':
        return await createQuote(args, supabase);

      // ============================================
      // INVOICE MANAGEMENT
      // ============================================
      case 'get_invoice':
        return await getInvoice(args, supabase);

      case 'update_invoice':
        return await updateInvoice(args, supabase);

      case 'get_payments':
        return await getPayments(args, supabase);

      case 'get_questionnaire_link':
        return await getQuestionnaireLink(args, supabase);

      case 'get_scheduling_link':
        return await getSchedulingLink(args, supabase);

      // ============================================
      // PUBLIC VOICE ASSISTANT FUNCTIONS
      // ============================================
      case 'schedule_consultation':
        return await scheduleConsultation(args, supabase);

      case 'request_quote':
        return await requestQuote(args, supabase);

      case 'get_music_recommendations':
        return await getMusicRecommendations(args);

      // ============================================
      // CONTRACT MANAGEMENT
      // ============================================
      case 'get_contract':
        return await getContract(args, supabase);

      case 'generate_contract':
        return await generateContract(args, supabase);

      // ============================================
      // PROJECT/EVENT MANAGEMENT
      // ============================================
      case 'create_project':
        return await createProject(args, supabase);

      case 'get_project':
        return await getProject(args, supabase);

      case 'update_project':
        return await updateProject(args, supabase);

      // ============================================
      // ANALYTICS & REPORTING
      // ============================================
      case 'get_dashboard_stats':
        return await getDashboardStats(args, supabase);

      case 'get_highest_paid_project':
        return await getHighestPaidProject(args, supabase);

      case 'get_recent_leads':
        return await getRecentLeads(args, supabase);

      case 'get_upcoming_events':
        return await getUpcomingEvents(args, supabase);

      case 'initiate_outbound_call':
        return await initiateOutboundCall(args, supabase, userId);

      case 'get_revenue_stats':
        return await getRevenueStats(args, supabase);

      // ============================================
      // COMMUNICATION
      // ============================================
      case 'send_sms':
        return await sendSMS(args, supabase);

      case 'send_email':
        return await sendEmail(args, supabase);

      case 'request_review':
        return await requestReview(args, supabase);

      case 'get_communication_history':
        return await getCommunicationHistory(args, supabase);

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error) {
    console.error(`❌ Error executing ${functionName}:`, error);
    return {
      success: false,
      error: error.message || 'Function execution failed'
    };
  }
}

// ============================================
// CONTACT & LEAD MANAGEMENT FUNCTIONS
// ============================================

async function searchContacts(args, supabase) {
  const { query, event_type, lead_status, limit = 10 } = args;

  let dbQuery = supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address, phone, event_type, event_date, venue_name, lead_status, created_at, last_contacted_date, last_contact_type, proposal_sent_date, contract_signed_date')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 50));

  if (query) {
    dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email_address.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  if (event_type) {
    dbQuery = dbQuery.eq('event_type', event_type);
  }

  if (lead_status) {
    dbQuery = dbQuery.eq('lead_status', lead_status);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(`Failed to search contacts: ${error.message}`);
  }

  return {
    success: true,
    count: data?.length || 0,
    contacts: data || []
  };
}

async function getContactDetails(args, supabase) {
  const { contact_id } = args;

  if (!contact_id) {
    throw new Error('contact_id is required');
  }

  // Get contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .is('deleted_at', null)
    .single();

  if (contactError || !contact) {
    throw new Error(`Contact not found: ${contact_id}`);
  }

  // Get related records - check for errors properly
  const [quoteResult, invoiceResult, contractResult, projectResult] = await Promise.all([
    supabase.from('quote_selections').select('*').eq('lead_id', contact_id).maybeSingle(),
    supabase.from('invoices').select('*').eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('contracts').select('*').eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('events').select('*').eq('submission_id', contact_id).maybeSingle()
  ]);

  // Get quote_id for invoices and contracts (needed for client-facing URLs)
  let quoteIdForInvoice = null;
  let quoteIdForContract = null;
  
  if (invoiceResult.data) {
    // Find quote_selections that references this invoice
    const { data: quoteWithInvoice } = await supabase
      .from('quote_selections')
      .select('id')
      .eq('invoice_id', invoiceResult.data.id)
      .maybeSingle();
    quoteIdForInvoice = quoteWithInvoice?.id || quoteResult.data?.id || null;
  }
  
  if (contractResult.data) {
    // Find quote_selections that references this contract
    const { data: quoteWithContract } = await supabase
      .from('quote_selections')
      .select('id')
      .eq('contract_id', contractResult.data.id)
      .maybeSingle();
    quoteIdForContract = quoteWithContract?.id || quoteResult.data?.id || null;
  }

  // Log any errors for debugging
  if (invoiceResult.error && invoiceResult.error.code !== 'PGRST116') {
    console.error('Error fetching invoice for contact:', invoiceResult.error);
  }
  if (quoteResult.error && quoteResult.error.code !== 'PGRST116') {
    console.error('Error fetching quote for contact:', quoteResult.error);
  }
  if (contractResult.error && contractResult.error.code !== 'PGRST116') {
    console.error('Error fetching contract for contact:', contractResult.error);
  }
  if (projectResult.error && projectResult.error.code !== 'PGRST116') {
    console.error('Error fetching project for contact:', projectResult.error);
  }

  return {
    success: true,
    contact,
    quote: quoteResult.error && quoteResult.error.code !== 'PGRST116' ? null : (quoteResult.data || null),
    invoice: invoiceResult.error && invoiceResult.error.code !== 'PGRST116' ? null : (invoiceResult.data || null),
    contract: contractResult.error && contractResult.error.code !== 'PGRST116' ? null : (contractResult.data || null),
    project: projectResult.error && projectResult.error.code !== 'PGRST116' ? null : (projectResult.data || null),
    // Include quote_id for building client-facing URLs
    quote_id: quoteResult.data?.id || null,
    invoice_quote_id: quoteIdForInvoice,
    contract_quote_id: quoteIdForContract
  };
}

async function updateLeadStatus(args, supabase) {
  const { contact_id, status, notes } = args;

  if (!contact_id || !status) {
    throw new Error('contact_id and status are required');
  }

  const updateData = {
    lead_status: status,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('notes')
      .eq('id', contact_id)
      .single();

    const existingNotes = contact?.notes || '';
    updateData.notes = existingNotes 
      ? `${existingNotes}\n\n[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`
      : `[${new Date().toLocaleString()}] Status changed to ${status}: ${notes}`;
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', contact_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`);
  }

  return {
    success: true,
    contact: data,
    message: `Updated lead status to ${status}`
  };
}

async function addContactNote(args, supabase) {
  const { contact_id, note, is_internal = false } = args;

  if (!contact_id || !note) {
    throw new Error('contact_id and note are required');
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('notes, internal_notes')
    .eq('id', contact_id)
    .single();

  if (!contact) {
    throw new Error('Contact not found');
  }

  const timestamp = new Date().toLocaleString();
  const newNote = `[${timestamp}] ${note}`;

  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (is_internal) {
    updateData.internal_notes = contact.internal_notes 
      ? `${contact.internal_notes}\n${newNote}`
      : newNote;
  } else {
    updateData.notes = contact.notes 
      ? `${contact.notes}\n${newNote}`
      : newNote;
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', contact_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add note: ${error.message}`);
  }

  return {
    success: true,
    contact: data,
    message: 'Note added successfully'
  };
}

async function createContact(args, supabase, userId) {
  const {
    first_name,
    last_name,
    email_address,
    phone,
    event_type,
    event_date,
    event_time,
    venue_name,
    venue_address,
    guest_count,
    notes,
    lead_source = 'Admin Assistant'
  } = args;

  if (!first_name || !last_name || !email_address) {
    throw new Error('first_name, last_name, and email_address are required');
  }

  // Get admin user ID
  let adminUserId = process.env.DEFAULT_ADMIN_USER_ID || userId;
  
  if (!adminUserId) {
    // Try to find admin user by email
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      if (authUsers?.users) {
        const adminEmails = ['djbenmurray@gmail.com', 'admin@m10djcompany.com', 'manager@m10djcompany.com'];
        const adminUser = authUsers.users.find(user => adminEmails.includes(user.email || ''));
        if (adminUser) {
          adminUserId = adminUser.id;
        }
      }
    } catch (err) {
      console.warn('Could not fetch admin user:', err);
    }
  }

  // Parse event date
  let parsedEventDate = null;
  if (event_date) {
    try {
      const dateObj = new Date(event_date);
      if (!isNaN(dateObj.getTime())) {
        parsedEventDate = dateObj.toISOString().split('T')[0];
      }
    } catch (dateError) {
      console.warn('Could not parse event date:', event_date);
    }
  }

  // Parse event time (normalize to HH:MM:SS format)
  let parsedEventTime = null;
  if (event_time) {
    try {
      // Handle various time formats
      let timeStr = event_time.trim();
      
      // Check if it's already in HH:MM:SS format
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        parsedEventTime = timeStr;
      } 
      // Check if it's in HH:MM format
      else if (/^\d{2}:\d{2}$/.test(timeStr)) {
        parsedEventTime = `${timeStr}:00`;
      }
      // Try to parse natural language times like "3:00 PM"
      else {
        const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          parsedEventTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        }
      }
    } catch (timeError) {
      console.warn('Could not parse event time:', event_time);
    }
  }

  // Prepare contact data
  const contactData = {
    user_id: adminUserId,
    first_name,
    last_name,
    email_address,
    phone: phone || null,
    event_type: event_type || 'other',
    event_date: parsedEventDate,
    event_time: parsedEventTime,
    venue_name: venue_name || null,
    venue_address: venue_address || null,
    guest_count: guest_count ? parseInt(guest_count) : null,
    special_requests: notes || null,
    lead_status: 'New',
    lead_source: lead_source,
    lead_stage: 'Initial Inquiry',
    lead_temperature: 'Warm',
    communication_preference: phone ? 'any' : 'email',
    opt_in_status: true,
    lead_score: 50,
    priority_level: 'Medium',
    last_contacted_date: new Date().toISOString(),
    last_contact_type: 'admin_assistant',
    notes: notes || null
  };

  // Create contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert([contactData])
    .select()
    .single();

  if (contactError) {
    // Check if contact already exists (duplicate email)
    if (contactError.code === '23505') {
      throw new Error(`Contact with email ${email_address} already exists. Use search_contacts to find them.`);
    }
    throw new Error(`Failed to create contact: ${contactError.message}`);
  }

  // Create project/event
  let project = null;
  try {
    const generateProjectName = (contact) => {
      const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
      const eventType = contact.event_type || 'Event';
      const eventDate = contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : '';
      const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
      return `${clientName} - ${eventType}${eventDate ? ` - ${eventDate}` : ''}${venue}`;
    };

    const projectData = {
      submission_id: contact.id,
      event_name: generateProjectName(contact),
      client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
      client_email: contact.email_address,
      client_phone: contact.phone || null,
      event_type: contact.event_type || 'other',
      event_date: contact.event_date || new Date().toISOString().split('T')[0],
      start_time: contact.event_time || null,
      venue_name: contact.venue_name || null,
      venue_address: contact.venue_address || null,
      number_of_guests: contact.guest_count || null,
      special_requests: contact.special_requests || null,
      status: 'confirmed',
      notes: `Auto-generated project from admin assistant. Created on ${new Date().toLocaleDateString()}.`
    };

    const { data: createdProject, error: projectError } = await supabase
      .from('events')
      .insert([projectData])
      .select()
      .single();

    if (!projectError && createdProject) {
      project = createdProject;
    }
  } catch (projectErr) {
    console.warn('Failed to create project (non-critical):', projectErr);
  }

  // Auto-create quote, invoice, and contract
  try {
    const { autoCreateQuoteInvoiceContract } = await import('../../utils/auto-create-quote-invoice-contract');
    await autoCreateQuoteInvoiceContract(contact, supabase);
  } catch (autoCreateErr) {
    console.warn('Failed to auto-create quote/invoice/contract (non-critical):', autoCreateErr);
  }

  return {
    success: true,
    contact,
    project,
    message: 'Contact created successfully with event information'
  };
}

async function updateContact(args, supabase) {
  const { contact_id, ...updates } = args;

  if (!contact_id) {
    throw new Error('contact_id is required');
  }

  // Get existing contact first
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .single();

  if (!existingContact) {
    throw new Error('Contact not found');
  }

  // Parse event date if provided
  if (updates.event_date) {
    try {
      const dateObj = new Date(updates.event_date);
      if (!isNaN(dateObj.getTime())) {
        updates.event_date = dateObj.toISOString().split('T')[0];
      }
    } catch (err) {
      console.warn('Could not parse event date:', updates.event_date);
      delete updates.event_date;
    }
  }

  // Parse event time if provided
  if (updates.event_time) {
    try {
      let timeStr = updates.event_time.trim();
      
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        updates.event_time = timeStr;
      } else if (/^\d{2}:\d{2}$/.test(timeStr)) {
        updates.event_time = `${timeStr}:00`;
      } else {
        const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          updates.event_time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        }
      }
    } catch (err) {
      console.warn('Could not parse event time:', updates.event_time);
      delete updates.event_time;
    }
  }

  // Prepare update data (only include fields that were provided)
  const updateData = {
    updated_at: new Date().toISOString()
  };

  // Only update fields that were provided
  const allowedFields = [
    'first_name', 'last_name', 'email_address', 'phone',
    'event_type', 'event_date', 'event_time',
    'venue_name', 'venue_address', 'guest_count', 'special_requests'
  ];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  });

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', contact_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contact: ${error.message}`);
  }

  return {
    success: true,
    contact: data,
    message: 'Contact updated successfully'
  };
}

async function deleteContacts(args, supabase) {
  const { contact_ids, email_pattern, contact_name, reason } = args;
  
  let contactIdsToDelete = [];

  // If contact_ids are provided, use them directly
  if (contact_ids && Array.isArray(contact_ids) && contact_ids.length > 0) {
    contactIdsToDelete = contact_ids;
  }
  // If email_pattern is provided, search for matching contacts
  else if (email_pattern) {
    const { data: matchingContacts, error: searchError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address')
      .ilike('email_address', `%${email_pattern}%`)
      .is('deleted_at', null);
    
    if (searchError) {
      throw new Error(`Failed to search for contacts: ${searchError.message}`);
    }
    
    if (!matchingContacts || matchingContacts.length === 0) {
      return {
        success: false,
        message: `No contacts found matching email pattern: ${email_pattern}`,
        deleted_count: 0
      };
    }
    
    contactIdsToDelete = matchingContacts.map(c => c.id);
  }
  // If contact_name is provided, search for the contact first
  else if (contact_name) {
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (contactError) {
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}"`,
        deleted_count: 0
      };
    }
    
    contactIdsToDelete = contacts.map(c => c.id);
  }
  else {
    throw new Error('Either contact_ids, email_pattern, or contact_name is required');
  }

  if (contactIdsToDelete.length === 0) {
    return {
      success: false,
      message: 'No contacts to delete',
      deleted_count: 0
    };
  }

  // Soft delete contacts by setting deleted_at
  const { error: deleteError } = await supabase
    .from('contacts')
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .in('id', contactIdsToDelete);

  if (deleteError) {
    throw new Error(`Failed to delete contacts: ${deleteError.message}`);
  }

  return {
    success: true,
    message: `Successfully deleted ${contactIdsToDelete.length} contact(s)${reason ? `: ${reason}` : ''}`,
    deleted_count: contactIdsToDelete.length,
    deleted_ids: contactIdsToDelete
  };
}

// ============================================
// QUOTE MANAGEMENT FUNCTIONS
// ============================================

async function getQuote(args, supabase) {
  const { contact_id, quote_id, contact_name } = args;

  // If contact_name is provided, search for the contact first
  let resolvedContactId = contact_id;
  
  if (contact_name && !contact_id && !quote_id) {
    // Search for contact by name (same logic as getContract)
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactError) {
      console.error('Error searching for contact:', contactError);
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}". Please check the spelling or try using a contact ID.`,
        quote: null
      };
    }
    
    if (contacts.length > 1) {
      return {
        success: false,
        message: `Found ${contacts.length} contacts matching "${contact_name}". Please be more specific or use a contact ID.`,
        matching_contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        })),
        quote: null
      };
    }
    
    resolvedContactId = contacts[0].id;
    console.log(`Found contact "${contacts[0].first_name} ${contacts[0].last_name}" (ID: ${resolvedContactId}) for quote lookup`);
  }

  if (!resolvedContactId && !quote_id) {
    throw new Error('Either contact_id, quote_id, or contact_name is required');
  }

  let query = supabase.from('quote_selections').select('*');

  if (quote_id) {
    query = query.eq('id', quote_id).single();
  } else {
    query = query.eq('lead_id', resolvedContactId).maybeSingle();
  }

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get quote: ${error.message}`);
  }

  if (!data) {
    return {
      success: false,
      message: 'Quote not found'
    };
  }

  return {
    success: true,
    quote: data
  };
}

async function createQuote(args, supabase) {
  const { contact_id, package_name, package_price, addons = [], total_price, discount_code } = args;

  if (!contact_id || !package_name || package_price === undefined || total_price === undefined) {
    throw new Error('contact_id, package_name, package_price, and total_price are required');
  }

  const quoteData = {
    lead_id: contact_id,
    package_id: 'custom', // or derive from package_name
    package_name: package_name,
    package_price: Number(package_price),
    addons: addons,
    total_price: Number(total_price),
    discount_code: discount_code || null,
    status: 'pending',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('quote_selections')
    .upsert(quoteData, {
      onConflict: 'lead_id'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create quote: ${error.message}`);
  }

  return {
    success: true,
    quote: data,
    message: 'Quote created successfully'
  };
}

// ============================================
// INVOICE MANAGEMENT FUNCTIONS
// ============================================

async function getInvoice(args, supabase) {
  const { contact_id, invoice_id, contact_name } = args;

  // If contact_name is provided, search for the contact first
  let resolvedContactId = contact_id;
  
  if (contact_name && !contact_id && !invoice_id) {
    // Search for contact by name (same logic as getContract)
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactError) {
      console.error('Error searching for contact:', contactError);
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}". Please check the spelling or try using a contact ID.`,
        invoices: []
      };
    }
    
    if (contacts.length > 1) {
      return {
        success: false,
        message: `Found ${contacts.length} contacts matching "${contact_name}". Please be more specific or use a contact ID.`,
        matching_contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        })),
        invoices: []
      };
    }
    
    resolvedContactId = contacts[0].id;
    console.log(`Found contact "${contacts[0].first_name} ${contacts[0].last_name}" (ID: ${resolvedContactId}) for invoice lookup`);
  }

  if (!resolvedContactId && !invoice_id) {
    throw new Error('Either contact_id, invoice_id, or contact_name is required');
  }

  let query = supabase.from('invoices').select('*');

  if (invoice_id) {
    query = query.eq('id', invoice_id).single();
  } else {
    // Query by contact_id - get all invoices, not just one
    query = query.eq('contact_id', resolvedContactId).order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    // PGRST116 is "not found" which is acceptable
    if (error.code === 'PGRST116') {
      return {
      success: false,
      message: 'Invoice not found',
      invoices: []
    };
    }
    console.error('Error fetching invoice:', error);
    throw new Error(`Failed to get invoice: ${error.message}`);
  }

  // Get quote_id for the invoice(s) - needed for client-facing URLs
  // The quote_id is the same as the contact_id (quote_selections.id = contact_id)
  const quoteId = resolvedContactId || contact_id || null;
  
  // If invoice data exists, try to get quote_id from quote_selections
  let quoteIdFromQuote = null;
  if (data) {
    const invoiceData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
    
    // Only try to get quote_id if we have valid invoice data
    if (invoiceData && invoiceData.id) {
      // Find quote_selections that references this invoice
      const { data: quoteWithInvoice } = await supabase
        .from('quote_selections')
        .select('id')
        .eq('invoice_id', invoiceData.id)
        .maybeSingle();
      
      // If not found by invoice_id, try to get quote by contact_id
      if (!quoteWithInvoice && invoiceData.contact_id) {
        const { data: quoteByContact } = await supabase
          .from('quote_selections')
          .select('id')
          .eq('lead_id', invoiceData.contact_id)
          .maybeSingle();
        quoteIdFromQuote = quoteByContact?.id || null;
      } else {
        quoteIdFromQuote = quoteWithInvoice?.id || null;
      }
    }
  }
  
  // Use quote_id from quote_selections if found, otherwise use contact_id
  const finalQuoteId = quoteIdFromQuote || quoteId;

  // Handle case where query returns array (contact_id) vs single (invoice_id)
  if (invoice_id) {
    // Single invoice lookup
    if (!data) {
      return {
        success: false,
        message: 'Invoice not found',
        contact_id: resolvedContactId || contact_id,
        quote_id: finalQuoteId || quoteId
      };
    }
    return {
      success: true,
      invoice: data,
      contact_id: data.contact_id,
      quote_id: finalQuoteId || quoteId
    };
  } else {
    // Multiple invoices for a contact
    const invoices = Array.isArray(data) ? data : (data ? [data] : []);
    
    if (invoices.length === 0) {
      return {
        success: false,
        message: `No invoices found for this contact${resolvedContactId ? ` (ID: ${resolvedContactId})` : ''}.`,
        invoices: [],
        contact_id: resolvedContactId || contact_id,
        quote_id: finalQuoteId
      };
    }

    // Return the most recent invoice as primary, but also include all invoices
    return {
      success: true,
      invoice: invoices[0], // Most recent
      invoices: invoices, // All invoices
      count: invoices.length,
      contact_id: resolvedContactId || contact_id,
      quote_id: finalQuoteId || quoteId
    };
  }
}

async function updateInvoice(args, supabase) {
  const { invoice_id, line_items, total_amount, status } = args;

  if (!invoice_id) {
    throw new Error('invoice_id is required');
  }

  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (line_items) {
    updateData.line_items = line_items;
  }

  if (total_amount !== undefined) {
    updateData.total_amount = Number(total_amount);
    updateData.balance_due = Number(total_amount);
  }

  if (status) {
    updateData.invoice_status = status;
    if (status === 'Sent') {
      updateData.sent_date = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoice_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update invoice: ${error.message}`);
  }

  return {
    success: true,
    invoice: data,
    message: 'Invoice updated successfully'
  };
}

async function getPayments(args, supabase) {
  const { contact_id, payment_id, contact_name, status, limit = 50 } = args;

  // If contact_name is provided, search for the contact first
  let resolvedContactId = contact_id;
  
  if (contact_name && !contact_id && !payment_id) {
    // Search for contact by name (same logic as getContract/getInvoice)
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactError) {
      console.error('Error searching for contact:', contactError);
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}". Please check the spelling or try using a contact ID.`,
        payments: []
      };
    }
    
    if (contacts.length > 1) {
      return {
        success: false,
        message: `Found ${contacts.length} contacts matching "${contact_name}". Please be more specific or use a contact ID.`,
        matching_contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        })),
        payments: []
      };
    }
    
    resolvedContactId = contacts[0].id;
    console.log(`Found contact "${contacts[0].first_name} ${contacts[0].last_name}" (ID: ${resolvedContactId}) for payment lookup`);
  }

  if (!resolvedContactId && !payment_id) {
    throw new Error('Either contact_id, payment_id, or contact_name is required');
  }

  let query = supabase.from('payments').select('*');

  if (payment_id) {
    query = query.eq('id', payment_id).single();
  } else {
    // Query by contact_id - get all payments
    query = query.eq('contact_id', resolvedContactId);
    
    if (status) {
      query = query.eq('payment_status', status);
    }
    
    query = query.order('transaction_date', { ascending: false })
                 .order('created_at', { ascending: false })
                 .limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    // PGRST116 is "not found" which is acceptable
    if (error.code === 'PGRST116') {
      return {
        success: false,
        message: 'Payment not found',
        payments: []
      };
    }
    console.error('Error fetching payments:', error);
    throw new Error(`Failed to get payments: ${error.message}`);
  }

  // Get quote_id for client-facing URLs
  const quoteId = resolvedContactId || contact_id || null;

  // Handle case where query returns array (contact_id) vs single (payment_id)
  if (payment_id) {
    // Single payment lookup
    if (!data) {
      return {
        success: false,
        message: 'Payment not found',
        contact_id: resolvedContactId || contact_id,
        quote_id: quoteId
      };
    }
    return {
      success: true,
      payment: data,
      payments: [data],
      contact_id: data.contact_id,
      quote_id: quoteId
    };
  } else {
    // Multiple payments for a contact
    const payments = Array.isArray(data) ? data : (data ? [data] : []);
    
    if (payments.length === 0) {
      return {
        success: false,
        message: `No payments found for this contact${resolvedContactId ? ` (ID: ${resolvedContactId})` : ''}.`,
        payments: [],
        contact_id: resolvedContactId || contact_id,
        quote_id: quoteId
      };
    }

    // Calculate totals
    const totalPaid = payments
      .filter(p => p.payment_status === 'Paid')
      .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
    
    const totalPending = payments
      .filter(p => p.payment_status === 'Pending')
      .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);

    // Get quote data to calculate total amount, deposit, and remaining balance
    let quoteTotal = 0;
    let depositAmount = 0;
    let remainingBalance = 0;
    let isFullyPaid = false;
    let hasDepositPaid = false;
    
    if (quoteId) {
      try {
        const { data: quote, error: quoteError } = await supabase
          .from('quote_selections')
          .select('total_price')
          .eq('lead_id', quoteId)
          .maybeSingle();
        
        if (!quoteError && quote && quote.total_price) {
          quoteTotal = parseFloat(quote.total_price) || 0;
          depositAmount = quoteTotal * 0.5; // 50% deposit
          remainingBalance = Math.max(0, quoteTotal - totalPaid);
          isFullyPaid = totalPaid >= quoteTotal;
          hasDepositPaid = totalPaid > 0 && totalPaid < quoteTotal;
        }
      } catch (quoteErr) {
        console.warn('Could not fetch quote for payment summary:', quoteErr);
        // Continue without quote data
      }
    }

    return {
      success: true,
      payments: payments,
      count: payments.length,
      total_paid: totalPaid,
      total_pending: totalPending,
      quote_total: quoteTotal,
      deposit_amount: depositAmount,
      remaining_balance: remainingBalance,
      is_fully_paid: isFullyPaid,
      has_deposit_paid: hasDepositPaid,
      contact_id: resolvedContactId || contact_id,
      quote_id: quoteId
    };
  }
}

async function getQuestionnaireLink(args, supabase) {
  const { contact_id, contact_name } = args;

  // If contact_name is provided, search for the contact first
  let resolvedContactId = contact_id;
  
  if (contact_name && !contact_id) {
    // Search for contact by name (same logic as other functions)
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactError) {
      console.error('Error searching for contact:', contactError);
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}". Please check the spelling or try using a contact ID.`
      };
    }
    
    if (contacts.length > 1) {
      return {
        success: false,
        message: `Found ${contacts.length} contacts matching "${contact_name}". Please be more specific or use a contact ID.`,
        matching_contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        }))
      };
    }
    
    resolvedContactId = contacts[0].id;
    console.log(`Found contact "${contacts[0].first_name} ${contacts[0].last_name}" (ID: ${resolvedContactId}) for questionnaire link`);
  }

  if (!resolvedContactId) {
    throw new Error('Either contact_id or contact_name is required');
  }

  // Get contact details for name
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address')
    .eq('id', resolvedContactId)
    .is('deleted_at', null)
    .single();

  if (contactError || !contact) {
    return {
      success: false,
      message: `Contact not found${resolvedContactId ? ` (ID: ${resolvedContactId})` : ''}.`
    };
  }

  // Check if questionnaire exists and get completion status
  const { data: questionnaire, error: questionnaireError } = await supabase
    .from('music_questionnaires')
    .select('id, created_at, updated_at, playlist_links')
    .eq('lead_id', resolvedContactId)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
  const questionnaireUrl = `${baseUrl}/quote/${resolvedContactId}/questionnaire`;

  // Determine completion status
  let completionStatus = 'Not started';
  let hasPlaylists = false;
  
  if (questionnaire && !questionnaireError) {
    hasPlaylists = questionnaire.playlist_links && 
                   Object.values(questionnaire.playlist_links).some(link => link && link.trim() !== '');
    completionStatus = hasPlaylists ? 'Partially completed' : 'Started';
    
    // Check if questionnaire was recently updated (within last day)
    if (questionnaire.updated_at) {
      const updatedDate = new Date(questionnaire.updated_at);
      const now = new Date();
      const daysSinceUpdate = (now - updatedDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 1) {
        completionStatus = hasPlaylists ? 'Recently updated' : 'In progress';
      }
    }
  }

  return {
    success: true,
    contact_id: resolvedContactId,
    contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address,
    questionnaire_url: questionnaireUrl,
    completion_status: completionStatus,
    has_playlists: hasPlaylists,
    questionnaire_id: questionnaire?.id || null
  };
}

async function getSchedulingLink(args, supabase) {
  const { contact_id, contact_name, include_contact_info = false } = args;

  // If contact_name is provided, search for the contact first
  let resolvedContactId = contact_id;
  let contact = null;
  
  if (contact_name && !contact_id) {
    // Search for contact by name (same logic as other functions)
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address, phone')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactError) {
      console.error('Error searching for contact:', contactError);
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}". Please check the spelling or try using a contact ID.`
      };
    }
    
    if (contacts.length > 1) {
      return {
        success: false,
        message: `Found ${contacts.length} contacts matching "${contact_name}". Please be more specific or use a contact ID.`,
        matching_contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        }))
      };
    }
    
    resolvedContactId = contacts[0].id;
    contact = contacts[0];
    console.log(`Found contact "${contact.first_name} ${contact.last_name}" (ID: ${resolvedContactId}) for scheduling link`);
  }

  // Get contact details if we have contact_id but no contact object
  if (resolvedContactId && !contact) {
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address, phone')
      .eq('id', resolvedContactId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contactData) {
      return {
        success: false,
        message: `Contact not found${resolvedContactId ? ` (ID: ${resolvedContactId})` : ''}.`
      };
    }
    
    contact = contactData;
  }

  // Build the scheduling URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
  let schedulingUrl = `${baseUrl}/schedule`;

  // Optionally add contact info as query parameters for personalization
  if (include_contact_info && contact) {
    const params = new URLSearchParams();
    if (contact.first_name) params.append('name', `${contact.first_name} ${contact.last_name || ''}`.trim());
    if (contact.email_address) params.append('email', contact.email_address);
    if (contact.phone) params.append('phone', contact.phone);
    
    if (params.toString()) {
      schedulingUrl += `?${params.toString()}`;
    }
  }

  return {
    success: true,
    contact_id: resolvedContactId || null,
    contact_name: contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address : null,
    scheduling_url: schedulingUrl,
    is_personalized: include_contact_info && contact !== null
  };
}

// ============================================
// CONTRACT MANAGEMENT FUNCTIONS
// ============================================

async function getContract(args, supabase) {
  const { contact_id, contract_id, contact_name } = args;

  // If contact_name is provided, search for the contact first
  let resolvedContactId = contact_id;
  
  if (contact_name && !contact_id && !contract_id) {
    // Search for contact by name
    const nameParts = contact_name.trim().split(/\s+/);
    let contactQuery = supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .is('deleted_at', null);
    
    if (nameParts.length === 1) {
      // Single name - search first or last name
      contactQuery = contactQuery.or(`first_name.ilike.%${nameParts[0]}%,last_name.ilike.%${nameParts[0]}%`);
    } else {
      // Multiple names - assume first and last
      contactQuery = contactQuery
        .ilike('first_name', `%${nameParts[0]}%`)
        .ilike('last_name', `%${nameParts[nameParts.length - 1]}%`);
    }
    
    const { data: contacts, error: contactError } = await contactQuery
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (contactError) {
      console.error('Error searching for contact:', contactError);
      throw new Error(`Failed to search for contact: ${contactError.message}`);
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: `No contact found with name "${contact_name}". Please check the spelling or try using a contact ID.`,
        contracts: []
      };
    }
    
    if (contacts.length > 1) {
      // Multiple matches - return them so user can choose
      return {
        success: false,
        message: `Found ${contacts.length} contacts matching "${contact_name}". Please be more specific or use a contact ID.`,
        matching_contacts: contacts.map(c => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
        })),
        contracts: []
      };
    }
    
    // Single match found
    resolvedContactId = contacts[0].id;
    console.log(`Found contact "${contacts[0].first_name} ${contacts[0].last_name}" (ID: ${resolvedContactId}) for contract lookup`);
  }

  if (!resolvedContactId && !contract_id) {
    throw new Error('Either contact_id, contract_id, or contact_name is required');
  }

  let data = null;
  let error = null;
  let contractFromQuote = null;

  if (contract_id) {
    // Direct contract lookup by ID
    const result = await supabase.from('contracts').select('*').eq('id', contract_id).single();
    data = result.data;
    error = result.error;
  } else {
    // For contact-based lookup, FIRST check quote_selections (this is how contracts are typically linked)
    const { data: quoteSelection, error: quoteError } = await supabase
      .from('quote_selections')
      .select('contract_id')
      .eq('lead_id', resolvedContactId)
      .not('contract_id', 'is', null)
      .maybeSingle();
    
    if (quoteError) {
      console.error('Error fetching quote_selections:', quoteError);
    }
    
    if (quoteSelection && quoteSelection.contract_id) {
      // Fetch the contract that's linked via quote_selections
      const contractResult = await supabase
        .from('contracts')
        .select('*')
        .eq('id', quoteSelection.contract_id)
        .single();
      
      if (contractResult.error) {
        console.error('Error fetching contract from quote_selections:', contractResult.error);
      }
      
      if (contractResult.data) {
        contractFromQuote = contractResult.data;
        console.log('Found contract via quote_selections:', contractResult.data.id);
      }
    }
    
    // Also check contracts table directly by contact_id (fallback)
    const directResult = await supabase
      .from('contracts')
      .select('*')
      .eq('contact_id', resolvedContactId)
      .order('created_at', { ascending: false });
    
    data = directResult.data;
    error = directResult.error;
    
    if (data && data.length > 0) {
      console.log('Found contract via direct contact_id lookup:', data.length, 'contract(s)');
    }
  }

  // Get quote_id for the contract(s) - needed for client-facing URLs
  // The quote_id is the same as the contact_id (quote_selections.id = contact_id)
  const quoteId = resolvedContactId || contact_id || null;

  // Prioritize contract from quote_selections (this is how contracts are typically linked)
  // Then fall back to direct contract lookup by contact_id
  let contractData = null;
  if (contractFromQuote) {
    contractData = contractFromQuote;
    console.log('Using contract from quote_selections:', contractData.id);
  } else if (data) {
    contractData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
    if (contractData) {
      console.log('Using contract from direct lookup:', contractData.id);
    }
  }
  
  // Handle errors from direct lookup (only if we don't have contractFromQuote)
  if (error && !contractFromQuote) {
    if (error.code === 'PGRST116') {
      console.log('No contract found via direct lookup (PGRST116)');
      return {
        success: false,
        message: 'Contract not found',
        contracts: [],
        contact_id: resolvedContactId || contact_id,
        quote_id: quoteId
      };
    }
    console.error('Error fetching contract:', error);
    throw new Error(`Failed to get contract: ${error.message}`);
  }
  
  // Check if we have any data
  if (!contractData) {
    console.log('No contract data found, returning success: false');
    return {
      success: false,
      message: `No contracts found for this contact${resolvedContactId ? ` (ID: ${resolvedContactId})` : ''}.`,
      contracts: [],
      contact_id: resolvedContactId || contact_id,
      quote_id: quoteId
    };
  }
  
  console.log('Contract found! Returning success: true with contract:', contractData.id);

  if (contract_id) {
    // Single contract lookup
    if (!contractData) {
      return {
        success: false,
        message: 'Contract not found',
        contact_id: contact_id || null,
        quote_id: contact_id || null
      };
    }
    return {
      success: true,
      contract: contractData,
      contact_id: contractData.contact_id || resolvedContactId || contact_id,
      quote_id: contractData.contact_id || resolvedContactId || contact_id || quoteId // Use contract's contact_id as quote_id
    };
  } else {
    // Multiple contracts for a contact (or single contract found)
    // contractData might be a single object (from quote_selections) or an array (from direct lookup)
    let contracts = [];
    if (Array.isArray(contractData)) {
      contracts = contractData;
    } else if (contractData) {
      contracts = [contractData];
    }
    
    if (contracts.length === 0) {
      return {
        success: false,
        message: `No contracts found for this contact${resolvedContactId ? ` (ID: ${resolvedContactId})` : ''}.`,
        contracts: [],
        contact_id: resolvedContactId || contact_id,
        quote_id: quoteId
      };
    }

    // Use the first contract (most recent)
    const contract = contracts[0];
    
    // Ensure we have contact_id - use from contract, resolvedContactId, or contact_id
    const finalContactId = contract.contact_id || resolvedContactId || contact_id;
    
    return {
      success: true,
      contract: contract,
      contracts: contracts, // All contracts
      count: contracts.length,
      contact_id: finalContactId,
      quote_id: finalContactId || quoteId // Use contact_id as quote_id
    };
  }
}

async function generateContract(args, supabase) {
  const { contact_id, total_amount, deposit_amount } = args;

  if (!contact_id || total_amount === undefined) {
    throw new Error('contact_id and total_amount are required');
  }

  // Get contact details
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .is('deleted_at', null)
    .single();

  if (!contact) {
    throw new Error('Contact not found');
  }

  // Generate contract number
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const contractNumber = `CONTRACT-${year}${month}-${random}`;

  // Get invoice if exists
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('contact_id', contact_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const contractData = {
    contact_id: contact_id,
    invoice_id: invoice?.id || null,
    contract_number: contractNumber,
    contract_type: 'service_agreement',
    event_name: contact.event_type ? `${contact.first_name || ''} ${contact.last_name || ''} ${contact.event_type}`.trim() : null,
    event_type: contact.event_type || null,
    event_date: contact.event_date || null,
    event_time: contact.event_time || null,
    venue_name: contact.venue_name || null,
    venue_address: contact.venue_address || null,
    guest_count: contact.guest_count || null,
    total_amount: Number(total_amount),
    deposit_amount: deposit_amount ? Number(deposit_amount) : Number(total_amount) * 0.5, // Default 50% deposit
    status: 'draft',
    contract_template: 'standard_service_agreement'
  };

  const { data, error } = await supabase
    .from('contracts')
    .insert([contractData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to generate contract: ${error.message}`);
  }

  return {
    success: true,
    contract: data,
    message: 'Contract generated successfully'
  };
}

// ============================================
// PROJECT/EVENT MANAGEMENT FUNCTIONS
// ============================================

async function createProject(args, supabase) {
  const { contact_id, event_name, event_date, venue_name, start_time, end_time, status } = args;

  if (!contact_id || !event_name) {
    throw new Error('contact_id and event_name are required');
  }

  // Get contact details
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .is('deleted_at', null)
    .single();

  if (!contact) {
    throw new Error('Contact not found');
  }

  const projectData = {
    submission_id: contact_id,
    event_name: event_name,
    client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
    client_email: contact.email_address,
    client_phone: contact.phone || null,
    event_type: contact.event_type || 'other',
    event_date: event_date || contact.event_date || new Date().toISOString().split('T')[0],
    venue_name: venue_name || contact.venue_name || null,
    venue_address: contact.venue_address || null,
    number_of_guests: contact.guest_count || null,
    status: status || 'confirmed',
    notes: `Auto-generated project from contact. Created on ${new Date().toLocaleDateString()}.`
  };

  // Add start_time and end_time if provided
  if (start_time) {
    projectData.start_time = start_time;
  }
  if (end_time) {
    projectData.end_time = end_time;
  }

  const { data, error } = await supabase
    .from('events')
    .insert([projectData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return {
    success: true,
    project: data,
    message: 'Project created successfully'
  };
}

async function getProject(args, supabase) {
  const { contact_id, project_id } = args;

  let query = supabase.from('events').select('*');

  if (project_id) {
    query = query.eq('id', project_id).single();
  } else if (contact_id) {
    query = query.eq('submission_id', contact_id).maybeSingle();
  } else {
    throw new Error('Either contact_id or project_id is required');
  }

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get project: ${error.message}`);
  }

  if (!data) {
    return {
      success: false,
      message: 'Project not found'
    };
  }

  return {
    success: true,
    project: data
  };
}

async function updateProject(args, supabase) {
  const { project_id, ...updates } = args;

  if (!project_id) {
    throw new Error('project_id is required');
  }

  // Parse event date if provided
  if (updates.event_date) {
    try {
      const dateObj = new Date(updates.event_date);
      if (!isNaN(dateObj.getTime())) {
        updates.event_date = dateObj.toISOString().split('T')[0];
      }
    } catch (err) {
      console.warn('Could not parse event date:', updates.event_date);
      delete updates.event_date;
    }
  }

  const updateData = {
    updated_at: new Date().toISOString()
  };

  const allowedFields = [
    'event_name', 'event_date', 'start_time', 'end_time',
    'venue_name', 'venue_address', 'number_of_guests', 'status', 'notes'
  ];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  });

  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', project_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return {
    success: true,
    project: data,
    message: 'Project updated successfully'
  };
}

// ============================================
// ANALYTICS & REPORTING FUNCTIONS
// ============================================

async function getDashboardStats(args, supabase) {
  const { date_range = 'month' } = args;

  // Calculate date filter
  const now = new Date();
  let startDate;
  
  switch (date_range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(0); // All time
  }

  const startDateStr = startDate.toISOString();

  // Get total contacts
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', startDateStr);

  // Get booked events
  const { count: bookedEvents } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('lead_status', 'Booked')
    .gte('created_at', startDateStr);

  // Get new leads
  const { count: newLeads } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('lead_status', 'New')
    .gte('created_at', startDateStr);

  // Calculate conversion rate
  const conversionRate = totalContacts > 0 
    ? ((bookedEvents / totalContacts) * 100).toFixed(1)
    : 0;

  return {
    success: true,
    stats: {
      total_contacts: totalContacts || 0,
      new_leads: newLeads || 0,
      booked_events: bookedEvents || 0,
      conversion_rate: `${conversionRate}%`,
      date_range: date_range
    }
  };
}

async function getHighestPaidProject(args, supabase) {
  const { limit = 1, date_range = 'all' } = args;

  // Calculate date filter
  const now = new Date();
  let startDate;
  
  switch (date_range) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(0); // All time
  }

  const startDateStr = startDate.toISOString();

  // Query events table for projects with total_amount, ordered by amount descending
  let query = supabase
    .from('events')
    .select('id, event_name, client_name, client_email, event_date, event_type, venue_name, venue_address, total_amount, deposit_amount, deposit_paid, final_payment_paid, status, created_at')
    .not('total_amount', 'is', null)
    .gte('created_at', startDateStr)
    .order('total_amount', { ascending: false })
    .limit(Math.min(limit, 10));

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get highest paid projects: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: 'No projects with payment information found',
      projects: []
    };
  }

  // Format the results
  const projects = data.map(project => ({
    project_id: project.id,
    event_name: project.event_name,
    client_name: project.client_name,
    client_email: project.client_email,
    event_date: project.event_date,
    event_type: project.event_type,
    venue_name: project.venue_name,
    venue_address: project.venue_address,
    total_amount: project.total_amount,
    deposit_amount: project.deposit_amount,
    deposit_paid: project.deposit_paid,
    final_payment_paid: project.final_payment_paid,
    status: project.status,
    formatted_amount: `$${Number(project.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }));

  return {
    success: true,
    count: projects.length,
    projects: projects,
    highest_amount: projects[0]?.formatted_amount || '$0.00',
    date_range: date_range
  };
}

async function getRecentLeads(args, supabase) {
  const { days = 7, limit = 10 } = args;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address, phone, event_type, event_date, venue_name, lead_status, created_at')
    .is('deleted_at', null)
    .gte('created_at', startDateStr)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 50));

  if (error) {
    throw new Error(`Failed to get recent leads: ${error.message}`);
  }

  return {
    success: true,
    count: data?.length || 0,
    leads: data || []
  };
}

async function getUpcomingEvents(args, supabase) {
  const { days = 7, lead_status = 'Booked', limit = 50 } = args;

  // Calculate date range - today to X days in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  const startDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const endDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

  let dbQuery = supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address, phone, event_type, event_date, venue_name, lead_status, created_at')
    .is('deleted_at', null)
    .eq('lead_status', lead_status)
    .not('event_date', 'is', null)
    .gte('event_date', startDateStr)
    .lte('event_date', endDateStr)
    .order('event_date', { ascending: true })
    .limit(Math.min(limit, 100));

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(`Failed to get upcoming events: ${error.message}`);
  }

  return {
    success: true,
    count: data?.length || 0,
    events: data || [],
    date_range: {
      start: startDateStr,
      end: endDateStr,
      days: days
    }
  };
}

async function initiateOutboundCall(args, supabase, userId) {
  const { contact_id, call_type = 'follow_up', message } = args;

  if (!contact_id) {
    throw new Error('contact_id is required');
  }

  // Get contact details
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contact_id)
    .single();

  if (contactError || !contact) {
    throw new Error(`Contact not found: ${contact_id}`);
  }

  if (!contact.phone) {
    throw new Error('Contact does not have a phone number');
  }

  // Call the outbound call API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    // Note: This requires admin authentication
    // We'll use a service-to-service call
    const response = await fetch(`${baseUrl}/api/livekit/outbound-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In production, you'd include the admin's session token
        // For now, the API will handle auth internally
      },
      body: JSON.stringify({
        contactId: contact_id,
        phoneNumber: contact.phone,
        callType: call_type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to initiate call');
    }

    const data = await response.json();

    return {
      success: true,
      message: `Initiating ${call_type} call to ${contact.first_name} ${contact.last_name} at ${contact.phone}`,
      roomName: data.roomName,
      status: data.status,
      note: data.note || 'Call room created. AI will handle the conversation when the call connects.',
    };
  } catch (error) {
    throw new Error(`Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getRevenueStats(args, supabase) {
  const { month, year, date_range = 'month', start_date, end_date } = args;

  // Calculate date range
  const now = new Date();
  let startDate;
  let endDate = new Date();
  
  // If month and year are provided, use those
  if (month && year) {
    startDate = new Date(year, month - 1, 1); // Month is 0-indexed
    endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
  } else if (start_date && end_date) {
    startDate = new Date(start_date);
    endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Use date_range
    switch (date_range) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(0); // All time
        endDate = new Date();
    }
  }

  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  // Query payments table for paid payments in date range
  let paymentsQuery = supabase
    .from('payments')
    .select('id, contact_id, total_amount, transaction_date, payment_status, payment_method, stripe_payment_intent, stripe_session_id, created_at')
    .eq('payment_status', 'Paid')
    .gte('transaction_date', startDateStr.split('T')[0]) // Use date part only
    .lte('transaction_date', endDateStr.split('T')[0])
    .order('transaction_date', { ascending: false });

  const { data: payments, error } = await paymentsQuery;

  if (error) {
    throw new Error(`Failed to get revenue stats: ${error.message}`);
  }

  // Calculate totals
  const totalRevenue = payments?.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0) || 0;
  const paymentCount = payments?.length || 0;

  // Get contact names for payments
  const contactIds = [...new Set(payments?.map(p => p.contact_id).filter(Boolean) || [])];
  let contactsMap = {};
  
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .in('id', contactIds);
    
    if (contacts) {
      contactsMap = contacts.reduce((acc, c) => {
        acc[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim();
        return acc;
      }, {});
    }
  }

  // Format payment breakdown
  const paymentBreakdown = payments?.map(p => ({
    id: p.id,
    contact_id: p.contact_id,
    contact_name: contactsMap[p.contact_id] || 'Unknown',
    amount: parseFloat(p.total_amount) || 0,
    formatted_amount: `$${(parseFloat(p.total_amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    transaction_date: p.transaction_date,
    payment_method: p.payment_method || 'Unknown',
    has_stripe: !!(p.stripe_payment_intent || p.stripe_session_id)
  })) || [];

  // Calculate average payment
  const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;

  // Format period string
  let periodString = '';
  if (month && year) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    periodString = `${monthNames[month - 1]} ${year}`;
  } else {
    periodString = date_range === 'month' ? 'This month' : date_range.charAt(0).toUpperCase() + date_range.slice(1);
  }

  return {
    success: true,
    period: periodString,
    start_date: startDateStr.split('T')[0],
    end_date: endDateStr.split('T')[0],
    total_revenue: totalRevenue,
    formatted_total_revenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    payment_count: paymentCount,
    average_payment: averagePayment,
    formatted_average_payment: `$${averagePayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    payments: paymentBreakdown.slice(0, 20) // Limit to top 20 for display
  };
}

// ============================================
// COMMUNICATION FUNCTIONS
// ============================================

async function sendSMS(args, supabase) {
  const { contact_id, message } = args;

  if (!contact_id || !message) {
    throw new Error('contact_id and message are required');
  }

  // Get contact phone number
  const { data: contact } = await supabase
    .from('contacts')
    .select('phone, first_name, last_name')
    .eq('id', contact_id)
    .is('deleted_at', null)
    .single();

  if (!contact || !contact.phone) {
    throw new Error('Contact not found or has no phone number');
  }

  // Call send-sms API
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: contact.phone,
        body: message,
        from: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send SMS');
    }

    const data = await response.json();

    return {
      success: true,
      message: 'SMS sent successfully',
      message_sid: data.messageSid,
      recipient: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.phone
    };
  } catch (error) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

async function sendEmail(args, supabase) {
  const { contact_id, subject, message, to } = args;

  if (!contact_id || !subject || !message) {
    throw new Error('contact_id, subject, and message are required');
  }

  // Get contact email address
  const { data: contact } = await supabase
    .from('contacts')
    .select('email_address, first_name, last_name')
    .eq('id', contact_id)
    .is('deleted_at', null)
    .single();

  if (!contact || !contact.email_address) {
    throw new Error('Contact not found or has no email address');
  }

  const emailTo = to || contact.email_address;

  // Call send-email API
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/communications/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactId: contact_id,
        to: emailTo,
        subject: subject,
        content: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Email sent successfully',
      recipient: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || emailTo,
      email_to: emailTo
    };
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function requestReview(args, supabase) {
  const { contact_id, method } = args;

  if (!contact_id) {
    throw new Error('contact_id is required');
  }

  // Get contact details
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address, phone, lead_status, event_type, event_date, organization_id')
    .eq('id', contact_id)
    .is('deleted_at', null)
    .single();

  if (contactError || !contact) {
    throw new Error('Contact not found');
  }

  // Get Google Review link from organization
  let GOOGLE_REVIEW_LINK = 'https://g.page/r/CSD9ayo7-MivEBE/review'; // Default fallback
  
  if (contact.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('google_review_link')
      .eq('id', contact.organization_id)
      .single();
    
    if (org?.google_review_link) {
      GOOGLE_REVIEW_LINK = org.google_review_link;
    }
  }

  // Check if contact has completed status or completed projects
  const hasCompletedStatus = contact.lead_status === 'Completed';
  
  // Check for completed projects/events
  const { data: projects } = await supabase
    .from('events')
    .select('id, status')
    .eq('contact_id', contact_id)
    .eq('status', 'Completed')
    .limit(1);

  const hasCompletedProjects = projects && projects.length > 0;

  if (!hasCompletedStatus && !hasCompletedProjects) {
    return {
      success: false,
      error: 'Contact does not have completed status or completed events. Review requests should only be sent to past clients.',
      contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone
    };
  }

  // Determine contact name for personalization
  const contactName = contact.first_name || 'there';
  const eventType = contact.event_type ? contact.event_type.replace('_', ' ') : 'event';

  // Generate review request message
  const reviewMessage = `Hi ${contactName}! 

I hope you had a wonderful time at your ${eventType}! I'd be incredibly grateful if you could take a moment to share your experience with M10 DJ Company on Google.

Your feedback helps us continue to provide great service and helps other couples and event planners find us.

Here's the link: ${GOOGLE_REVIEW_LINK}

Thank you so much for choosing M10 DJ Company!

Best,
Ben`;

  const reviewSubject = `How was your ${eventType}?`;

  // Determine which method(s) to use
  const hasEmail = !!contact.email_address;
  const hasPhone = !!contact.phone;
  const useEmail = method === 'email' || (method !== 'sms' && hasEmail);
  const useSMS = method === 'sms' || (method === 'both' && hasPhone);

  const results = {
    success: true,
    contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
    methods_attempted: [],
    methods_succeeded: [],
    methods_failed: []
  };

  // Send email if requested and available
  if (useEmail && hasEmail) {
    try {
      const emailResult = await sendEmail({
        contact_id: contact_id,
        subject: reviewSubject,
        message: reviewMessage
      }, supabase);
      
      results.methods_attempted.push('email');
      if (emailResult.success) {
        results.methods_succeeded.push('email');
      } else {
        results.methods_failed.push({ method: 'email', error: emailResult.error });
      }
    } catch (error) {
      results.methods_attempted.push('email');
      results.methods_failed.push({ method: 'email', error: error.message });
    }
  }

  // Send SMS if requested and available
  if (useSMS && hasPhone) {
    try {
      const smsResult = await sendSMS({
        contact_id: contact_id,
        message: reviewMessage
      }, supabase);
      
      results.methods_attempted.push('sms');
      if (smsResult.success) {
        results.methods_succeeded.push('sms');
      } else {
        results.methods_failed.push({ method: 'sms', error: smsResult.error });
      }
    } catch (error) {
      results.methods_attempted.push('sms');
      results.methods_failed.push({ method: 'sms', error: error.message });
    }
  }

  // If no methods were available
  if (!hasEmail && !hasPhone) {
    return {
      success: false,
      error: 'Contact has no email address or phone number',
      contact_name: results.contact_name
    };
  }

  // If all methods failed
  if (results.methods_succeeded.length === 0) {
    return {
      success: false,
      error: 'Failed to send review request via all attempted methods',
      contact_name: results.contact_name,
      contact_id: contact_id,
      methods_failed: results.methods_failed
    };
  }

  results.contact_id = contact_id;
  return results;
}

async function getCommunicationHistory(args, supabase) {
  const { contact_id, contact_name, limit = 50, communication_type = 'all' } = args;

  // Resolve contact_id if contact_name is provided
  let resolvedContactId = contact_id;
  if (!resolvedContactId && contact_name) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .or(`first_name.ilike.%${contact_name}%,last_name.ilike.%${contact_name}%`)
      .is('deleted_at', null)
      .limit(1);

    if (contacts && contacts.length > 0) {
      resolvedContactId = contacts[0].id;
    } else {
      return {
        success: false,
        error: `Contact not found: ${contact_name}`
      };
    }
  }

  if (!resolvedContactId) {
    return {
      success: false,
      error: 'contact_id or contact_name is required'
    };
  }

  try {
    // Call the existing communications API endpoint logic
    const allCommunications = [];

    // 1. Get contact details for matching
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, email_address, phone, first_name, last_name')
      .eq('id', resolvedContactId)
      .is('deleted_at', null)
      .single();

    if (!contactData) {
      return {
        success: false,
        error: 'Contact not found'
      };
    }

    // 2. Fetch SMS conversations
    if (communication_type === 'all' || communication_type === 'sms') {
      // Try by customer_id
      const { data: smsByCustomerId } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('customer_id', resolvedContactId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (smsByCustomerId) {
        smsByCustomerId.forEach(msg => {
          allCommunications.push({
            id: msg.id,
            type: 'sms',
            direction: msg.direction || (msg.message_type === 'admin' ? 'outbound' : 'inbound'),
            content: msg.message_content,
            subject: null,
            status: msg.message_status || 'sent',
            sent_by: msg.message_type === 'admin' ? 'Admin' : 'Client',
            sent_to: msg.phone_number,
            created_at: msg.created_at,
            metadata: {
              twilio_message_sid: msg.twilio_message_sid,
              message_type: msg.message_type
            }
          });
        });
      }

      // Also try by phone number
      if (contactData.phone) {
        const { data: smsByPhone } = await supabase
          .from('sms_conversations')
          .select('*')
          .eq('phone_number', contactData.phone)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (smsByPhone) {
          smsByPhone.forEach(msg => {
            // Avoid duplicates
            if (!allCommunications.find(c => c.id === msg.id)) {
              allCommunications.push({
                id: msg.id,
                type: 'sms',
                direction: msg.direction || (msg.message_type === 'admin' ? 'outbound' : 'inbound'),
                content: msg.message_content,
                subject: null,
                status: msg.message_status || 'sent',
                sent_by: msg.message_type === 'admin' ? 'Admin' : 'Client',
                sent_to: msg.phone_number,
                created_at: msg.created_at,
                metadata: {
                  twilio_message_sid: msg.twilio_message_sid,
                  message_type: msg.message_type
                }
              });
            }
          });
        }
      }
    }

    // 3. Fetch email tracking
    if (communication_type === 'all' || communication_type === 'email') {
      const { data: emailTracking } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('contact_id', resolvedContactId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (emailTracking) {
        emailTracking.forEach(email => {
          allCommunications.push({
            id: email.id,
            type: 'email',
            direction: 'outbound',
            content: email.subject || 'Email sent',
            subject: email.subject,
            status: email.opened_at ? 'read' : (email.event_type === 'sent' ? 'sent' : 'delivered'),
            sent_by: 'Admin',
            sent_to: email.recipient_email,
            created_at: email.created_at,
            metadata: {
              email_id: email.email_id,
              opened_at: email.opened_at,
              event_type: email.event_type
            }
          });
        });
      }
    }

    // 4. Fetch communication_log entries (via contact_submissions)
    if (communication_type === 'all' || ['email', 'sms', 'call', 'note'].includes(communication_type)) {
      let submissionIds = [];
      
      if (contactData.email_address) {
        const { data: submissionsByEmail } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('email', contactData.email_address);
        
        if (submissionsByEmail) {
          submissionIds = submissionsByEmail.map(s => s.id);
        }
      }

      if (contactData.phone) {
        const { data: submissionsByPhone } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('phone', contactData.phone);
        
        if (submissionsByPhone) {
          submissionIds = [...submissionIds, ...submissionsByPhone.map(s => s.id)];
        }
      }

      if (submissionIds.length > 0) {
        let commLogQuery = supabase
          .from('communication_log')
          .select('*')
          .in('contact_submission_id', submissionIds)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (communication_type !== 'all') {
          commLogQuery = commLogQuery.eq('communication_type', communication_type);
        }

        const { data: commLogs } = await commLogQuery;

        if (commLogs) {
          commLogs.forEach(log => {
            // Avoid duplicates
            if (!allCommunications.find(c => c.id === log.id)) {
              allCommunications.push({
                id: log.id,
                type: log.communication_type,
                direction: log.direction,
                content: log.content,
                subject: log.subject,
                status: log.status,
                sent_by: log.sent_by || 'Admin',
                sent_to: log.sent_to,
                created_at: log.created_at,
                metadata: log.metadata || {}
              });
            }
          });
        }
      }
    }

    // 5. Fetch notes from contacts table
    if (communication_type === 'all' || communication_type === 'note') {
      const { data: contactNotes } = await supabase
        .from('contacts')
        .select('notes, updated_at')
        .eq('id', resolvedContactId)
        .single();

      if (contactNotes?.notes) {
        allCommunications.push({
          id: `note-${resolvedContactId}`,
          type: 'note',
          direction: 'outbound',
          content: contactNotes.notes,
          subject: 'Contact Notes',
          status: 'active',
          sent_by: 'Admin',
          sent_to: null,
          created_at: contactNotes.updated_at || new Date().toISOString(),
          metadata: {}
        });
      }
    }

    // Sort all communications by date (newest first)
    allCommunications.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Apply limit
    const limitedCommunications = allCommunications.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      total: limitedCommunications.length,
      by_type: {
        email: limitedCommunications.filter(c => c.type === 'email').length,
        sms: limitedCommunications.filter(c => c.type === 'sms').length,
        call: limitedCommunications.filter(c => c.type === 'call').length,
        note: limitedCommunications.filter(c => c.type === 'note').length
      },
      by_direction: {
        inbound: limitedCommunications.filter(c => c.direction === 'inbound').length,
        outbound: limitedCommunications.filter(c => c.direction === 'outbound').length
      },
      last_contact: limitedCommunications.length > 0 ? limitedCommunications[0].created_at : null
    };

    return {
      success: true,
      contact_id: resolvedContactId,
      contact_name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || contactData.email_address || contactData.phone,
      communications: limitedCommunications,
      summary: summary
    };
  } catch (error) {
    console.error('Error fetching communication history:', error);
    return {
      success: false,
      error: `Failed to fetch communication history: ${error.message}`
    };
  }
}

// ============================================
// PUBLIC VOICE ASSISTANT FUNCTIONS
// ============================================

/**
 * Schedule a consultation for a customer
 */
async function scheduleConsultation(args, supabase) {
  try {
    const { contact_id, email, name } = args;
    
    if (!email || !name) {
      return {
        success: false,
        error: 'Email and name are required'
      };
    }

    // Build schedule link with pre-filled data
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
    const scheduleParams = new URLSearchParams();
    scheduleParams.set('name', name);
    scheduleParams.set('email', email);
    if (contact_id) {
      scheduleParams.set('contactId', contact_id);
    }

    const scheduleLink = `${baseUrl}/schedule?${scheduleParams.toString()}`;

    return {
      success: true,
      message: `I've prepared a consultation scheduling link for you. You can book a time that works for you at: ${scheduleLink}`,
      link: scheduleLink,
      contact_id: contact_id || null
    };
  } catch (error) {
    console.error('Error scheduling consultation:', error);
    return {
      success: false,
      error: error.message || 'Failed to schedule consultation'
    };
  }
}

/**
 * Request a quote for an event
 */
async function requestQuote(args, supabase) {
  try {
    const { contact_id, event_type, event_date, guest_count, notes } = args;

    if (!event_type) {
      return {
        success: false,
        error: 'Event type is required'
      };
    }

    // If contact_id exists, create a quote request
    if (contact_id) {
      // Get contact details
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contact_id)
        .single();

      if (contact) {
        // Create a project/event for this quote request
        const { data: project } = await supabase
          .from('events')
          .insert({
            contact_id: contact_id,
            event_type: event_type,
            event_date: event_date || null,
            guest_count: guest_count || null,
            notes: notes || null,
            status: 'quote_requested',
          })
          .select()
          .single();

        return {
          success: true,
          message: `I've submitted your quote request for a ${event_type} event. Our team will prepare a custom quote and get back to you soon!`,
          project_id: project?.id || null,
          contact_id: contact_id
        };
      }
    }

    // If no contact_id, just acknowledge the request
    return {
      success: true,
      message: `I've noted your interest in a ${event_type} event. To get a custom quote, I'll need a bit more information. Would you like to provide your contact details?`,
      event_type: event_type
    };
  } catch (error) {
    console.error('Error requesting quote:', error);
    return {
      success: false,
      error: error.message || 'Failed to request quote'
    };
  }
}

/**
 * Get music recommendations based on event type and preferences
 */
async function getMusicRecommendations(args) {
  try {
    const { event_type, mood, genre, era } = args;

    // Music recommendations database (you can expand this)
    const recommendations = {
      wedding: {
        upbeat: ['Celebration - Kool & The Gang', 'I Wanna Dance with Somebody - Whitney Houston', 'Uptown Funk - Bruno Mars'],
        romantic: ['At Last - Etta James', 'Perfect - Ed Sheeran', 'All of Me - John Legend'],
        classic: ['Can\'t Help Myself - Four Tops', 'My Girl - The Temptations', 'Unchained Melody - Righteous Brothers'],
      },
      corporate: {
        modern: ['Blinding Lights - The Weeknd', 'Levitating - Dua Lipa', 'Good as Hell - Lizzo'],
        classic: ['September - Earth, Wind & Fire', 'Dancing Queen - ABBA', 'I Will Survive - Gloria Gaynor'],
      },
      school_dance: {
        energetic: ['Old Town Road - Lil Nas X', 'Watermelon Sugar - Harry Styles', 'Savage - Megan Thee Stallion'],
        classic: ['Cha Cha Slide - DJ Casper', 'Cupid Shuffle - Cupid', 'Electric Slide - Marcia Griffiths'],
      },
    };

    let suggestions = [];

    if (event_type && recommendations[event_type]) {
      if (mood && recommendations[event_type][mood]) {
        suggestions = recommendations[event_type][mood];
      } else {
        // Get all suggestions for this event type
        Object.values(recommendations[event_type]).forEach((songs) => {
          suggestions = suggestions.concat(songs);
        });
      }
    }

    // Filter by genre or era if specified
    if (genre || era) {
      // In a real implementation, you'd filter from a larger database
      suggestions = suggestions.slice(0, 10); // Limit results
    }

    if (suggestions.length === 0) {
      suggestions = [
        'Celebration - Kool & The Gang',
        'I Wanna Dance with Somebody - Whitney Houston',
        'Uptown Funk - Bruno Mars',
        'Blinding Lights - The Weeknd',
        'September - Earth, Wind & Fire',
      ];
    }

    return {
      success: true,
      message: `Here are some great song recommendations for your ${event_type || 'event'}: ${suggestions.slice(0, 5).join(', ')}. Would you like more suggestions or to discuss your music preferences in detail?`,
      recommendations: suggestions.slice(0, 10),
      event_type: event_type || null,
      mood: mood || null,
    };
  } catch (error) {
    console.error('Error getting music recommendations:', error);
    return {
      success: false,
      error: error.message || 'Failed to get music recommendations'
    };
  }
}

