/**
 * Function Definitions for Admin Assistant
 * 
 * Defines all available operations the assistant can perform
 * using OpenAI Function Calling format
 */

/**
 * Get public-safe function definitions for website voice assistant
 */
export function getPublicFunctionDefinitions() {
  return [
    {
      name: 'create_contact',
      description: 'Create a new contact/lead with personal information and event details. Use this when a customer provides their information.',
      parameters: {
        type: 'object',
        properties: {
          first_name: { type: 'string', description: 'First name' },
          last_name: { type: 'string', description: 'Last name' },
          email_address: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          event_type: {
            type: 'string',
            enum: ['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']
          },
          event_date: { type: 'string', description: 'Event date in YYYY-MM-DD format' },
          venue_name: { type: 'string', description: 'Venue name' },
          venue_address: { type: 'string', description: 'Venue address' },
          guest_count: { type: 'number', description: 'Number of guests' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['first_name', 'email_address']
      }
    },
    {
      name: 'schedule_consultation',
      description: 'Schedule a free consultation for a customer. Returns a link to the scheduling page.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID if available' },
          email: { type: 'string', description: 'Customer email' },
          name: { type: 'string', description: 'Customer name' },
        },
        required: ['email', 'name']
      }
    },
    {
      name: 'request_quote',
      description: 'Request a quote for an event. Creates a quote request that will be processed by the team.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID if available' },
          event_type: {
            type: 'string',
            enum: ['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']
          },
          event_date: { type: 'string', description: 'Event date' },
          guest_count: { type: 'number', description: 'Number of guests' },
          notes: { type: 'string', description: 'Special requests or details' },
        },
        required: ['event_type']
      }
    },
    {
      name: 'get_music_recommendations',
      description: 'Get music recommendations based on event type, preferences, or mood. Helps customers discover music for their event.',
      parameters: {
        type: 'object',
        properties: {
          event_type: {
            type: 'string',
            enum: ['wedding', 'corporate', 'school_dance', 'holiday_party', 'private_party', 'other']
          },
          mood: {
            type: 'string',
            enum: ['upbeat', 'romantic', 'energetic', 'relaxed', 'classic', 'modern']
          },
          genre: { type: 'string', description: 'Preferred music genre' },
          era: { type: 'string', description: 'Preferred music era (e.g., 80s, 90s, 2000s)' },
        }
      }
    },
  ];
}

export function getFunctionDefinitions() {
  return [
    // ============================================
    // CONTACT & LEAD MANAGEMENT
    // ============================================
    {
      name: 'search_contacts',
      description: 'Search for contacts by name, email, phone, event type, or lead status. Returns a list of matching contacts with their details. NOTE: If user asks about contracts, invoices, or quotes for a contact, use get_contract, get_invoice, or get_quote instead - do NOT use search_contacts.',
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
      description: 'Update the lead status of a contact. Common statuses: New, Contacted, Qualified, Proposal Sent, Negotiating, Booked, Lost, Completed, Spam. Use this when user says "mark as complete", "it\'s passed", "event completed", "gig went well", "mark as spam", "this is spam", or similar phrases. ALWAYS use contact_id from previous function results (get_contact_details, search_contacts, etc.) - do NOT search again.',
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
            enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost', 'Completed', 'Spam']
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
    {
      name: 'delete_contacts',
      description: 'Delete one or more contacts permanently (soft delete). Use this when user asks to "delete contacts", "remove contacts", "delete test users", or "delete [name]". Can delete by contact_id (single or array), email pattern (e.g., "@test.com" for test users), or contact name. When user says "delete all test users" or "delete the test users", search for contacts with test email patterns and delete them. ALWAYS use contact_id from previous search results when available.',
      parameters: {
        type: 'object',
        properties: {
          contact_ids: {
            type: 'array',
            description: 'Array of contact IDs to delete. Use this when you have specific contact IDs from previous search results.',
            items: {
              type: 'string'
            }
          },
          email_pattern: {
            type: 'string',
            description: 'Email pattern to match (e.g., "@test.com", "@mobile-test.com") for bulk deletion. Use this when user wants to delete test users or contacts matching a pattern.'
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search and delete (first name, last name, or full name). Will search first, then delete if found.'
          },
          reason: {
            type: 'string',
            description: 'Optional reason for deletion (e.g., "Test user cleanup", "Duplicate removal")'
          }
        }
      }
    },

    // ============================================
    // QUOTE MANAGEMENT
    // ============================================
    {
      name: 'get_quote',
      description: 'Get quote details for a contact. Use this when user asks "do we have a quote", "show me the quote", or "quote for [name]". Can search by contact_id (from previous results), quote_id, or contact_name. If user asks "quote for Marlee", call get_quote(contact_name="Marlee") directly - do NOT call search_contacts first.',
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
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search for (first name, last name, or full name). Will search contacts table and then get quote for the found contact.'
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
      description: 'Get invoice details for a contact. Use this when user asks "do we have an invoice", "show me the invoice", or "invoice for [name]". Can search by contact_id (from previous results), invoice_id, or contact_name. If user asks "invoice for Marlee", call get_invoice(contact_name="Marlee") directly - do NOT call search_contacts first.',
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
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search for (first name, last name, or full name). Will search contacts table and then get invoice for the found contact.'
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
    {
      name: 'get_payments',
      description: 'Get payment history for a contact. Returns all payments including Stripe payment data (payment intent IDs, session IDs, transaction dates, amounts, payment methods). Use this when user asks "has [name] paid", "show me payments for [name]", "payment history", or "Stripe payments". Can search by contact_id, contact_name, or payment_id.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get payments for'
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search for (first name, last name, or full name). Will search contacts table and then get payments for the found contact.'
          },
          payment_id: {
            type: 'string',
            description: 'Payment ID (alternative to contact_id)'
          },
          status: {
            type: 'string',
            description: 'Filter by payment status',
            enum: ['Paid', 'Pending', 'Overdue', 'Refunded', 'Disputed']
          },
          limit: {
            type: 'number',
            description: 'Maximum number of payments to return (default: 50)',
            default: 50
          }
        }
      }
    },
    {
      name: 'get_questionnaire_link',
      description: 'Get the questionnaire link for a contact. Use this when user asks "questionnaire link for [name]", "send me the questionnaire", "questionnaire for [name]", or "music questionnaire link". Can search by contact_id or contact_name. Returns the client-facing questionnaire URL that can be shared with the client.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get questionnaire link for'
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search for (first name, last name, or full name). Will search contacts table and then get questionnaire link for the found contact.'
          }
        }
      }
    },
    {
      name: 'get_scheduling_link',
      description: 'Get the scheduling/booking link for a contact. Use this when user asks "scheduling link for [name]", "send scheduling link", "book a meeting with [name]", "schedule a meeting", or "send calendar link". Can search by contact_id or contact_name. Returns the public scheduling page URL where the client can book a meeting. The link can optionally include contact information as query parameters for personalization.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get scheduling link for'
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search for (first name, last name, or full name). Will search contacts table and then get scheduling link for the found contact.'
          },
          include_contact_info: {
            type: 'boolean',
            description: 'Whether to include contact information in the URL for pre-filling the booking form (default: false)',
            default: false
          }
        }
      }
    },

    // ============================================
    // CONTRACT MANAGEMENT
    // ============================================
    {
      name: 'get_contract',
      description: 'Get contract details for a contact. ALWAYS use this function when user asks about contracts (e.g., "do we have a contract", "show me the contract", "contract for [name]"). This function can search by contact_name directly - you do NOT need to call search_contacts first. If user asks "contract for Marlee", call get_contract(contact_name="Marlee"). If you have contact_id from previous results, use get_contract(contact_id="[id]"). Returns contract with status indicators (viewed, client signed, admin signed) and direct link.',
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
          },
          contact_name: {
            type: 'string',
            description: 'Contact name to search for (first name, last name, or full name). Will search contacts table and then get contract for the found contact.'
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
      description: 'Create a project/event for a contact. Links the contact to an event record for tracking. Use this when marking an event as complete if no event record exists yet. Extract event details (event_date, event_type, venue_name) from the contact record. The event_name should be descriptive like "[Contact Name]\'s [event_type]" (e.g., "Kristen Cerda\'s Halloween event"). If the event is being marked as completed, set status to "completed".',
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
          },
          start_time: {
            type: 'string',
            description: 'Event start time in HH:MM:SS format (e.g., "18:00:00" for 6 PM)'
          },
          end_time: {
            type: 'string',
            description: 'Event end time in HH:MM:SS format (e.g., "21:00:00" for 9 PM)'
          },
          status: {
            type: 'string',
            description: 'Event status. Use "completed" if the event has already happened.',
            enum: ['confirmed', 'in_progress', 'completed', 'cancelled']
          }
        },
        required: ['contact_id', 'event_name']
      }
    },
    {
      name: 'get_project',
      description: 'Get project/event details for a contact. Returns event information, venue details, timeline, and status. Use this to check if an event record exists before creating a new one. If no event exists, it will return success: false.',
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
    {
      name: 'get_upcoming_events',
      description: 'Get upcoming events/booked events within a specific date range. Use this when user asks "What events are coming up this week?", "Show me upcoming events", "What\'s happening this month?", etc. Filters by event_date within the specified date range.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default: 7 for "this week")',
            default: 7
          },
          lead_status: {
            type: 'string',
            description: 'Filter by lead status (default: "Booked" for confirmed events)',
            enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost', 'Completed', 'Spam'],
            default: 'Booked'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 50)',
            default: 50
          }
        }
      }
    },
    {
      name: 'initiate_outbound_call',
      description: 'Initiate an AI-powered outbound call to a contact. Use this when user says "call [contact]", "give them a call", "reach out to [name]", "call [name] about [topic]". The AI will have a natural conversation with the contact.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to call. ALWAYS use contact_id from previous function results (get_contact_details, search_contacts, etc.) - do NOT search again.'
          },
          call_type: {
            type: 'string',
            description: 'Type of call',
            enum: ['follow_up', 'qualification', 'reminder', 'confirmation', 'payment_reminder'],
            default: 'follow_up'
          },
          message: {
            type: 'string',
            description: 'Optional: Specific message or topic for the call (e.g., "following up on their quote", "confirming event details")'
          }
        },
        required: ['contact_id']
      }
    },
    {
      name: 'get_revenue_stats',
      description: 'Get revenue statistics including total revenue, payment counts, and breakdown by date period. Use this when user asks about revenue, money made, income, earnings, or payments received. Supports filtering by month, year, or date range. Can aggregate from all paid payments or filter by specific periods like "November", "this month", "2024", etc.',
      parameters: {
        type: 'object',
        properties: {
          month: {
            type: 'number',
            description: 'Filter by month (1-12). If provided, year is also required.',
            minimum: 1,
            maximum: 12
          },
          year: {
            type: 'number',
            description: 'Filter by year (e.g., 2024). If month is provided, year is required.',
            minimum: 2000,
            maximum: 2100
          },
          date_range: {
            type: 'string',
            description: 'Filter by date range (today, week, month, quarter, year, all). Use "month" for current month.',
            enum: ['today', 'week', 'month', 'quarter', 'year', 'all'],
            default: 'month'
          },
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (alternative to date_range)'
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (alternative to date_range)'
          }
        }
      }
    },

    // ============================================
    // COMMUNICATION
    // ============================================
    {
      name: 'send_sms',
      description: 'Send an SMS message to a contact. Uses Twilio to send the message. ONLY call this function after the user has approved the message. Do NOT call this immediately - first ask what they want to say, rewrite it, show them the rewritten version, and get approval.',
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
      description: 'Send an email to a contact. Can include subject and message content. Supports HTML formatting and can include quote/invoice/contract links. ONLY call this function after the user has approved the message. Do NOT call this immediately - first ask what they want to say, rewrite it, show them the rewritten version, and get approval.',
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
    },
    {
      name: 'request_review',
      description: 'Send a review request message to a past client (contact with Completed status). Sends either SMS or email with a Google review link. Automatically generates a friendly, personalized message asking them to leave a review. Can be called directly when user asks to request a review.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to send review request to'
          },
          method: {
            type: 'string',
            description: 'Preferred method: "sms", "email", or "both" (default: "email" if email available, otherwise "sms")',
            enum: ['sms', 'email', 'both']
          }
        },
        required: ['contact_id']
      }
    },
    {
      name: 'get_communication_history',
      description: 'Get all communication history (emails, SMS, calls, notes) for a contact. Returns a chronological list of all interactions including inbound and outbound messages, with timestamps, content, and status.',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'Contact ID to get communication history for'
          },
          contact_name: {
            type: 'string',
            description: 'Contact name (alternative to contact_id)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of communications to return (default: 50, max: 100)',
            default: 50
          },
          communication_type: {
            type: 'string',
            description: 'Filter by communication type: "email", "sms", "call", "note", or "all" (default: "all")',
            enum: ['email', 'sms', 'call', 'note', 'all']
          }
        },
        required: []
      }
    }
  ];
}

