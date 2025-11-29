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

      case 'get_recent_leads':
        return await getRecentLeads(args, supabase);

      // ============================================
      // COMMUNICATION
      // ============================================
      case 'send_sms':
        return await sendSMS(args, supabase);

      case 'send_email':
        return await sendEmail(args, supabase);

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
    .select('id, first_name, last_name, email_address, phone, event_type, event_date, venue_name, lead_status, created_at')
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

  // Get related records
  const [quoteResult, invoiceResult, contractResult, projectResult] = await Promise.all([
    supabase.from('quote_selections').select('*').eq('lead_id', contact_id).maybeSingle(),
    supabase.from('invoices').select('*').eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('contracts').select('*').eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('events').select('*').eq('submission_id', contact_id).maybeSingle()
  ]);

  return {
    success: true,
    contact,
    quote: quoteResult.data || null,
    invoice: invoiceResult.data || null,
    contract: contractResult.data || null,
    project: projectResult.data || null
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

// ============================================
// QUOTE MANAGEMENT FUNCTIONS
// ============================================

async function getQuote(args, supabase) {
  const { contact_id, quote_id } = args;

  let query = supabase.from('quote_selections').select('*');

  if (quote_id) {
    query = query.eq('id', quote_id).single();
  } else if (contact_id) {
    query = query.eq('lead_id', contact_id).maybeSingle();
  } else {
    throw new Error('Either contact_id or quote_id is required');
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
  const { contact_id, invoice_id } = args;

  let query = supabase.from('invoices').select('*');

  if (invoice_id) {
    query = query.eq('id', invoice_id).single();
  } else if (contact_id) {
    query = query.eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  } else {
    throw new Error('Either contact_id or invoice_id is required');
  }

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get invoice: ${error.message}`);
  }

  if (!data) {
    return {
      success: false,
      message: 'Invoice not found'
    };
  }

  return {
    success: true,
    invoice: data
  };
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

// ============================================
// CONTRACT MANAGEMENT FUNCTIONS
// ============================================

async function getContract(args, supabase) {
  const { contact_id, contract_id } = args;

  let query = supabase.from('contracts').select('*');

  if (contract_id) {
    query = query.eq('id', contract_id).single();
  } else if (contact_id) {
    query = query.eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  } else {
    throw new Error('Either contact_id or contract_id is required');
  }

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get contract: ${error.message}`);
  }

  if (!data) {
    return {
      success: false,
      message: 'Contract not found'
    };
  }

  return {
    success: true,
    contract: data
  };
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
  const { contact_id, event_name, event_date, venue_name } = args;

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
    status: 'confirmed',
    notes: `Auto-generated project from contact. Created on ${new Date().toLocaleDateString()}.`
  };

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
    'venue_name', 'venue_address', 'number_of_guests', 'status'
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

