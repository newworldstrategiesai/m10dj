/**
 * Format Function Results into Structured UI Content
 * 
 * Converts function execution results into structured format with buttons and cards
 */

export function formatResponseWithUI(functionName, result, functionArgs) {
  // Some functions handle their own error cases and return buttons/links even when success: false
  // So we should still call them to get the formatted response
  const functionsThatHandleErrors = ['get_contract', 'get_invoice', 'get_quote'];
  
  // Don't format if there was an error, unless it's a function that handles its own errors
  if (!result.success && !functionsThatHandleErrors.includes(functionName)) {
    return null;
  }

  switch (functionName) {
    case 'search_contacts':
      return formatSearchContacts(result, functionArgs);
    
    case 'get_contact_details':
      return formatContactDetails(result);
    
    case 'get_quote':
      return formatQuote(result);
    
    case 'get_invoice':
      return formatInvoice(result);
    
    case 'get_payments':
      return formatPayments(result);
    
    case 'get_questionnaire_link':
      return formatQuestionnaireLink(result);
    
    case 'get_scheduling_link':
      return formatSchedulingLink(result);
    
    case 'get_contract':
      return formatContract(result);
    
    case 'get_recent_leads':
      return formatRecentLeads(result);
    
    case 'get_dashboard_stats':
      return formatDashboardStats(result);
    
    case 'get_revenue_stats':
      return formatRevenueStats(result);
    
    case 'get_highest_paid_project':
      return formatHighestPaidProject(result);
    
    case 'create_quote':
    case 'create_project':
    case 'generate_contract':
      return formatCreationResult(functionName, result);
    
    case 'request_review':
      return formatReviewRequest(result);
    
    case 'get_communication_history':
      return formatCommunicationHistory(result);
    
    case 'get_recent_song_requests':
      return formatSongRequests(result);
    
    case 'update_song_request_status':
      return formatSongRequestUpdate(result);
    
    default:
      return null;
  }
}

function formatSearchContacts(result, functionArgs = {}) {
  if (!result.contacts || result.contacts.length === 0) {
    return null;
  }

  // Check if this is a booked events query
  const isBookedEvents = functionArgs?.lead_status === 'Booked' || 
                         (result.contacts.length > 0 && result.contacts.every(c => c.lead_status === 'Booked'));

  // Sort by event date if booked events (upcoming first)
  let sortedContacts = [...result.contacts];
  if (isBookedEvents) {
    sortedContacts.sort((a, b) => {
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return new Date(a.event_date) - new Date(b.event_date);
    });
  }

  const cards = sortedContacts.slice(0, 5).map(contact => {
    const fields = [];
    
    // For booked events, prioritize event information
    if (isBookedEvents && contact.event_date) {
      const eventDate = new Date(contact.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDateOnly = new Date(eventDate);
      eventDateOnly.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((eventDateOnly - today) / (1000 * 60 * 60 * 24));
      
      let eventDateText = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      if (daysUntil < 0) {
        eventDateText += ` (${Math.abs(daysUntil)} days ago)`;
      } else if (daysUntil === 0) {
        eventDateText += ' (Today!)';
      } else if (daysUntil === 1) {
        eventDateText += ' (Tomorrow!)';
      } else if (daysUntil < 7) {
        eventDateText += ` (${daysUntil} days away)`;
      } else if (daysUntil < 30) {
        eventDateText += ` (${Math.floor(daysUntil / 7)} weeks away)`;
      } else {
        eventDateText += ` (${Math.floor(daysUntil / 30)} months away)`;
      }
      
      fields.push({ label: 'Event Date', value: eventDateText });
    } else if (contact.event_date) {
      fields.push({ label: 'Event Date', value: new Date(contact.event_date).toLocaleDateString() });
    }
    
    // Add event time if available
    if (contact.event_time) {
      fields.push({ label: 'Event Time', value: contact.event_time });
    }
    
    // Add venue prominently for booked events
    if (contact.venue_name) {
      fields.push({ label: 'Venue', value: contact.venue_name });
    }
    
    // Add guest count if available
    if (contact.guest_count) {
      fields.push({ label: 'Guest Count', value: contact.guest_count.toString() });
    }
    
    // Add payment status for booked events
    if (isBookedEvents && contact.payment_status) {
      const paymentStatus = contact.payment_status.charAt(0).toUpperCase() + contact.payment_status.slice(1);
      fields.push({ label: 'Payment Status', value: paymentStatus });
    }
    
    // Add last interaction info (less prominent for booked events)
    if (contact.last_contacted_date) {
      const lastContactDate = new Date(contact.last_contacted_date);
      const daysAgo = Math.floor((new Date() - lastContactDate) / (1000 * 60 * 60 * 24));
      let lastContactText = lastContactDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      if (daysAgo === 0) {
        lastContactText += ' (Today)';
      } else if (daysAgo === 1) {
        lastContactText += ' (Yesterday)';
      } else if (daysAgo < 7) {
        lastContactText += ` (${daysAgo} days ago)`;
      } else if (daysAgo < 30) {
        lastContactText += ` (${Math.floor(daysAgo / 7)} weeks ago)`;
      } else {
        lastContactText += ` (${Math.floor(daysAgo / 30)} months ago)`;
      }
      
      fields.push({ 
        label: 'Last Contact', 
        value: `${lastContactText}${contact.last_contact_type ? ` (${contact.last_contact_type})` : ''}` 
      });
    } else {
      fields.push({ label: 'Last Contact', value: 'Never contacted' });
    }
    
    // Add contact info
    if (contact.email_address) {
      fields.push({ label: 'Email', value: contact.email_address });
    }
    if (contact.phone) {
      fields.push({ label: 'Phone', value: contact.phone });
    }
    
    // Add status if not booked (or if it's different)
    if (contact.lead_status && contact.lead_status !== 'Booked') {
      fields.push({ label: 'Status', value: contact.lead_status });
    }
    
    const actions = [
      {
        label: 'View Details',
        action: 'link',
        value: `/admin/contacts/${contact.id}`,
        variant: 'default'
      }
    ];

    // Add Send SMS button if phone exists
    if (contact.phone) {
      actions.push({
        label: 'Send SMS',
        action: 'send_sms',
        value: '',
        variant: 'outline',
        metadata: {
          contact_id: contact.id,
          contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
          contact_phone: contact.phone,
        }
      });
    }

    // Add Send Email button if email exists
    if (contact.email_address) {
      actions.push({
        label: 'Send Email',
        action: 'send_email',
        value: '',
        variant: 'outline',
        metadata: {
          contact_id: contact.id,
          contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
          contact_email: contact.email_address,
        }
      });
    }

    // Add Request Review button if contact is completed
    if (contact.lead_status === 'Completed') {
      actions.push({
        label: 'Request Review',
        action: 'request_review',
        value: '',
        variant: 'outline',
        metadata: {
          contact_id: contact.id,
          contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
        }
      });
    }

    // Add Mark as Spam button (always available)
    actions.push({
      label: 'Mark as Spam',
      action: 'mark_spam',
      value: '',
      variant: 'outline',
      metadata: {
        contact_id: contact.id,
        contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
      }
    });

    return {
      title: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone || 'Unknown Contact',
      description: contact.event_type || contact.lead_status || null,
      fields: fields,
      link: `/admin/contacts/${contact.id}`,
      actions: actions
    };
  });

  // Create summary text
  let summaryText = '';
  if (isBookedEvents) {
    const upcomingCount = sortedContacts.filter(c => {
      if (!c.event_date) return false;
      const eventDate = new Date(c.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }).length;
    
    const pastCount = sortedContacts.length - upcomingCount;
    
    summaryText = `📅 **${result.count} Booked Event${result.count === 1 ? '' : 's'}**`;
    if (upcomingCount > 0) {
      summaryText += `\n• ${upcomingCount} upcoming`;
    }
    if (pastCount > 0) {
      summaryText += `\n• ${pastCount} past`;
    }
    summaryText += '\n';
  } else {
    summaryText = result.count === 0 
      ? 'No contacts found matching your search.'
      : `Found ${result.count} contact${result.count === 1 ? '' : 's'}:`;
  }

  return {
    text: summaryText,
    cards: cards.length > 0 ? cards : undefined,
    buttons: result.count > 5 ? [
      {
        label: `View All ${result.count} ${isBookedEvents ? 'Events' : 'Results'}`,
        action: 'link',
        value: isBookedEvents 
          ? '/admin/contacts?leadStatus=Booked'
          : `/admin/contacts?search=${encodeURIComponent(JSON.stringify(functionArgs || {}))}`
      }
    ] : undefined
  };
}

function formatContactDetails(result) {
  if (!result.contact) {
    return null;
  }

  const contact = result.contact;
  const cards = [];

  // Format last interaction info
  let lastInteractionField = null;
  if (contact.last_contacted_date) {
    const lastContactDate = new Date(contact.last_contacted_date);
    const daysAgo = Math.floor((new Date() - lastContactDate) / (1000 * 60 * 60 * 24));
    let lastContactText = lastContactDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    
    if (daysAgo === 0) {
      lastContactText += ' (Today)';
    } else if (daysAgo === 1) {
      lastContactText += ' (Yesterday)';
    } else if (daysAgo < 7) {
      lastContactText += ` (${daysAgo} days ago)`;
    } else if (daysAgo < 30) {
      lastContactText += ` (${Math.floor(daysAgo / 7)} weeks ago)`;
    } else {
      lastContactText += ` (${Math.floor(daysAgo / 30)} months ago)`;
    }
    
    lastInteractionField = { 
      label: 'Last Contact', 
      value: `${lastContactText}${contact.last_contact_type ? ` via ${contact.last_contact_type}` : ''}` 
    };
  } else {
    lastInteractionField = { label: 'Last Contact', value: 'Never contacted' };
  }

  // Build contact card actions
  const contactActions = [
      {
        label: 'Open Contact',
        action: 'link',
        value: `/admin/contacts/${contact.id}`,
        variant: 'default'
      },
      {
        label: 'Copy ID',
        action: 'copy',
        value: contact.id,
        variant: 'outline'
      }
  ];

  // Add Send SMS button if phone exists
  if (contact.phone) {
    contactActions.push({
      label: 'Send SMS',
      action: 'send_sms',
      value: '',
      variant: 'outline',
      metadata: {
        contact_id: contact.id,
        contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
        contact_phone: contact.phone,
      }
    });
  }

  // Add Send Email button if email exists
  if (contact.email_address) {
    contactActions.push({
      label: 'Send Email',
      action: 'send_email',
      value: '',
      variant: 'outline',
      metadata: {
        contact_id: contact.id,
        contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
        contact_email: contact.email_address,
      }
    });
  }

  // Add Request Review button if contact is completed
  if (contact.lead_status === 'Completed') {
    contactActions.push({
      label: 'Request Review',
      action: 'request_review',
      value: '',
      variant: 'outline',
      metadata: {
        contact_id: contact.id,
        contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
      }
    });
  }

  // Add Mark as Spam button (always available)
  contactActions.push({
    label: 'Mark as Spam',
    action: 'mark_spam',
    value: '',
    variant: 'outline',
    metadata: {
      contact_id: contact.id,
      contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone,
    }
  });

  // Main contact card
  cards.push({
    title: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact',
    description: contact.lead_status || 'No status',
    fields: [
      lastInteractionField, // Show last contact at the top
      ...(contact.email_address ? [{ label: 'Email', value: contact.email_address }] : []),
      ...(contact.phone ? [{ label: 'Phone', value: contact.phone }] : []),
      ...(contact.event_type ? [{ label: 'Event Type', value: contact.event_type }] : []),
      ...(contact.event_date ? [{ label: 'Event Date', value: new Date(contact.event_date).toLocaleDateString() }] : []),
      ...(contact.venue_name ? [{ label: 'Venue', value: contact.venue_name }] : [])
    ],
    link: `/admin/contacts/${contact.id}`,
    actions: contactActions
  });

  // Quote card
  if (result.quote) {
    const quoteActions = [];
    const quoteId = result.quote.id;
    
    if (quoteId) {
      // Client-facing quote page
      quoteActions.push({
        label: 'View Quote',
        action: 'link',
        value: `/quote/${quoteId}`,
        variant: 'default'
      });
      // Payment page
      quoteActions.push({
        label: 'View Payment Page',
        action: 'link',
        value: `/quote/${quoteId}/payment`,
        variant: 'outline'
      });
      // Admin quote page
      quoteActions.push({
        label: 'Admin View',
        action: 'link',
        value: `/admin/quote/${quoteId}`,
        variant: 'outline'
      });
      // Add PDF link if available
      quoteActions.push({
        label: 'View PDF',
        action: 'link',
        value: `/api/quote/${quoteId}/generate-invoice-pdf`,
        variant: 'outline'
      });
      // Add link to contact's quote tab
      quoteActions.push({
        label: 'Open in Contact',
        action: 'link',
        value: `/admin/contacts/${contact.id}#quotes`,
        variant: 'outline'
      });
    }
    cards.push({
      title: 'Quote',
      description: `Status: ${result.quote.status || 'Pending'}`,
      fields: [
        ...(result.quote.package_name ? [{ label: 'Package', value: result.quote.package_name }] : []),
        ...(result.quote.total_price ? [{ label: 'Total', value: `$${result.quote.total_price.toLocaleString()}` }] : []),
        ...(result.quote.created_at ? [{ label: 'Created', value: new Date(result.quote.created_at).toLocaleDateString() }] : [])
      ],
      link: quoteId ? `/quote/${quoteId}` : (result.quote.id ? `/admin/quote/${result.quote.id}` : undefined),
      actions: quoteActions.length > 0 ? quoteActions : undefined
    });
  }

  // Invoice card
  if (result.invoice) {
    const invoiceActions = [];
    const quoteId = result.invoice_quote_id || result.quote_id;
    
    if (result.invoice.id) {
      // Use client-facing quote URL if quote_id is available
      if (quoteId) {
        invoiceActions.push({
          label: 'View Invoice',
          action: 'link',
          value: `/quote/${quoteId}/invoice`,
          variant: 'default'
        });
        invoiceActions.push({
          label: 'View Payment Page',
          action: 'link',
          value: `/quote/${quoteId}/payment`,
          variant: 'outline'
        });
      } else {
        // Fallback to admin URL if no quote_id
        invoiceActions.push({
          label: 'View Invoice',
          action: 'link',
          value: `/admin/invoices/${result.invoice.id}`,
          variant: 'default'
        });
      }
      // Add PDF link if available
      invoiceActions.push({
        label: 'View PDF',
        action: 'link',
        value: `/api/invoice/${result.invoice.id}/generate-pdf`,
        variant: 'outline'
      });
      // Add link to contact's invoices tab
      invoiceActions.push({
        label: 'Open in Contact',
        action: 'link',
        value: `/admin/contacts/${contact.id}#invoices`,
        variant: 'outline'
      });
    }
    cards.push({
      title: 'Invoice',
      description: `Status: ${result.invoice.invoice_status || 'Draft'}`,
      fields: [
        ...(result.invoice.invoice_number ? [{ label: 'Invoice #', value: result.invoice.invoice_number }] : []),
        ...(result.invoice.total_amount ? [{ label: 'Amount', value: `$${result.invoice.total_amount.toLocaleString()}` }] : []),
        ...(result.invoice.balance_due ? [{ label: 'Balance Due', value: `$${result.invoice.balance_due.toLocaleString()}` }] : []),
        ...(result.invoice.due_date ? [{ label: 'Due Date', value: new Date(result.invoice.due_date).toLocaleDateString() }] : [])
      ],
      link: (result.invoice_quote_id || result.quote_id) ? `/quote/${result.invoice_quote_id || result.quote_id}/invoice` : (result.invoice.id ? `/admin/invoices/${result.invoice.id}` : undefined),
      actions: invoiceActions.length > 0 ? invoiceActions : undefined
    });
  }

  // Contract card
  if (result.contract) {
    const contractActions = [];
    const contractQuoteId = result.contract_quote_id || result.quote_id;
    const contract = result.contract;
    
    // Determine status indicators
    const hasBeenViewed = !!contract.viewed_at;
    const clientSigned = !!contract.signed_at || !!contract.client_signature_data;
    const adminSigned = !!contract.signed_by_vendor_at || !!contract.vendor_signature_data;
    
    if (contract.id) {
      // Prioritize signing token URL for direct signing access
      // Then use client-facing quote URL if quote_id is available
      // Finally fallback to admin URL
      const contractUrl = contract.signing_token
        ? `/sign-contract/${contract.signing_token}`
        : (contractQuoteId
          ? `/quote/${contractQuoteId}/contract`
          : `/admin/contracts/${contract.id}`);
      
      contractActions.push({
        label: 'View Contract',
        action: 'link',
        value: contractUrl,
        variant: 'default'
      });
      // Add PDF link if available
      contractActions.push({
        label: 'View PDF',
        action: 'link',
        value: `/api/contract/${contract.id}/generate-pdf`,
        variant: 'outline'
      });
      // Add link to contact's contracts tab
      contractActions.push({
        label: 'Open in Contact',
        action: 'link',
        value: `/admin/contacts/${contact.id}#contracts`,
        variant: 'outline'
      });
    }
    
    // Build status fields with visual indicators
    const statusFields = [];
    statusFields.push({
      label: 'Viewed',
      value: hasBeenViewed 
        ? `✓ Viewed ${contract.viewed_at ? new Date(contract.viewed_at).toLocaleDateString() : ''}`.trim()
        : '✗ Not viewed'
    });
    statusFields.push({
      label: 'Client Signature',
      value: clientSigned
        ? `✓ Signed ${contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : ''}`.trim()
        : '✗ Not signed'
    });
    statusFields.push({
      label: 'Admin Signature',
      value: adminSigned
        ? `✓ Signed ${contract.signed_by_vendor_at ? new Date(contract.signed_by_vendor_at).toLocaleDateString() : ''}`.trim()
        : '✗ Not signed'
    });
    
    cards.push({
      title: 'Contract',
      description: `Status: ${contract.status || 'Draft'}`,
      fields: [
        // Status indicators first
        ...statusFields,
        // Contract details
        ...(contract.contract_number ? [{ label: 'Contract #', value: contract.contract_number }] : []),
        ...(contract.total_amount ? [{ label: 'Amount', value: `$${contract.total_amount.toLocaleString()}` }] : []),
        ...(contract.deposit_amount ? [{ label: 'Deposit', value: `$${contract.deposit_amount.toLocaleString()}` }] : [])
      ],
      link: contract.signing_token 
        ? `/sign-contract/${contract.signing_token}`
        : (contractQuoteId ? `/quote/${contractQuoteId}/contract` : (contract.id ? `/admin/contracts/${contract.id}` : undefined)),
      actions: contractActions.length > 0 ? contractActions : undefined
    });
  }

  // Project card (if available)
  if (result.project) {
    const projectActions = [];
    if (result.project.id) {
      projectActions.push({
        label: 'View Project',
          action: 'link',
        value: `/admin/projects/${result.project.id}`,
        variant: 'default'
      });
      projectActions.push({
        label: 'Open in Contact',
        action: 'link',
        value: `/admin/contacts/${contact.id}#projects`,
          variant: 'outline'
      });
    }
    cards.push({
      title: result.project.event_name || 'Project',
      description: `Status: ${result.project.status || 'Pending'}`,
      fields: [
        ...(result.project.event_date ? [{ label: 'Event Date', value: new Date(result.project.event_date).toLocaleDateString() }] : []),
        ...(result.project.venue_name ? [{ label: 'Venue', value: result.project.venue_name }] : []),
        ...(result.project.number_of_guests ? [{ label: 'Guests', value: result.project.number_of_guests.toString() }] : [])
      ],
      link: result.project.id ? `/admin/projects/${result.project.id}` : undefined,
      actions: projectActions.length > 0 ? projectActions : undefined
    });
  }

  return {
    text: `Here are the details for ${contact.first_name || 'this contact'}:`,
    cards
  };
}

function formatQuote(result) {
  if (!result.quote) {
    return null;
  }

  const quote = result.quote;
  const contactId = result.contact_id || quote.contact_id;
  const quoteId = quote.id;
  const actions = [];
  
  if (quoteId) {
    // Client-facing quote page
    actions.push({
      label: 'View Quote',
      action: 'link',
      value: `/quote/${quoteId}`,
      variant: 'default'
    });
    // Payment page
    actions.push({
      label: 'View Payment Page',
      action: 'link',
      value: `/quote/${quoteId}/payment`,
      variant: 'outline'
    });
    // Admin quote page
    actions.push({
      label: 'Admin View',
      action: 'link',
      value: `/admin/quote/${quoteId}`,
      variant: 'outline'
    });
    actions.push({
      label: 'View PDF',
      action: 'link',
      value: `/api/quote/${quoteId}/generate-invoice-pdf`,
      variant: 'outline'
    });
    if (contactId) {
      actions.push({
        label: 'Open Contact',
        action: 'link',
        value: `/admin/contacts/${contactId}#quotes`,
        variant: 'outline'
      });
    }
  }

  return {
    text: 'Quote details:',
    cards: [{
      title: quote.package_name || 'Quote',
      description: `Status: ${quote.status || 'Pending'}`,
      fields: [
        ...(quote.total_price ? [{ label: 'Total Price', value: `$${quote.total_price.toLocaleString()}` }] : []),
        ...(quote.package_price ? [{ label: 'Package Price', value: `$${quote.package_price.toLocaleString()}` }] : []),
        ...(quote.created_at ? [{ label: 'Created', value: new Date(quote.created_at).toLocaleDateString() }] : [])
      ],
      link: quoteId ? `/quote/${quoteId}` : (quote.id ? `/admin/quote/${quote.id}` : undefined),
      actions: actions.length > 0 ? actions : undefined
    }]
  };
}

function formatInvoice(result) {
  // Handle error cases - show card even when no invoice found
  if (!result.success || !result.invoice) {
    // If there are matching contacts, show them
    if (result.matching_contacts && result.matching_contacts.length > 0) {
      const contactCards = result.matching_contacts.map(contact => ({
        title: contact.name || 'Contact',
        description: 'Multiple matches found',
        fields: [
          { label: 'Contact ID', value: contact.id }
        ],
        link: `/admin/contacts/${contact.id}`,
        actions: [{
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${contact.id}`,
          variant: 'default'
        }]
      }));
      
      return {
        text: result.message || 'Multiple contacts found. Please select one:',
        cards: contactCards
      };
    }
    
    // For "no invoice found" errors, return a card with status information and invoice link
    if (result.message && (result.message.includes('not found') || result.message.includes('No invoices found'))) {
      const quoteId = result.quote_id || result.contact_id;
      const invoiceUrl = quoteId ? `/quote/${quoteId}/invoice` : null;
      const paymentUrl = quoteId ? `/quote/${quoteId}/payment` : null;
      const actions = [];
      
      // If we have a quote_id (contact_id), provide the invoice link even if no invoice exists yet
      if (invoiceUrl) {
        actions.push({
          label: 'View Invoice Page',
          action: 'link',
          value: invoiceUrl,
          variant: 'default'
        });
      }
      
      if (paymentUrl) {
        actions.push({
          label: 'View Payment Page',
          action: 'link',
          value: paymentUrl,
          variant: 'outline'
        });
      }
      
      if (result.contact_id) {
        actions.push({
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${result.contact_id}#invoices`,
          variant: 'outline'
        });
      }
      
      // Show a card with status information even when no invoice exists
      // Note: Invoice page exists and can be viewed, but no invoice record in database yet
      return {
        text: result.message || 'No invoice record found in database. Invoice page is available for viewing.',
        cards: [{
          title: 'Invoice Status',
          description: invoiceUrl ? 'Invoice page available (not yet created)' : 'No invoice record found',
          fields: [
            { label: 'Invoice on File', value: '✗ No (page available)' },
            { label: 'Status', value: 'Not created' },
            { label: 'Total Amount', value: '✗ Not available' },
            { label: 'Balance Due', value: '✗ Not available' },
            { label: 'Payment Status', value: '✗ Not available' }
          ],
          link: invoiceUrl || undefined,
          actions: actions.length > 0 ? actions : undefined
    }]
  };
}

    // For other errors, return null so the error message is shown
    return null;
  }

  const invoice = result.invoice;
  const contactId = result.contact_id || invoice.contact_id;
  const quoteId = result.quote_id || invoice.quote_id;
  const actions = [];
  
  if (invoice.id) {
    // Use client-facing quote URL if quote_id is available
    if (quoteId) {
      actions.push({
        label: 'View Invoice',
        action: 'link',
        value: `/quote/${quoteId}/invoice`,
        variant: 'default'
      });
      actions.push({
        label: 'View Payment Page',
        action: 'link',
        value: `/quote/${quoteId}/payment`,
        variant: 'outline'
      });
    } else {
      // Fallback to admin URL if no quote_id
      actions.push({
        label: 'View Invoice',
        action: 'link',
        value: `/admin/invoices/${invoice.id}`,
        variant: 'default'
      });
    }
    actions.push({
      label: 'View PDF',
      action: 'link',
      value: `/api/invoice/${invoice.id}/generate-pdf`,
      variant: 'outline'
    });
    if (contactId) {
      actions.push({
        label: 'Open Contact',
        action: 'link',
        value: `/admin/contacts/${contactId}#invoices`,
        variant: 'outline'
      });
    }
  }

  // Determine payment status
  const isPaid = !!invoice.paid_at;
  const hasBalance = invoice.balance_due && invoice.balance_due > 0;
  const paymentStatus = isPaid ? 'Paid' : (hasBalance ? 'Unpaid' : 'Pending');
  
  // Build status fields
  const statusFields = [
    { label: 'Invoice on File', value: '✓ Yes' },
    { label: 'Status', value: invoice.invoice_status || 'Draft' },
    { label: 'Payment Status', value: paymentStatus }
  ];
  
  // Add financial fields
  const financialFields = [
    ...(invoice.total_amount ? [{ label: 'Total Amount', value: `$${invoice.total_amount.toLocaleString()}` }] : []),
    ...(invoice.balance_due !== undefined ? [{ label: 'Balance Due', value: `$${invoice.balance_due.toLocaleString()}` }] : []),
    ...(invoice.due_date ? [{ label: 'Due Date', value: new Date(invoice.due_date).toLocaleDateString() }] : []),
    ...(invoice.paid_at ? [{ label: 'Paid Date', value: new Date(invoice.paid_at).toLocaleDateString() }] : [])
  ];

  return {
    text: 'Invoice details:',
    cards: [{
      title: `Invoice ${invoice.invoice_number || invoice.id?.substring(0, 8) || ''}`,
      description: `Status: ${invoice.invoice_status || 'Draft'}`,
      fields: [
        ...statusFields,
        ...financialFields
      ],
      link: quoteId ? `/quote/${quoteId}/invoice` : (invoice.id ? `/admin/invoices/${invoice.id}` : undefined),
      actions: actions.length > 0 ? actions : undefined
    }]
  };
}

function formatPayments(result) {
  // Handle error cases
  if (!result.success || !result.payments || result.payments.length === 0) {
    // If there are matching contacts, show them
    if (result.matching_contacts && result.matching_contacts.length > 0) {
      const contactCards = result.matching_contacts.map(contact => ({
        title: contact.name || 'Contact',
        description: 'Multiple matches found',
        fields: [
          { label: 'Contact ID', value: contact.id }
        ],
        link: `/admin/contacts/${contact.id}`,
        actions: [{
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${contact.id}`,
          variant: 'default'
        }]
      }));
      
      return {
        text: result.message || 'Multiple contacts found. Please select one:',
        cards: contactCards
      };
    }
    
    // For "no payments found" errors, return a card with status information
    if (result.message && (result.message.includes('not found') || result.message.includes('No payments found'))) {
      const quoteId = result.quote_id || result.contact_id;
      const paymentUrl = quoteId ? `/quote/${quoteId}/payment` : null;
      const actions = [];
      
      if (paymentUrl) {
        actions.push({
          label: 'View Payment Page',
          action: 'link',
          value: paymentUrl,
          variant: 'default'
        });
      }
      
      if (result.contact_id) {
        actions.push({
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${result.contact_id}#payments`,
          variant: 'outline'
        });
      }
      
      return {
        text: result.message || 'No payment records found for this contact.',
        cards: [{
          title: 'Payment History',
          description: 'No payments recorded',
          fields: [
            { label: 'Total Paid', value: '$0.00' },
            { label: 'Payment Count', value: '0' },
            { label: 'Status', value: 'No payments' }
          ],
          actions: actions.length > 0 ? actions : undefined
        }]
      };
    }
    
    // For other errors, return null so the error message is shown
    return null;
  }

  const payments = result.payments;
  const contactId = result.contact_id;
  const quoteId = result.quote_id || contactId;
  const totalPaid = result.total_paid || 0;
  const totalPending = result.total_pending || 0;
  const quoteTotal = result.quote_total || 0;
  const depositAmount = result.deposit_amount || 0;
  const remainingBalance = result.remaining_balance || 0;
  const isFullyPaid = result.is_fully_paid || false;
  const hasDepositPaid = result.has_deposit_paid || false;
  const actions = [];
  
  if (quoteId) {
    actions.push({
      label: 'View Payment Page',
      action: 'link',
      value: `/quote/${quoteId}/payment`,
      variant: 'default'
    });
  }
  
  if (contactId) {
    actions.push({
      label: 'View Contact',
      action: 'link',
      value: `/admin/contacts/${contactId}#payments`,
      variant: 'outline'
    });
  }

  // Group payments by status
  const paidPayments = payments.filter(p => p.payment_status === 'Paid');
  const pendingPayments = payments.filter(p => p.payment_status === 'Pending');
  const overduePayments = payments.filter(p => p.payment_status === 'Overdue');

  // Build summary fields - match payment page display
  const summaryFields = [];
  
  // Show quote total if available
  if (quoteTotal > 0) {
    summaryFields.push({ 
      label: 'Total Amount', 
      value: `$${quoteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    });
    
    summaryFields.push({ 
      label: 'Deposit Amount', 
      value: `$${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    });
  }
  
  summaryFields.push({ 
    label: 'Total Paid', 
    value: `$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
  });
  
  // Show remaining balance if quote total is available
  if (quoteTotal > 0) {
    summaryFields.push({ 
      label: 'Remaining Balance', 
      value: `$${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    });
    
    // Payment status
    if (isFullyPaid) {
      summaryFields.push({ label: 'Payment Status', value: '✓ Fully Paid' });
    } else if (hasDepositPaid) {
      summaryFields.push({ label: 'Payment Status', value: '⚠ Deposit Paid (Balance Remaining)' });
    } else if (totalPaid > 0) {
      summaryFields.push({ label: 'Payment Status', value: '⚠ Partially Paid' });
    } else {
      summaryFields.push({ label: 'Payment Status', value: '✗ Not Paid' });
    }
  }
  
  // Payment counts
  summaryFields.push({ 
    label: 'Payment Count', 
    value: `${payments.length} payment${payments.length !== 1 ? 's' : ''}` 
  });
  
  if (paidPayments.length > 0) {
    summaryFields.push({ 
      label: 'Paid Payments', 
      value: `${paidPayments.length} payment${paidPayments.length !== 1 ? 's' : ''}` 
    });
  }
  
  if (pendingPayments.length > 0) {
    summaryFields.push({ 
      label: 'Pending Payments', 
      value: `${pendingPayments.length} payment${pendingPayments.length !== 1 ? 's' : ''}` 
    });
  }

  if (overduePayments.length > 0) {
    summaryFields.push({ 
      label: 'Overdue Payments', 
      value: `${overduePayments.length} payment${overduePayments.length !== 1 ? 's' : ''}` 
    });
  }

  // Create cards for each payment (limit to most recent 5 for display)
  const recentPayments = payments.slice(0, 5);
  const paymentCards = recentPayments.map(payment => {
    const paymentFields = [
      { label: 'Amount', value: `$${(parseFloat(payment.total_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: 'Status', value: payment.payment_status || 'Unknown' },
      { label: 'Method', value: payment.payment_method || 'Not specified' }
    ];

    if (payment.transaction_date) {
      paymentFields.push({ 
        label: 'Transaction Date', 
        value: new Date(payment.transaction_date).toLocaleDateString() 
      });
    }

    if (payment.due_date) {
      paymentFields.push({ 
        label: 'Due Date', 
        value: new Date(payment.due_date).toLocaleDateString() 
      });
    }

    // Add Stripe information if available
    if (payment.stripe_payment_intent) {
      paymentFields.push({ 
        label: 'Stripe Payment Intent', 
        value: payment.stripe_payment_intent.substring(0, 20) + '...' 
      });
    }

    if (payment.stripe_session_id) {
      paymentFields.push({ 
        label: 'Stripe Session', 
        value: payment.stripe_session_id.substring(0, 20) + '...' 
      });
    }

    if (payment.payment_notes) {
      paymentFields.push({ 
        label: 'Notes', 
        value: payment.payment_notes.substring(0, 50) + (payment.payment_notes.length > 50 ? '...' : '') 
      });
    }

    return {
      title: payment.payment_name || `Payment ${payment.id?.substring(0, 8) || ''}`,
      description: `Status: ${payment.payment_status || 'Unknown'}`,
      fields: paymentFields
    };
  });

  // Build text response matching payment page format
  let textResponse = `Payment Summary:\n`;
  
  if (quoteTotal > 0) {
    textResponse += `Total Amount: $${quoteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    textResponse += `Deposit Amount: $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  }
  
  textResponse += `Total Paid: $${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  if (quoteTotal > 0) {
    textResponse += `\nRemaining Balance: $${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (isFullyPaid) {
      textResponse += `\nStatus: ✓ Fully Paid`;
    } else if (hasDepositPaid) {
      textResponse += `\nStatus: ⚠ Deposit Paid (Balance Remaining)`;
    } else if (totalPaid > 0) {
      textResponse += `\nStatus: ⚠ Partially Paid`;
    } else {
      textResponse += `\nStatus: ✗ Not Paid`;
    }
  }
  
  if (totalPending > 0) {
    textResponse += `\nPending: $${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  textResponse += `\n\n${payments.length} payment${payments.length !== 1 ? 's' : ''} recorded.`;

  return {
    text: textResponse,
    cards: [
      {
        title: 'Payment Summary',
        description: quoteTotal > 0 
          ? (isFullyPaid ? 'Fully Paid' : hasDepositPaid ? 'Deposit Paid' : 'Not Paid')
          : `${payments.length} payment${payments.length !== 1 ? 's' : ''} total`,
        fields: summaryFields,
        actions: actions.length > 0 ? actions : undefined
      },
      ...paymentCards
    ]
  };
}

function formatQuestionnaireLink(result) {
  // Handle error cases
  if (!result.success) {
    // If there are matching contacts, show them
    if (result.matching_contacts && result.matching_contacts.length > 0) {
      const contactCards = result.matching_contacts.map(contact => ({
        title: contact.name || 'Contact',
        description: 'Multiple matches found',
        fields: [
          { label: 'Contact ID', value: contact.id }
        ],
        link: `/admin/contacts/${contact.id}`,
        actions: [{
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${contact.id}`,
          variant: 'default'
        }]
      }));
      
      return {
        text: result.message || 'Multiple contacts found. Please select one:',
        cards: contactCards
      };
    }
    
    // For "not found" errors
    return {
      text: result.message || 'Contact not found. Please check the name or use a contact ID.',
      cards: []
    };
  }

  const contactName = result.contact_name || 'Client';
  const questionnaireUrl = result.questionnaire_url;
  const completionStatus = result.completion_status || 'Unknown';
  const hasPlaylists = result.has_playlists || false;
  const actions = [];

  // Add action buttons
  actions.push({
    label: 'Open Questionnaire',
    action: 'link',
    value: questionnaireUrl,
    variant: 'default'
  });

  actions.push({
    label: 'Copy Link',
    action: 'copy',
    value: questionnaireUrl,
    variant: 'outline'
  });

  if (result.contact_id) {
    actions.push({
      label: 'View Contact',
      action: 'link',
      value: `/admin/contacts/${result.contact_id}`,
      variant: 'outline'
    });
  }

  // Build status fields
  const statusFields = [
    { label: 'Contact', value: contactName },
    { label: 'Status', value: completionStatus },
    { label: 'Has Playlists', value: hasPlaylists ? '✓ Yes' : '✗ No' }
  ];

  if (result.questionnaire_id) {
    statusFields.push({ 
      label: 'Questionnaire ID', 
      value: result.questionnaire_id.substring(0, 8) + '...' 
    });
  }

  return {
    text: `Questionnaire link for ${contactName}:\n\n${questionnaireUrl}\n\nStatus: ${completionStatus}${hasPlaylists ? ' (has playlists)' : ''}`,
    cards: [{
      title: `Questionnaire Link - ${contactName}`,
      description: `Status: ${completionStatus}`,
      fields: statusFields,
      link: questionnaireUrl,
      actions: actions
    }]
  };
}

function formatSchedulingLink(result) {
  // Handle error cases
  if (!result.success) {
    // If there are matching contacts, show them
    if (result.matching_contacts && result.matching_contacts.length > 0) {
      const contactCards = result.matching_contacts.map(contact => ({
        title: contact.name || 'Contact',
        description: 'Multiple matches found',
        fields: [
          { label: 'Contact ID', value: contact.id }
        ],
        link: `/admin/contacts/${contact.id}`,
        actions: [{
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${contact.id}`,
          variant: 'default'
        }]
      }));
      
      return {
        text: result.message || 'Multiple contacts found. Please select one:',
        cards: contactCards
      };
    }
    
    // For "not found" errors
    return {
      text: result.message || 'Contact not found. Please check the name or use a contact ID.',
      cards: []
    };
  }

  const contactName = result.contact_name || 'Client';
  const schedulingUrl = result.scheduling_url;
  const isPersonalized = result.is_personalized || false;
  const actions = [];

  // Add action buttons
  actions.push({
    label: 'Open Schedule',
    action: 'link',
    value: schedulingUrl,
    variant: 'default'
  });

  actions.push({
    label: 'Copy Link',
    action: 'copy',
    value: schedulingUrl,
    variant: 'outline'
  });

  if (result.contact_id) {
    actions.push({
      label: 'View Contact',
      action: 'link',
      value: `/admin/contacts/${result.contact_id}`,
      variant: 'outline'
    });
  }

  // Build status fields
  const statusFields = [
    { label: 'Contact', value: contactName },
    { label: 'Link', value: schedulingUrl },
    { label: 'Personalized', value: isPersonalized ? '✓ Yes' : '✗ No' }
  ];

  return {
    text: `Scheduling link for ${contactName}:\n\n${schedulingUrl}\n\n${isPersonalized ? 'Link includes contact information for easy booking.' : 'Share this link to book a meeting.'}`,
    cards: [{
      title: `Scheduling Link - ${contactName}`,
      description: isPersonalized ? 'Personalized booking link' : 'Public scheduling page',
      fields: statusFields,
      link: schedulingUrl,
      actions: actions
    }]
  };
}

function formatContract(result) {
  // Handle error cases
  if (!result.success) {
    // If there are matching contacts, show them
    if (result.matching_contacts && result.matching_contacts.length > 0) {
      const contactCards = result.matching_contacts.map(contact => ({
        title: contact.name || 'Contact',
        description: 'Multiple matches found',
        fields: [
          { label: 'Contact ID', value: contact.id }
        ],
        link: `/admin/contacts/${contact.id}`,
        actions: [{
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${contact.id}`,
          variant: 'default'
        }]
      }));
      
      return {
        text: result.message || 'Multiple contacts found. Please select one:',
        cards: contactCards
      };
    }
    
    // For "no contract found" errors, return a card with status information and contract link
    if (result.message && (result.message.includes('not found') || result.message.includes('No contracts found'))) {
      const quoteId = result.quote_id || result.contact_id;
      const contractUrl = quoteId ? `/quote/${quoteId}/contract` : null;
      const actions = [];
      
      // If we have a quote_id (contact_id), provide the contract link even if no contract exists yet
      if (contractUrl) {
        actions.push({
          label: 'View Contract Page',
          action: 'link',
          value: contractUrl,
          variant: 'default'
        });
      }
      
      if (result.contact_id) {
        actions.push({
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${result.contact_id}#contracts`,
          variant: 'outline'
        });
      }
      
      // Show a card with status information even when no contract exists
      // Note: Contract page exists and can be viewed/signed, but no contract record in database yet
      return {
        text: result.message || 'No contract record found in database. Contract page is available for viewing and signing.',
        cards: [{
          title: 'Contract Status',
          description: contractUrl ? 'Contract page available (not yet signed)' : 'No contract record found',
          fields: [
            { label: 'Contract on File', value: '✗ No (page available)' },
            { label: 'Status', value: 'Not created' },
            { label: 'Viewed', value: '✗ Not available' },
            { label: 'Client Signature', value: '✗ Not available' },
            { label: 'Admin Signature', value: '✗ Not available' }
          ],
          link: contractUrl || undefined,
          actions: actions.length > 0 ? actions : undefined
        }]
      };
    }
    
    // For other errors, return null so the error message is shown
    return null;
  }

  if (!result.contract) {
    const quoteId = result.quote_id || result.contact_id;
    const contractUrl = quoteId ? `/quote/${quoteId}/contract` : null;
    const actions = [];
    
    // If we have a quote_id (contact_id), provide the contract link even if no contract exists yet
    if (contractUrl) {
      actions.push({
        label: 'View Contract Page',
        action: 'link',
        value: contractUrl,
        variant: 'default'
      });
    }
    
    if (result.contact_id) {
      actions.push({
        label: 'View Contact',
        action: 'link',
        value: `/admin/contacts/${result.contact_id}#contracts`,
        variant: 'outline'
      });
    }
    
    // Show a card with status information even when no contract exists
    // Note: Contract page exists and can be viewed/signed, but no contract record in database yet
  return {
      text: 'No contract record found in database. Contract page is available for viewing and signing.',
    cards: [{
        title: 'Contract Status',
        description: contractUrl ? 'Contract page available (not yet signed)' : 'No contract record found',
      fields: [
          { label: 'Contract on File', value: '✗ No (page available)' },
          { label: 'Status', value: 'Not created' },
          { label: 'Viewed', value: '✗ Not available' },
          { label: 'Client Signature', value: '✗ Not available' },
          { label: 'Admin Signature', value: '✗ Not available' }
        ],
        link: contractUrl || undefined,
        actions: actions.length > 0 ? actions : undefined
      }]
    };
  }

  const contract = result.contract;
  const contactId = result.contact_id || contract.contact_id;
  // The quote_id is the same as the contact_id, so use contact_id as fallback
  const quoteId = result.quote_id || contract.quote_id || contactId;
  const actions = [];
  
  // Build the contract URL - prioritize signing token URL for direct signing access
  // If signing_token is available, use the public signing page
  // Otherwise, fall back to quote-based URL or admin contract page
  const contractUrl = contract.signing_token
    ? `/sign-contract/${contract.signing_token}`
    : (quoteId 
      ? `/quote/${quoteId}/contract`
      : (contract.id ? `/admin/contracts/${contract.id}` : null));
  
  if (contract.id) {
    // Primary action: View Contract (always show this first and prominently)
    if (contractUrl) {
      actions.push({
          label: 'View Contract',
          action: 'link',
        value: contractUrl,
          variant: 'default'
      });
    }
    
    // Secondary actions
    actions.push({
      label: 'View PDF',
      action: 'link',
      value: `/api/contract/${contract.id}/generate-pdf`,
      variant: 'outline'
    });
    
    if (contactId) {
      actions.push({
        label: 'Open Contact',
        action: 'link',
        value: `/admin/contacts/${contactId}#contracts`,
        variant: 'outline'
      });
    }
  }

  // Determine status indicators - check all possible fields
  const hasBeenViewed = !!contract.viewed_at;
  const clientSigned = !!contract.signed_at || !!contract.client_signature_data;
  const adminSigned = !!contract.signed_by_vendor_at || !!contract.vendor_signature_data;
  const contractStatus = contract.status || 'draft';
  const hasContractOnFile = !!contract.id; // Contract exists in database
  
  // Build status fields with visual indicators
  const statusFields = [];
  
  // Contract on file status
  statusFields.push({
    label: 'Contract on File',
    value: hasContractOnFile ? '✓ Yes' : '✗ No'
  });
  
  // Contract status (draft, sent, viewed, signed, etc.)
  if (contractStatus) {
    const statusLabels = {
      'draft': 'Draft',
      'sent': 'Sent',
      'viewed': 'Viewed',
      'signed': 'Signed',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'expired': 'Expired'
    };
    statusFields.push({
      label: 'Status',
      value: statusLabels[contractStatus] || contractStatus
    });
  }
  
  // Viewed status
  statusFields.push({
    label: 'Viewed',
    value: hasBeenViewed 
      ? `✓ Viewed ${contract.viewed_at ? new Date(contract.viewed_at).toLocaleDateString() : ''}`.trim()
      : '✗ Not viewed'
  });
  
  // Client signature status
  statusFields.push({
    label: 'Client Signature',
    value: clientSigned
      ? `✓ Signed ${contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : ''}`.trim()
      : '✗ Not signed'
  });
  
  // Admin signature status
  statusFields.push({
    label: 'Admin Signature',
    value: adminSigned
      ? `✓ Signed ${contract.signed_by_vendor_at ? new Date(contract.signed_by_vendor_at).toLocaleDateString() : ''}`.trim()
      : '✗ Not signed'
  });
  
  // Contract number if available
  if (contract.contract_number) {
    statusFields.push({
      label: 'Contract Number',
      value: contract.contract_number
    });
  }

  // Build text response with direct link
  let textResponse = 'Contract details:';
  if (contractUrl) {
    textResponse += `\n\n📄 Direct link: ${contractUrl}`;
  }

  return {
    text: textResponse,
    cards: [{
      title: `Contract ${contract.contract_number || contract.id?.substring(0, 8) || ''}`,
      description: `Status: ${contract.status || 'Draft'}`,
      fields: [
        // Status indicators first
        ...statusFields,
        // Financial information
        ...(contract.total_amount ? [{ label: 'Total Amount', value: `$${contract.total_amount.toLocaleString()}` }] : []),
        ...(contract.deposit_amount ? [{ label: 'Deposit', value: `$${contract.deposit_amount.toLocaleString()}` }] : []),
        // Dates
        ...(contract.expires_at ? [{ label: 'Expires', value: new Date(contract.expires_at).toLocaleDateString() }] : [])
      ],
      link: contractUrl || undefined, // Make the entire card clickable with quote-based URL
      actions: actions.length > 0 ? actions : undefined
    }]
  };
}

function formatRecentLeads(result) {
  if (!result.leads || result.leads.length === 0) {
    return null;
  }

  const cards = result.leads.slice(0, 5).map(lead => ({
    title: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead',
    description: lead.event_type || lead.lead_status || null,
    fields: [
      ...(lead.event_date ? [{ label: 'Event Date', value: new Date(lead.event_date).toLocaleDateString() }] : []),
      ...(lead.venue_name ? [{ label: 'Venue', value: lead.venue_name }] : []),
      ...(lead.lead_status ? [{ label: 'Status', value: lead.lead_status }] : [])
    ],
    link: `/admin/contacts/${lead.id}`,
    actions: [
      {
        label: 'View',
        action: 'link',
        value: `/admin/contacts/${lead.id}`,
        variant: 'default'
      }
    ]
  }));

  return {
    text: `Found ${result.count} recent lead${result.count === 1 ? '' : 's'}:`,
    cards
  };
}

function formatDashboardStats(result) {
  // Handle nested stats object from getDashboardStats
  const stats = result.stats || result;
  
  if (!stats || (!stats.total_contacts && !stats.new_leads && !stats.booked_events)) {
    return {
      text: 'No dashboard statistics available at this time.'
    };
  }

  const buttons = [];
  
  // Build summary text with actual statistics
  const dateRangeLabel = stats.date_range === 'today' ? 'Today' :
                        stats.date_range === 'week' ? 'This Week' :
                        stats.date_range === 'month' ? 'This Month' :
                        stats.date_range === 'quarter' ? 'This Quarter' :
                        stats.date_range === 'year' ? 'This Year' : 'All Time';
  
  let summaryText = `📊 Dashboard Statistics (${dateRangeLabel}):\n\n`;
  summaryText += `• Total Contacts: ${stats.total_contacts || 0}\n`;
  summaryText += `• New Leads: ${stats.new_leads || 0}\n`;
  summaryText += `• Booked Events: ${stats.booked_events || 0}\n`;
  if (stats.conversion_rate) {
    summaryText += `• Conversion Rate: ${stats.conversion_rate}\n`;
  }
  
  // Add quick action buttons
  if (stats.total_contacts > 0) {
    buttons.push({
      label: 'View All Contacts',
      action: 'link',
      value: '/admin/contacts',
      variant: 'default'
    });
  }
  
  if (stats.new_leads > 0) {
    buttons.push({
      label: 'View New Leads',
      action: 'link',
      value: '/admin/contacts?leadStatus=New',
      variant: 'outline'
    });
  }
  
  if (stats.booked_events > 0) {
    buttons.push({
      label: 'View Booked Events',
      action: 'link',
      value: '/admin/contacts?leadStatus=Booked',
      variant: 'outline'
    });
  }

  return {
    text: summaryText,
    buttons: buttons.length > 0 ? buttons : undefined
  };
}

function formatRevenueStats(result) {
  if (!result.success || result.total_revenue === undefined) {
    return {
      text: 'Unable to retrieve revenue statistics at this time.'
    };
  }

  const periodLabel = result.period || 'Period';
  const totalRevenue = result.formatted_total_revenue || `$${(result.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const paymentCount = result.payment_count || 0;
  const averagePayment = result.formatted_average_payment || `$${((result.average_payment || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`;

  let summaryText = `💰 Revenue Statistics (${periodLabel}):\n\n`;
  summaryText += `• Total Revenue: ${totalRevenue}\n`;
  summaryText += `• Payment Count: ${paymentCount}\n`;
  
  if (paymentCount > 0) {
    summaryText += `• Average Payment: ${averagePayment}\n`;
  }

  // Add date range if available
  if (result.start_date && result.end_date) {
    const startDate = new Date(result.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDate = new Date(result.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (startDate !== endDate) {
      summaryText += `• Date Range: ${startDate} - ${endDate}\n`;
    }
  }

  // Create cards for recent payments if available
  const cards = [];
  if (result.payments && result.payments.length > 0) {
    // Show up to 5 recent payments
    result.payments.slice(0, 5).forEach(payment => {
      const actions = [];
      
      if (payment.contact_id) {
        actions.push({
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${payment.contact_id}`,
          variant: 'outline'
        });
      }

      cards.push({
        title: payment.contact_name || 'Payment',
        description: payment.formatted_amount,
        fields: [
          { label: 'Amount', value: payment.formatted_amount },
          { label: 'Date', value: new Date(payment.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'Method', value: payment.payment_method || 'Unknown' }
        ],
        actions: actions.length > 0 ? actions : undefined
      });
    });
  }

  const buttons = [
    {
      label: 'View All Payments',
      action: 'link',
      value: '/admin/financial',
      variant: 'default'
    }
  ];

  return {
    text: summaryText,
    cards: cards.length > 0 ? cards : undefined,
    buttons: buttons.length > 0 ? buttons : undefined
  };
}

function formatHighestPaidProject(result) {
  if (!result.projects || result.projects.length === 0) {
    return null;
  }

  const cards = result.projects.map(project => {
    const actions = [];
    if (project.id) {
      actions.push({
        label: 'View Project',
        action: 'link',
        value: `/admin/projects/${project.id}`,
        variant: 'default'
      });
      if (project.contact_id) {
        actions.push({
          label: 'View Contact',
          action: 'link',
          value: `/admin/contacts/${project.contact_id}`,
          variant: 'outline'
        });
      }
    }

    return {
      title: project.event_name || project.client_name || 'Project',
      description: `Total: $${project.total_amount?.toLocaleString() || '0'}`,
      fields: [
        ...(project.client_name ? [{ label: 'Client', value: project.client_name }] : []),
        ...(project.event_date ? [{ label: 'Event Date', value: new Date(project.event_date).toLocaleDateString() }] : []),
        ...(project.venue_name ? [{ label: 'Venue', value: project.venue_name }] : [])
      ],
      link: project.id ? `/admin/projects/${project.id}` : undefined,
      actions: actions.length > 0 ? actions : undefined
    };
  });

  return {
    text: `Top ${result.projects.length} highest paid project${result.projects.length === 1 ? '' : 's'}:`,
    cards
  };
}

function formatCreationResult(functionName, result) {
  const typeMap = {
    'create_quote': { 
      type: 'Quote', 
      id: result.quote?.id, 
      contactId: result.quote?.contact_id,
      link: (id) => `/admin/quote/${id}`,
      pdfLink: (id) => `/api/quote/${id}/generate-invoice-pdf`
    },
    'create_project': { 
      type: 'Project', 
      id: result.project?.id,
      contactId: result.project?.contact_id,
      link: (id) => `/admin/projects/${id}`
    },
    'generate_contract': { 
      type: 'Contract', 
      id: result.contract?.id,
      contactId: result.contract?.contact_id,
      link: (id) => `/admin/contracts/${id}`,
      pdfLink: (id) => `/api/contract/${id}/generate-pdf`
    }
  };

  const mapping = typeMap[functionName];
  if (!mapping || !mapping.id) {
    return null;
  }

  const actions = [
        {
          label: `View ${mapping.type}`,
          action: 'link',
          value: mapping.link(mapping.id),
          variant: 'default'
    }
  ];

  // Add PDF link if available
  if (mapping.pdfLink) {
    actions.push({
      label: 'View PDF',
      action: 'link',
      value: mapping.pdfLink(mapping.id),
      variant: 'outline'
    });
  }

  // Add contact link if available
  if (mapping.contactId) {
    const tabMap = {
      'create_quote': 'quotes',
      'create_project': 'projects',
      'generate_contract': 'contracts'
    };
    actions.push({
      label: 'Open in Contact',
      action: 'link',
      value: `/admin/contacts/${mapping.contactId}#${tabMap[functionName] || ''}`,
      variant: 'outline'
    });
  }

  actions.push({
          label: 'Copy ID',
          action: 'copy',
          value: mapping.id,
          variant: 'outline'
  });

  return {
    text: `${mapping.type} created successfully!`,
    cards: [{
      title: `${mapping.type} Created`,
      description: `ID: ${mapping.id}`,
      fields: [],
      link: mapping.link(mapping.id),
      actions
    }]
  };
}

function formatReviewRequest(result) {
  if (!result.success) {
    return {
      text: `❌ Failed to send review request${result.contact_name ? ` to ${result.contact_name}` : ''}`,
      cards: [{
        title: 'Review Request Failed',
        description: result.error || 'Unknown error',
        fields: result.contact_name ? [{ label: 'Contact', value: result.contact_name }] : []
      }]
    };
  }

  const methodsText = result.methods_succeeded.length > 0
    ? `via ${result.methods_succeeded.join(' and ')}`
    : '';

  const fields = [
    { label: 'Contact', value: result.contact_name || 'Unknown' },
    { label: 'Methods Sent', value: result.methods_succeeded.join(', ') || 'None' }
  ];

  if (result.methods_failed && result.methods_failed.length > 0) {
    fields.push({
      label: 'Failed Methods',
      value: result.methods_failed.map(f => `${f.method}: ${f.error}`).join('; ')
    });
  }

  return {
    text: `✅ Review request sent ${methodsText}${result.contact_name ? ` to ${result.contact_name}` : ''}`,
    cards: [{
      title: 'Review Request Sent',
      description: `Sent via ${result.methods_succeeded.join(' and ')}`,
      fields: fields,
      actions: result.contact_id ? [{
        label: 'View Contact',
        action: 'link',
        value: `/admin/contacts/${result.contact_id}`,
        variant: 'default'
      }] : []
    }]
  };
}

function formatCommunicationHistory(result) {
  if (!result.success) {
    return {
      text: `❌ Failed to fetch communication history${result.error ? `: ${result.error}` : ''}`,
      cards: [{
        title: 'Error',
        description: result.error || 'Unknown error',
        fields: []
      }]
    };
  }

  if (!result.communications || result.communications.length === 0) {
    return {
      text: `No communication history found for ${result.contact_name || 'this contact'}`,
      cards: [{
        title: 'No Communications',
        description: 'No emails, SMS, calls, or notes found',
        fields: [
          { label: 'Contact', value: result.contact_name || 'Unknown' }
        ]
      }]
    };
  }

  const cards = [];
  const summary = result.summary || {};

  // Summary card
  cards.push({
    title: `Communication History - ${result.contact_name || 'Contact'}`,
    description: `${result.communications.length} total communications`,
    fields: [
      { label: 'Total', value: String(summary.total || result.communications.length) },
      { label: 'Emails', value: String(summary.by_type?.email || 0) },
      { label: 'SMS', value: String(summary.by_type?.sms || 0) },
      { label: 'Calls', value: String(summary.by_type?.call || 0) },
      { label: 'Notes', value: String(summary.by_type?.note || 0) },
      { label: 'Inbound', value: String(summary.by_direction?.inbound || 0) },
      { label: 'Outbound', value: String(summary.by_direction?.outbound || 0) },
      ...(summary.last_contact ? [{
        label: 'Last Contact',
        value: new Date(summary.last_contact).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      }] : [])
    ],
    actions: [{
      label: 'View Contact',
      action: 'link',
      value: `/admin/contacts/${result.contact_id}`,
      variant: 'default'
    }]
  });

  // Communication cards (show up to 10 most recent)
  const recentCommunications = result.communications.slice(0, 10);
  recentCommunications.forEach((comm, index) => {
    const date = new Date(comm.created_at);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const typeEmoji = {
      email: '📧',
      sms: '💬',
      call: '📞',
      note: '📝'
    };

    const directionLabel = comm.direction === 'inbound' ? 'From' : 'To';
    const recipient = comm.sent_to || 'N/A';

    cards.push({
      title: `${typeEmoji[comm.type] || '📋'} ${comm.type.toUpperCase()} - ${comm.direction === 'inbound' ? 'Received' : 'Sent'}`,
      description: dateStr,
      fields: [
        { label: 'Date', value: dateStr },
        { label: directionLabel, value: recipient },
        ...(comm.subject ? [{ label: 'Subject', value: comm.subject }] : []),
        { label: 'Status', value: comm.status || 'sent' },
        { label: 'Content', value: comm.content.length > 200 ? comm.content.substring(0, 200) + '...' : comm.content }
      ],
      actions: []
    });
  });

  return {
    text: `Found ${result.communications.length} communication${result.communications.length === 1 ? '' : 's'} for ${result.contact_name || 'this contact'}`,
    cards: cards
  };
}

function formatSongRequests(result) {
  if (!result.success) {
    return {
      text: `❌ Failed to fetch song requests${result.error ? `: ${result.error}` : ''}`,
      cards: [{
        title: 'Error',
        description: result.error || 'Unknown error',
        fields: []
      }]
    };
  }

  if (!result.requests || result.requests.length === 0) {
    return {
      text: `🎵 No song requests found for the specified time range.`,
      cards: [{
        title: 'No Song Requests',
        description: result.time_range || 'No requests found',
        fields: [
          { label: 'Total', value: '0' },
          { label: 'Revenue', value: '$0.00' }
        ],
        actions: [{
          label: 'View All Requests',
          action: 'link',
          value: '/admin/crowd-requests',
          variant: 'default'
        }]
      }]
    };
  }

  const cards = [];
  const summary = result.summary || {};

  // Build summary text
  let summaryText = `🎵 **Song Requests** (${result.time_range || 'Recent'})\n\n`;
  summaryText += `• Total: ${result.count || 0} request${result.count === 1 ? '' : 's'}\n`;
  summaryText += `• Revenue: ${result.formatted_revenue || '$0.00'}\n`;
  if (result.formatted_pending && result.formatted_pending !== '$0.00') {
    summaryText += `• Pending: ${result.formatted_pending}\n`;
  }
  
  // Status breakdown
  if (summary.by_status) {
    const statusParts = [];
    if (summary.by_status.new > 0) statusParts.push(`${summary.by_status.new} new`);
    if (summary.by_status.acknowledged > 0) statusParts.push(`${summary.by_status.acknowledged} acknowledged`);
    if (summary.by_status.playing > 0) statusParts.push(`${summary.by_status.playing} playing`);
    if (summary.by_status.played > 0) statusParts.push(`${summary.by_status.played} played`);
    if (statusParts.length > 0) {
      summaryText += `• Status: ${statusParts.join(', ')}\n`;
    }
  }

  // Summary card
  cards.push({
    title: '🎵 Song Requests Summary',
    description: result.time_range || 'Recent requests',
    fields: [
      { label: 'Total Requests', value: String(result.count || 0) },
      { label: 'Song Requests', value: String(summary.by_type?.song_requests || 0) },
      { label: 'Shoutouts', value: String(summary.by_type?.shoutouts || 0) },
      { label: 'New', value: String(summary.by_status?.new || 0) },
      { label: 'Acknowledged', value: String(summary.by_status?.acknowledged || 0) },
      { label: 'Played', value: String(summary.by_status?.played || 0) },
      { label: 'Total Revenue', value: result.formatted_revenue || '$0.00' },
      { label: 'Pending Tips', value: result.formatted_pending || '$0.00' }
    ],
    actions: [{
      label: 'View All Requests',
      action: 'link',
      value: '/admin/crowd-requests',
      variant: 'default'
    }]
  });

  // Individual request cards (show up to 10)
  const recentRequests = result.requests.slice(0, 10);
  recentRequests.forEach((request) => {
    const isSongRequest = request.type === 'song_request';
    const typeEmoji = isSongRequest ? '🎵' : '📢';
    const statusEmoji = {
      'new': '🆕',
      'acknowledged': '👀',
      'playing': '▶️',
      'played': '✅',
      'cancelled': '❌'
    };

    const fields = [];
    
    // Song/Shoutout info
    if (isSongRequest && request.song) {
      fields.push({ label: 'Song', value: request.song });
    } else if (!isSongRequest && request.recipient) {
      fields.push({ label: 'For', value: request.recipient });
      if (request.shoutout_message) {
        fields.push({ label: 'Message', value: request.shoutout_message.length > 50 ? request.shoutout_message.substring(0, 50) + '...' : request.shoutout_message });
      }
    }

    // Requester info
    fields.push({ label: 'From', value: request.requester || 'Anonymous' });
    
    // Payment info
    fields.push({ label: 'Tip', value: request.formatted_amount || 'Free' });
    fields.push({ label: 'Payment', value: request.is_paid ? '✅ Paid' : '⏳ Pending' });
    
    // Status and timing
    fields.push({ label: 'Status', value: `${statusEmoji[request.status] || ''} ${request.status || 'Unknown'}` });
    fields.push({ label: 'Time', value: request.time_ago || 'Unknown' });
    
    // Event info if available
    if (request.event_name) {
      fields.push({ label: 'Event', value: request.event_name });
    }

    // Build actions for the card
    const actions = [];
    
    // Status update actions based on current status
    if (request.status === 'new') {
      actions.push({
        label: '👀 Acknowledge',
        action: 'update_song_request',
        value: 'acknowledged',
        variant: 'outline',
        metadata: {
          request_id: request.id,
          status: 'acknowledged'
        }
      });
    }
    
    if (request.status === 'new' || request.status === 'acknowledged') {
      actions.push({
        label: '▶️ Now Playing',
        action: 'update_song_request',
        value: 'playing',
        variant: 'outline',
        metadata: {
          request_id: request.id,
          status: 'playing'
        }
      });
    }
    
    if (request.status !== 'played' && request.status !== 'cancelled') {
      actions.push({
        label: '✅ Mark Played',
        action: 'update_song_request',
        value: 'played',
        variant: 'default',
        metadata: {
          request_id: request.id,
          status: 'played'
        }
      });
    }

    cards.push({
      title: `${typeEmoji} ${isSongRequest ? (request.song || 'Song Request') : (request.recipient ? `Shoutout for ${request.recipient}` : 'Shoutout')}`,
      description: `${statusEmoji[request.status] || ''} ${request.status || 'Unknown'} • ${request.formatted_amount || 'Free'}`,
      fields: fields,
      actions: actions.length > 0 ? actions : undefined
    });
  });

  // Add "View All" button if there are more than shown
  const buttons = [];
  if (result.count > 10) {
    buttons.push({
      label: `View All ${result.count} Requests`,
      action: 'link',
      value: '/admin/crowd-requests',
      variant: 'default'
    });
  }

  return {
    text: summaryText,
    cards: cards,
    buttons: buttons.length > 0 ? buttons : undefined
  };
}

function formatSongRequestUpdate(result) {
  if (!result.success) {
    return {
      text: `❌ Failed to update song request${result.error ? `: ${result.error}` : ''}`,
      cards: [{
        title: 'Update Failed',
        description: result.error || 'Unknown error',
        fields: []
      }]
    };
  }

  const request = result.request || {};
  const statusEmoji = {
    'new': '🆕',
    'acknowledged': '👀',
    'playing': '▶️',
    'played': '✅',
    'cancelled': '❌'
  };

  return {
    text: `✅ Song request updated to "${request.status}"`,
    cards: [{
      title: `${statusEmoji[request.status] || '🎵'} Request Updated`,
      description: request.song || 'Song request',
      fields: [
        ...(request.song ? [{ label: 'Song', value: request.song }] : []),
        { label: 'Requester', value: request.requester || 'Unknown' },
        { label: 'Status', value: `${statusEmoji[request.status] || ''} ${request.status || 'Unknown'}` },
        ...(request.admin_notes ? [{ label: 'Notes', value: request.admin_notes }] : [])
      ],
      actions: [{
        label: 'View All Requests',
        action: 'link',
        value: '/admin/crowd-requests',
        variant: 'default'
      }]
    }]
  };
}

