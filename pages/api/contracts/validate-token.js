import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Fetch contract by signing token
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        contract_html,
        contract_type,
        event_name,
        event_type,
        event_date,
        venue_name,
        venue_address,
        guest_count,
        total_amount,
        status,
        signing_token,
        signing_token_expires_at,
        signed_at,
        signed_by_client,
        signed_by_client_email,
        client_signature_data,
        contact_id,
        invoice_id,
        recipient_name,
        recipient_email,
        sender_name,
        sender_email,
        is_personal,
        purpose,
        contacts (
          first_name,
          last_name,
          email_address
        )
      `)
      .eq('signing_token', token)
      .single();

    if (error || !contract) {
      console.error('[validate-token] Contract not found:', error);
      return res.status(404).json({ error: 'Invalid or expired contract link' });
    }

    console.log('[validate-token] Contract found:', {
      id: contract.id,
      contract_number: contract.contract_number,
      has_contract_html: !!contract.contract_html,
      contract_html_length: contract.contract_html?.length || 0,
      status: contract.status
    });

    // Check if token is expired
    if (contract.signing_token_expires_at && new Date(contract.signing_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'This contract link has expired' });
    }

    // Check if contract_html is missing, has unprocessed template variables, or has outdated cancellation policy
    const hasUnprocessedVariables = contract.contract_html && (
      contract.contract_html.includes('{{party_a_name}}') ||
      contract.contract_html.includes('{{party_b_name}}') ||
      contract.contract_html.includes('{{term_years}}') ||
      contract.contract_html.includes('{{governing_state}}') ||
      (contract.contract_html.includes('{{') && contract.contract_html.match(/\{\{[^}]+\}\}/g)?.length > 5)
    );
    
    // Check if cancellation policy is outdated (doesn't mention deposit is non-refundable)
    const hasOutdatedCancellationPolicy = contract.contract_html && 
      contract.contract_html.includes('CANCELLATION POLICY') &&
      !contract.contract_html.includes('deposit') && 
      !contract.contract_html.includes('non-refundable');
    
    // Also check if deposit section is missing from compensation
    const missingDepositInfo = contract.contract_html && 
      contract.contract_html.includes('COMPENSATION') &&
      !contract.contract_html.includes('Deposit') &&
      !contract.contract_html.includes('deposit');
    
    // Check if event details are missing/empty in the HTML
    // This detects when template variables were replaced with empty strings
    const missingEventDetails = contract.contract_html && 
      contract.contract_html.includes('EVENT DETAILS') && (
        // Check if Event Date field is empty (shows "Event Date:</strong>" followed by nothing or just whitespace)
        (contract.contract_html.includes('Event Date:</strong>') && 
         !contract.contract_html.match(/Event Date:<\/strong>[^<]*[A-Za-z0-9]/)) ||
        // Check if Venue field is empty
        (contract.contract_html.includes('Venue:</strong>') && 
         !contract.contract_html.match(/Venue:<\/strong>[^<]*[A-Za-z0-9]/)) ||
        // Check if the description has empty event details (shows "on at, .")
        contract.contract_html.includes('on at, .') ||
        contract.contract_html.includes('approximately guests')
      );

    if (!contract.contract_html || hasUnprocessedVariables || hasOutdatedCancellationPolicy || missingDepositInfo || missingEventDetails) {
      console.warn('[validate-token] Contract HTML is missing or has unprocessed variables, attempting to regenerate...');
      try {
        // Import the HTML generation function
        const { generateContractHtml } = await import('../../../utils/ensure-contract-exists-for-invoice');
        
        // Fetch invoice if contract is linked to one
        let invoice = null;
        // contract.contacts is an object from the join, extract it properly
        let contact = (contract.contacts && typeof contract.contacts === 'object' && !Array.isArray(contract.contacts)) 
          ? contract.contacts 
          : null;
        let event = null;
        
        // Try to find invoice by invoice_id (contracts have invoice_id field)
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*, contacts:contact_id(*), events:project_id(*)')
          .eq('id', contract.invoice_id)
          .maybeSingle();
        
        if (invoiceData) {
          invoice = invoiceData;
          // Extract contact from invoice join
          if (invoiceData.contacts && typeof invoiceData.contacts === 'object' && !Array.isArray(invoiceData.contacts)) {
            contact = invoiceData.contacts;
          }
          // Extract event from invoice join
          if (invoiceData.events && typeof invoiceData.events === 'object' && !Array.isArray(invoiceData.events)) {
            event = invoiceData.events;
          }
        }
        
        // If still no contact but we have contact_id, fetch contact directly
        if (!contact && contract.contact_id) {
          const { data: contactData } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contract.contact_id)
            .single();
          
          if (contactData) {
            contact = contactData;
          }
        }
        
        // If still no event but invoice has project_id, fetch event directly
        if (!event && invoice && invoice.project_id) {
          const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('id', invoice.project_id)
            .single();
          
          if (eventData) {
            event = eventData;
            console.log('[validate-token] Fetched event directly:', {
              event_name: event.event_name,
              event_date: event.event_date,
              venue_name: event.venue_name
            });
          }
        }
        
        console.log('[validate-token] Regeneration data:', {
          has_contact: !!contact,
          has_invoice: !!invoice,
          has_event: !!event,
          contact_id: contract.contact_id,
          invoice_id: contract.invoice_id,
          event_data: event ? {
            event_name: event.event_name,
            event_type: event.event_type,
            event_date: event.event_date,
            venue_name: event.venue_name,
            venue_address: event.venue_address,
            number_of_guests: event.number_of_guests
          } : null,
          contact_data: contact ? {
            event_type: contact.event_type,
            event_date: contact.event_date,
            venue_name: contact.venue_name,
            venue_address: contact.venue_address,
            guest_count: contact.guest_count
          } : null
        });
        
        // If we have contact info, generate the HTML
        if (contact) {
          // Use event data from contract record if available (fallback)
          // The contract record itself stores event details, so use those if event join didn't work
          let eventData = event;
          if (!eventData && (contract.event_date || contract.venue_name)) {
            // Contract record has event data, use it
            eventData = {
              event_name: contract.event_name,
              event_type: contract.event_type || contact?.event_type,
              event_date: contract.event_date,
              venue_name: contract.venue_name,
              venue_address: contract.venue_address,
              number_of_guests: contract.guest_count
            };
            console.log('[validate-token] Using event data from contract record:', {
              event_name: eventData.event_name,
              event_date: eventData.event_date,
              venue_name: eventData.venue_name,
              venue_address: eventData.venue_address,
              guest_count: eventData.number_of_guests
            });
          }
          
          console.log('[validate-token] Generating contract HTML with contact:', {
            contact_name: `${contact.first_name} ${contact.last_name}`,
            has_invoice: !!invoice,
            has_event: !!eventData,
            event_date: eventData?.event_date || contact.event_date,
            venue_name: eventData?.venue_name || contact.venue_name,
            using_contract_event_data: !event && !!contract.event_date
          });
          
          const contractHtml = await generateContractHtml(
            invoice || { total_amount: contract.total_amount || 0, line_items: [] },
            contact,
            eventData, // Use eventData which may come from contract record
            contract.contract_number || '',
            supabase
          );
          
          console.log('[validate-token] Generated HTML result:', {
            has_html: !!contractHtml?.contractHtml,
            html_length: contractHtml?.contractHtml?.length || 0,
            template_name: contractHtml?.templateName
          });
          
          if (contractHtml && contractHtml.contractHtml) {
            // Update the contract with generated HTML
            const { error: updateError } = await supabase
              .from('contracts')
              .update({ 
                contract_html: contractHtml.contractHtml,
                contract_template: contractHtml.templateName || 'Default Contract'
              })
              .eq('id', contract.id);
            
            if (updateError) {
              console.error('[validate-token] Error updating contract HTML:', updateError);
            } else {
              // IMPORTANT: Update the contract object with the regenerated HTML
              // so it's included in the response
              contract.contract_html = contractHtml.contractHtml;
              contract.contract_template = contractHtml.templateName || 'Default Contract';
              console.log('[validate-token] Contract HTML regenerated and saved successfully');
            }
          } else {
            console.warn('[validate-token] Contract HTML generation returned no HTML');
          }
        } else {
          console.warn('[validate-token] Cannot regenerate HTML: no contact data available');
        }
      } catch (genError) {
        console.error('[validate-token] Error generating contract HTML:', genError);
        // Don't fail the request, just log the error
      }
    }
    
    // If contract_html is still missing after regeneration attempt, log a warning
    if (!contract.contract_html) {
      console.warn('[validate-token] Contract HTML is still missing after regeneration attempt');
    }

    // Handle both contact-based and standalone contracts
    let contactInfo;
    if (contract.contacts) {
      // Traditional contract with contact
      contactInfo = {
        first_name: contract.contacts.first_name,
        last_name: contract.contacts.last_name,
        email_address: contract.contacts.email_address
      };
    } else if (contract.recipient_name) {
      // Standalone contract with recipient info
      const nameParts = contract.recipient_name.split(' ');
      contactInfo = {
        first_name: nameParts[0] || contract.recipient_name,
        last_name: nameParts.slice(1).join(' ') || '',
        email_address: contract.recipient_email
      };
    } else {
      contactInfo = {
        first_name: 'Recipient',
        last_name: '',
        email_address: ''
      };
    }

    // Format response
    const response = {
      valid: true,
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        contract_html: contract.contract_html,
        contract_type: contract.contract_type,
        event_name: contract.event_name || contract.purpose,
        event_date: contract.event_date,
        total_amount: contract.total_amount,
        status: contract.status,
        signed_at: contract.signed_at || null,
        signed_by_client: contract.signed_by_client || null,
        signed_by_client_email: contract.signed_by_client_email || null,
        client_signature_data: contract.client_signature_data || null,
        is_personal: contract.is_personal,
        is_standalone: !contract.contact_id,
        sender_name: contract.sender_name,
        sender_email: contract.sender_email,
        contact: contactInfo
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error validating contract token:', error);
    res.status(500).json({ error: 'Failed to validate contract link' });
  }
}

