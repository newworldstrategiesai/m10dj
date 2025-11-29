/**
 * Format Function Results into Structured UI Content
 * 
 * Converts function execution results into structured format with buttons and cards
 */

export function formatResponseWithUI(functionName, result, functionArgs) {
  // Don't format if there was an error
  if (!result.success) {
    return null;
  }

  switch (functionName) {
    case 'search_contacts':
      return formatSearchContacts(result);
    
    case 'get_contact_details':
      return formatContactDetails(result);
    
    case 'get_quote':
      return formatQuote(result);
    
    case 'get_invoice':
      return formatInvoice(result);
    
    case 'get_contract':
      return formatContract(result);
    
    case 'get_recent_leads':
      return formatRecentLeads(result);
    
    case 'create_quote':
    case 'create_project':
    case 'generate_contract':
      return formatCreationResult(functionName, result);
    
    default:
      return null;
  }
}

function formatSearchContacts(result) {
  if (!result.contacts || result.contacts.length === 0) {
    return null;
  }

  const cards = result.contacts.slice(0, 5).map(contact => ({
    title: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email_address || contact.phone || 'Unknown Contact',
    description: contact.event_type || contact.lead_status || null,
    fields: [
      ...(contact.email_address ? [{ label: 'Email', value: contact.email_address }] : []),
      ...(contact.phone ? [{ label: 'Phone', value: contact.phone }] : []),
      ...(contact.event_date ? [{ label: 'Event Date', value: new Date(contact.event_date).toLocaleDateString() }] : []),
      ...(contact.venue_name ? [{ label: 'Venue', value: contact.venue_name }] : []),
      ...(contact.lead_status ? [{ label: 'Status', value: contact.lead_status }] : [])
    ],
    link: `/admin/contacts/${contact.id}`,
    actions: [
      {
        label: 'View Details',
        action: 'link',
        value: `/admin/contacts/${contact.id}`,
        variant: 'default'
      }
    ]
  }));

  return {
    text: result.count === 0 
      ? 'No contacts found matching your search.'
      : `Found ${result.count} contact${result.count === 1 ? '' : 's'}:`,
    cards: cards.length > 0 ? cards : undefined,
    buttons: result.count > 5 ? [
      {
        label: `View All ${result.count} Results`,
        action: 'link',
        value: `/admin/contacts?search=${encodeURIComponent(JSON.stringify(functionArgs))}`
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

  // Main contact card
  cards.push({
    title: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact',
    description: contact.lead_status || 'No status',
    fields: [
      ...(contact.email_address ? [{ label: 'Email', value: contact.email_address }] : []),
      ...(contact.phone ? [{ label: 'Phone', value: contact.phone }] : []),
      ...(contact.event_type ? [{ label: 'Event Type', value: contact.event_type }] : []),
      ...(contact.event_date ? [{ label: 'Event Date', value: new Date(contact.event_date).toLocaleDateString() }] : []),
      ...(contact.venue_name ? [{ label: 'Venue', value: contact.venue_name }] : [])
    ],
    link: `/admin/contacts/${contact.id}`,
    actions: [
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
    ]
  });

  // Quote card
  if (result.quote) {
    cards.push({
      title: 'Quote',
      description: `Status: ${result.quote.status || 'Pending'}`,
      fields: [
        ...(result.quote.package_name ? [{ label: 'Package', value: result.quote.package_name }] : []),
        ...(result.quote.total_price ? [{ label: 'Total', value: `$${result.quote.total_price.toLocaleString()}` }] : [])
      ],
      link: result.quote.id ? `/admin/quote/${result.quote.id}` : undefined,
      actions: result.quote.id ? [
        {
          label: 'View Quote',
          action: 'link',
          value: `/admin/quote/${result.quote.id}`,
          variant: 'outline'
        }
      ] : undefined
    });
  }

  // Invoice card
  if (result.invoice) {
    cards.push({
      title: 'Invoice',
      description: `Status: ${result.invoice.invoice_status || 'Draft'}`,
      fields: [
        ...(result.invoice.invoice_number ? [{ label: 'Invoice #', value: result.invoice.invoice_number }] : []),
        ...(result.invoice.total_amount ? [{ label: 'Amount', value: `$${result.invoice.total_amount.toLocaleString()}` }] : []),
        ...(result.invoice.balance_due ? [{ label: 'Balance Due', value: `$${result.invoice.balance_due.toLocaleString()}` }] : [])
      ],
      link: result.invoice.id ? `/admin/invoices/${result.invoice.id}` : undefined,
      actions: result.invoice.id ? [
        {
          label: 'View Invoice',
          action: 'link',
          value: `/admin/invoices/${result.invoice.id}`,
          variant: 'outline'
        }
      ] : undefined
    });
  }

  // Contract card
  if (result.contract) {
    cards.push({
      title: 'Contract',
      description: `Status: ${result.contract.status || 'Draft'}`,
      fields: [
        ...(result.contract.contract_number ? [{ label: 'Contract #', value: result.contract.contract_number }] : []),
        ...(result.contract.total_amount ? [{ label: 'Amount', value: `$${result.contract.total_amount.toLocaleString()}` }] : [])
      ],
      link: result.contract.id ? `/admin/contracts/${result.contract.id}` : undefined,
      actions: result.contract.id ? [
        {
          label: 'View Contract',
          action: 'link',
          value: `/admin/contracts/${result.contract.id}`,
          variant: 'outline'
        }
      ] : undefined
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
  return {
    text: 'Quote details:',
    cards: [{
      title: quote.package_name || 'Quote',
      description: `Status: ${quote.status || 'Pending'}`,
      fields: [
        ...(quote.total_price ? [{ label: 'Total Price', value: `$${quote.total_price.toLocaleString()}` }] : []),
        ...(quote.package_price ? [{ label: 'Package Price', value: `$${quote.package_price.toLocaleString()}` }] : [])
      ],
      link: quote.id ? `/admin/quote/${quote.id}` : undefined,
      actions: quote.id ? [
        {
          label: 'View Quote',
          action: 'link',
          value: `/admin/quote/${quote.id}`,
          variant: 'default'
        }
      ] : undefined
    }]
  };
}

function formatInvoice(result) {
  if (!result.invoice) {
    return null;
  }

  const invoice = result.invoice;
  return {
    text: 'Invoice details:',
    cards: [{
      title: `Invoice ${invoice.invoice_number || ''}`,
      description: `Status: ${invoice.invoice_status || 'Draft'}`,
      fields: [
        ...(invoice.total_amount ? [{ label: 'Total Amount', value: `$${invoice.total_amount.toLocaleString()}` }] : []),
        ...(invoice.balance_due ? [{ label: 'Balance Due', value: `$${invoice.balance_due.toLocaleString()}` }] : []),
        ...(invoice.due_date ? [{ label: 'Due Date', value: new Date(invoice.due_date).toLocaleDateString() }] : [])
      ],
      link: invoice.id ? `/admin/invoices/${invoice.id}` : undefined,
      actions: invoice.id ? [
        {
          label: 'View Invoice',
          action: 'link',
          value: `/admin/invoices/${invoice.id}`,
          variant: 'default'
        }
      ] : undefined
    }]
  };
}

function formatContract(result) {
  if (!result.contract) {
    return null;
  }

  const contract = result.contract;
  return {
    text: 'Contract details:',
    cards: [{
      title: `Contract ${contract.contract_number || ''}`,
      description: `Status: ${contract.status || 'Draft'}`,
      fields: [
        ...(contract.total_amount ? [{ label: 'Total Amount', value: `$${contract.total_amount.toLocaleString()}` }] : []),
        ...(contract.deposit_amount ? [{ label: 'Deposit', value: `$${contract.deposit_amount.toLocaleString()}` }] : [])
      ],
      link: contract.id ? `/admin/contracts/${contract.id}` : undefined,
      actions: contract.id ? [
        {
          label: 'View Contract',
          action: 'link',
          value: `/admin/contracts/${contract.id}`,
          variant: 'default'
        }
      ] : undefined
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

function formatCreationResult(functionName, result) {
  const typeMap = {
    'create_quote': { type: 'Quote', id: result.quote?.id, link: (id) => `/admin/quote/${id}` },
    'create_project': { type: 'Project', id: result.project?.id, link: (id) => `/admin/projects/${id}` },
    'generate_contract': { type: 'Contract', id: result.contract?.id, link: (id) => `/admin/contracts/${id}` }
  };

  const mapping = typeMap[functionName];
  if (!mapping || !mapping.id) {
    return null;
  }

  return {
    text: `${mapping.type} created successfully!`,
    cards: [{
      title: `${mapping.type} Created`,
      description: `ID: ${mapping.id}`,
      fields: [],
      link: mapping.link(mapping.id),
      actions: [
        {
          label: `View ${mapping.type}`,
          action: 'link',
          value: mapping.link(mapping.id),
          variant: 'default'
        },
        {
          label: 'Copy ID',
          action: 'copy',
          value: mapping.id,
          variant: 'outline'
        }
      ]
    }]
  };
}

