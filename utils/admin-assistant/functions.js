/**
 * Function Definitions for Admin Assistant
 * 
 * Defines all available operations the assistant can perform
 * using OpenAI Function Calling format
 */

export function getFunctionDefinitions() {
  return [
    // ============================================
    // CONTACT & LEAD MANAGEMENT
    // ============================================
    {
      name: 'search_contacts',
      description: 'Search for contacts by name, email, phone, event type, or lead status. Returns a list of matching contacts with their details.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query - can be name, email, phone number, or partial match'
          },
          event_type: {
            type: 'string',
            description: 'Filter by event type (wedding, corporate, school_dance, holiday_party, private_party, other)',
            enum: ['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']
          },
          lead_status: {
            type: 'string',
            description: 'Filter by lead status (New, Contacted, Qualified, Proposal Sent, Negotiating, Booked, Lost, Completed)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10, max: 50)',
            default: 10
          }
        }
      }
    },
    {
      name: 'get_contact_details',
      description: 'Get detailed information about a specific contact by ID, including all related records (quotes, invoices, contracts, projects).',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'The contact ID (UUID)'
          }
        },
        required: ['contact_id']
      }
    },
    {
      name: 'update_lead_status',
      description: 'Update the lead status of a contact. Common statuses: New, Contacted, Qualified, Proposal Sent, Negotiating, Booked, Lost, Completed.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'The contact ID to update'
          },
          status: {
            type: 'string',
            description: 'New lead status',
            enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost', 'Completed']
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the status change'
          }
        },
        required: ['contact_id', 'status']
      }
    },
    {
      name: 'add_contact_note',
      description: 'Add a note to a contact record. Notes are visible in the contact details and help track interactions.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'The contact ID'
          },
          note: {
            type: 'string',
            description: 'The note to add'
          },
          is_internal: {
            type: 'boolean',
            description: 'Whether this is an internal note (not visible to client)',
            default: false
          }
        },
        required: ['contact_id', 'note']
      }
    },
    {
      name: 'create_contact',
      description: 'Create a new contact/lead with personal information and event details. Automatically creates a project and initial quote/invoice/contract records.',
      parameters: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
            description: 'First name of the contact'
          },
          last_name: {
            type: 'string',
            description: 'Last name of the contact'
          },
          email_address: {
            type: 'string',
            description: 'Email address'
          },
          phone: {
            type: 'string',
            description: 'Phone number (can include formatting like +1 (901) 555-1234)'
          },
          event_type: {
            type: 'string',
            description: 'Type of event',
            enum: ['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']
          },
          event_date: {
            type: 'string',
            description: 'Event date in YYYY-MM-DD format'
          },
          event_time: {
            type: 'string',
            description: 'Event start time (HH:MM:SS format or natural language like "3:00 PM")'
          },
          venue_name: {
            type: 'string',
            description: 'Name of the venue'
          },
          venue_address: {
            type: 'string',
            description: 'Full address of the venue'
          },
          guest_count: {
            type: 'number',
            description: 'Expected number of guests'
          },
          notes: {
            type: 'string',
            description: 'Additional notes or special requests'
          },
          lead_source: {
            type: 'string',
            description: 'Where this lead came from (e.g., "Website", "Referral", "Social Media")',
            default: 'Admin Assistant'
          }
        },
        required: ['first_name', 'last_name', 'email_address']
      }
    },
    {
      name: 'update_contact',
      description: 'Update contact information including personal details, event information, venue details, and lead status. Only provide fields that need to be updated.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to update'
          },
          first_name: {
            type: 'string',
            description: 'First name'
          },
          last_name: {
            type: 'string',
            description: 'Last name'
          },
          email_address: {
            type: 'string',
            description: 'Email address'
          },
          phone: {
            type: 'string',
            description: 'Phone number'
          },
          event_type: {
            type: 'string',
            description: 'Type of event',
            enum: ['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']
          },
          event_date: {
            type: 'string',
            description: 'Event date in YYYY-MM-DD format'
          },
          event_time: {
            type: 'string',
            description: 'Event start time (HH:MM:SS format or natural language like "3:00 PM")'
          },
          venue_name: {
            type: 'string',
            description: 'Venue name'
          },
          venue_address: {
            type: 'string',
            description: 'Full venue address'
          },
          guest_count: {
            type: 'number',
            description: 'Expected number of guests'
          },
          special_requests: {
            type: 'string',
            description: 'Special requests or notes'
          }
        },
        required: ['contact_id']
      }
    },

    // ============================================
    // QUOTE MANAGEMENT
    // ============================================
    {
      name: 'get_quote',
      description: 'Get quote details by contact ID or quote ID. Returns package selection, pricing, add-ons, and status.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get quote for'
          },
          quote_id: {
            type: 'string',
            description: 'Quote ID (alternative to contact_id)'
          }
        }
      }
    },
    {
      name: 'create_quote',
      description: 'Create or update a quote for a contact. Sets package, add-ons, and total price.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to create quote for'
          },
          package_name: {
            type: 'string',
            description: 'Package name (e.g., "Reception Only - $2,500", "Ceremony & Reception - $3,000")'
          },
          package_price: {
            type: 'number',
            description: 'Base package price'
          },
          addons: {
            type: 'array',
            description: 'Array of add-on objects with name and price',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' }
              }
            }
          },
          total_price: {
            type: 'number',
            description: 'Total price including package and add-ons'
          },
          discount_code: {
            type: 'string',
            description: 'Optional discount code to apply'
          }
        },
        required: ['contact_id', 'package_name', 'package_price', 'total_price']
      }
    },

    // ============================================
    // INVOICE MANAGEMENT
    // ============================================
    {
      name: 'get_invoice',
      description: 'Get invoice details by contact ID or invoice ID. Returns invoice number, status, amounts, line items, and payment information.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get invoice for'
          },
          invoice_id: {
            type: 'string',
            description: 'Invoice ID (alternative to contact_id)'
          }
        }
      }
    },
    {
      name: 'update_invoice',
      description: 'Update invoice details like line items, amounts, or status. Can also mark as sent or paid.',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: {
            type: 'string',
            description: 'Invoice ID to update'
          },
          line_items: {
            type: 'array',
            description: 'Array of line items',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                rate: { type: 'number' },
                amount: { type: 'number' }
              }
            }
          },
          total_amount: {
            type: 'number',
            description: 'Total invoice amount'
          },
          status: {
            type: 'string',
            description: 'Invoice status',
            enum: ['Draft', 'Sent', 'Viewed', 'Paid', 'Partial', 'Overdue', 'Cancelled']
          }
        },
        required: ['invoice_id']
      }
    },

    // ============================================
    // CONTRACT MANAGEMENT
    // ============================================
    {
      name: 'get_contract',
      description: 'Get contract details by contact ID or contract ID. Returns contract number, status, signature information, and terms.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get contract for'
          },
          contract_id: {
            type: 'string',
            description: 'Contract ID (alternative to contact_id)'
          }
        }
      }
    },
    {
      name: 'generate_contract',
      description: 'Generate a contract for a contact. Creates a draft contract that can be sent for signature.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to generate contract for'
          },
          total_amount: {
            type: 'number',
            description: 'Total contract amount'
          },
          deposit_amount: {
            type: 'number',
            description: 'Deposit amount required'
          }
        },
        required: ['contact_id', 'total_amount']
      }
    },

    // ============================================
    // PROJECT/EVENT MANAGEMENT
    // ============================================
    {
      name: 'create_project',
      description: 'Create a project/event for a contact. Links the contact to an event record for tracking.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to create project for'
          },
          event_name: {
            type: 'string',
            description: 'Name of the event/project'
          },
          event_date: {
            type: 'string',
            description: 'Event date in YYYY-MM-DD format'
          },
          venue_name: {
            type: 'string',
            description: 'Venue name'
          }
        },
        required: ['contact_id', 'event_name']
      }
    },
    {
      name: 'get_project',
      description: 'Get project/event details for a contact. Returns event information, venue details, timeline, and status.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get project for'
          },
          project_id: {
            type: 'string',
            description: 'Project ID (alternative to contact_id)'
          }
        }
      }
    },
    {
      name: 'update_project',
      description: 'Update project/event information. Only provide fields that need to be updated.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'Project ID to update'
          },
          event_name: {
            type: 'string',
            description: 'Name of the event'
          },
          event_date: {
            type: 'string',
            description: 'Event date in YYYY-MM-DD format'
          },
          start_time: {
            type: 'string',
            description: 'Event start time (HH:MM:SS format)'
          },
          end_time: {
            type: 'string',
            description: 'Event end time (HH:MM:SS format)'
          },
          venue_name: {
            type: 'string',
            description: 'Venue name'
          },
          venue_address: {
            type: 'string',
            description: 'Venue address'
          },
          number_of_guests: {
            type: 'number',
            description: 'Number of guests'
          },
          status: {
            type: 'string',
            description: 'Project status',
            enum: ['confirmed', 'pending', 'completed', 'cancelled']
          }
        },
        required: ['project_id']
      }
    },

    // ============================================
    // ANALYTICS & REPORTING
    // ============================================
    {
      name: 'get_dashboard_stats',
      description: 'Get dashboard statistics including total leads, bookings, conversion rate, and recent activity.',
      parameters: {
        type: 'object',
        properties: {
          date_range: {
            type: 'string',
            description: 'Date range for statistics',
            enum: ['today', 'week', 'month', 'quarter', 'year', 'all'],
            default: 'month'
          }
        }
      }
    },
    {
      name: 'get_highest_paid_project',
      description: 'Get the highest paid project/event. Returns project details including client name, event date, venue, and total amount. Use this when asked about highest paid projects, most valuable projects, or top revenue.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of top projects to return (default: 1, max: 10)',
            default: 1
          },
          date_range: {
            type: 'string',
            description: 'Filter by date range (today, week, month, quarter, year, all)',
            enum: ['today', 'week', 'month', 'quarter', 'year', 'all'],
            default: 'all'
          }
        }
      }
    },
    {
      name: 'get_recent_leads',
      description: 'Get recent leads/submissions. Returns new contacts from the specified time period.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back (default: 7)',
            default: 7
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 10)',
            default: 10
          }
        }
      }
    },

    // ============================================
    // COMMUNICATION
    // ============================================
    {
      name: 'send_sms',
      description: 'Send an SMS message to a contact. Uses Twilio to send the message.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to send SMS to'
          },
          message: {
            type: 'string',
            description: 'Message content to send'
          }
        },
        required: ['contact_id', 'message']
      }
    },
    {
      name: 'send_email',
      description: 'Send an email to a contact. Can include subject and message content. Supports HTML formatting and can include quote/invoice/contract links.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to send email to'
          },
          subject: {
            type: 'string',
            description: 'Email subject line'
          },
          message: {
            type: 'string',
            description: 'Email message content (supports plain text, will be converted to HTML)'
          },
          to: {
            type: 'string',
            description: 'Email address (optional, defaults to contact email)'
          }
        },
        required: ['contact_id', 'subject', 'message']
      }
    }
  ];
}

