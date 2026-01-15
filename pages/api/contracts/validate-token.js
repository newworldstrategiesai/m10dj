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
    // First, try to find contract by signing token
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
        event_time,
        end_time,
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
        signed_by_vendor,
        signed_by_vendor_at,
        vendor_signature_data,
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

    // If contract not found, check if it's a participant token
    if (error || !contract) {
      console.log('[validate-token] Contract not found, checking for participant token...');
      
      const { data: participant, error: participantError } = await supabase
        .from('contract_participants')
        .select(`
          *,
          contracts (
            id,
            contract_number,
            contract_html,
            contract_type,
            event_name,
            event_type,
            event_date,
            event_time,
            end_time,
            venue_name,
            venue_address,
            guest_count,
            total_amount,
            status,
            signed_at,
            signed_by_client,
            client_signature_data,
            signed_by_vendor,
            vendor_signature_data,
            contacts (
              first_name,
              last_name,
              email_address
            )
          )
        `)
        .eq('signing_token', token)
        .single();

      if (participantError || !participant) {
        console.error('[validate-token] Participant not found:', participantError);
        return res.status(404).json({ error: 'Invalid or expired contract link' });
      }

      // Check if participant token has expired
      if (participant.signing_token_expires_at && new Date(participant.signing_token_expires_at) < new Date()) {
        return res.status(400).json({ error: 'This contract link has expired' });
      }

      // Check if already signed
      if (participant.status === 'signed' && participant.signature_data) {
        return res.status(200).json({
          contract: participant.contracts,
          participant: participant,
          isParticipant: true,
          alreadySigned: true,
          message: 'This contract has already been signed by this participant'
        });
      }

      // Update viewed_at if not already set
      if (!participant.viewed_at) {
        await supabase
          .from('contract_participants')
          .update({
            viewed_at: new Date().toISOString(),
            status: participant.status === 'pending' ? 'viewed' : participant.status
          })
          .eq('id', participant.id);
      }

      // Return participant data
      return res.status(200).json({
        contract: participant.contracts,
        participant: participant,
        isParticipant: true,
        alreadySigned: false
      });
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
    
    // Check if times exist in contract data but are missing from HTML
    // This will trigger regeneration to include the times
    const hasTimesButMissingInHtml = (contract.event_time || contract.end_time) && 
      contract.contract_html && 
      contract.contract_html.includes('EVENT DETAILS') &&
      !contract.contract_html.includes('Start Time:') &&
      !contract.contract_html.includes('End Time:');

    // CRITICAL: Don't regenerate HTML if signatures exist - this would overwrite them!
    const hasSignatures = contract.client_signature_data || contract.vendor_signature_data;
    
    // Only regenerate if HTML is missing/problematic AND no signatures exist
    // If signatures exist, we must preserve the HTML even if it has minor issues
    if ((!contract.contract_html || hasUnprocessedVariables || hasOutdatedCancellationPolicy || missingDepositInfo || missingEventDetails || hasTimesButMissingInHtml) && !hasSignatures) {
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
              start_time: contract.event_time,
              end_time: contract.end_time,
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
            supabase,
            contract.id // Pass contractId to include participants
          );
          
          console.log('[validate-token] Generated HTML result:', {
            has_html: !!contractHtml?.contractHtml,
            html_length: contractHtml?.contractHtml?.length || 0,
            template_name: contractHtml?.templateName
          });
          
          if (contractHtml && contractHtml.contractHtml) {
            // CRITICAL: If signatures exist, preserve them by injecting them into the new HTML
            let finalHtml = contractHtml.contractHtml;
            
            if (contract.client_signature_data) {
              const signatureImg = `<img src="${contract.client_signature_data}" alt="Client Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
              const replacement = `<div id="client-signature-area" class="signature-line-area" data-signer-type="client" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
              
              const regex = /<div id="client-signature-area"[^>]*>[\s\S]*?<\/div>/g;
              finalHtml = finalHtml.replace(regex, replacement);
            }
            
            if (contract.vendor_signature_data) {
              const signatureImg = `<img src="${contract.vendor_signature_data}" alt="Owner Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
              const replacement = `<div id="owner-signature-area" class="signature-line-area" data-signer-type="owner" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
              
              const regex = /<div id="owner-signature-area"[^>]*>[\s\S]*?<\/div>/g;
              finalHtml = finalHtml.replace(regex, replacement);
            }
            
            // Update the contract with generated HTML (with signatures preserved)
            const { error: updateError } = await supabase
              .from('contracts')
              .update({ 
                contract_html: finalHtml,
                contract_template: contractHtml.templateName || 'Default Contract'
              })
              .eq('id', contract.id);
            
            if (updateError) {
              console.error('[validate-token] Error updating contract HTML:', updateError);
            } else {
              // IMPORTANT: Update the contract object with the regenerated HTML
              // so it's included in the response
              contract.contract_html = finalHtml;
              contract.contract_template = contractHtml.templateName || 'Default Contract';
              console.log('[validate-token] Contract HTML regenerated and saved successfully' + (contract.client_signature_data || contract.vendor_signature_data ? ' (signatures preserved)' : ''));
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

    // Inject participant signature areas into contract HTML if participants exist
    if (contract.contract_html) {
      try {
        const { data: participants, error: participantsError } = await supabase
          .from('contract_participants')
          .select('*')
          .eq('contract_id', contract.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (!participantsError && participants && participants.length > 0) {
          // Check if participants are already in HTML
          const hasParticipantsInHtml = participants.some(p => 
            contract.contract_html.includes(`participant-signature-${p.id}`)
          );

          if (!hasParticipantsInHtml) {
            // Find the owner signature area and insert participant signatures after it
            const ownerSignatureIndex = contract.contract_html.indexOf('id="owner-signature-area"');
            if (ownerSignatureIndex !== -1) {
              // Find the end of the owner signature box (look for closing </div> of signature-box)
              // Simple approach: find the next </div> after the signature-box div
              const ownerBoxStart = contract.contract_html.lastIndexOf('<div class="signature-box">', ownerSignatureIndex);
              if (ownerBoxStart !== -1) {
                // Find the matching closing </div> for the signature-box
                let depth = 0;
                let searchIndex = ownerBoxStart;
                let ownerBoxEnd = -1;
                
                while (searchIndex < contract.contract_html.length) {
                  const substr = contract.contract_html.substring(searchIndex);
                  if (substr.startsWith('<div')) {
                    depth++;
                  } else if (substr.startsWith('</div>')) {
                    depth--;
                    if (depth === 0) {
                      ownerBoxEnd = searchIndex + 6;
                      break;
                    }
                  }
                  searchIndex++;
                }

                if (ownerBoxEnd !== -1) {
                  const participantsHtml = participants.map(participant => {
                    const participantSignatureId = `participant-signature-${participant.id}`;
                    const signatureHtml = participant.signature_data
                      ? `<img src="${participant.signature_data}" alt="${participant.name} Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`
                      : '';
                    
                    return `
<div class="signature-box">
<h3>${participant.role || 'ADDITIONAL SIGNER'}${participant.title ? ` - ${participant.title}` : ''}</h3>
<div id="${participantSignatureId}" class="signature-line-area" data-signer-type="participant" data-participant-id="${participant.id}" style="cursor: ${participant.signature_data ? 'default' : 'pointer'}; position: relative;">
  ${signatureHtml}
  <div class="signature-line" style="border-bottom: 1px solid #000; height: ${participant.signature_data ? '1px' : '50px'}; margin: 20px 0; position: relative;">
    ${!participant.signature_data ? '<span class="signature-placeholder-text" style="position: absolute; bottom: 5px; left: 0; color: #999; font-style: italic; font-size: 10pt;">Click to sign</span>' : ''}
  </div>
</div>
<p>Name: <span id="participant-signature-name-${participant.id}">${participant.signed_by || participant.name}</span></p>
<p>Date: ${participant.signed_at ? new Date(participant.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>`;
                  }).join('\n');

                  contract.contract_html = contract.contract_html.slice(0, ownerBoxEnd) + participantsHtml + contract.contract_html.slice(ownerBoxEnd);
                }
              }
            }
          }
        }
      } catch (participantError) {
        console.warn('[validate-token] Error injecting participant signatures:', participantError);
        // Continue without participants if there's an error
      }
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

    // Check if payment is needed (if contract is signed and has invoice)
    let paymentToken = null;
    let needsPayment = false;
    if (contract.status === 'signed' && contract.invoice_id) {
      try {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('payment_token, invoice_status, status, balance_due, amount_paid, total_amount')
          .eq('id', contract.invoice_id)
          .single();
        
        if (invoice) {
          // Check if invoice is unpaid
          const isPaid = invoice.invoice_status === 'paid' || invoice.status === 'paid' || 
                        (invoice.balance_due !== null && invoice.balance_due <= 0) ||
                        (invoice.amount_paid !== null && invoice.total_amount !== null && 
                         invoice.amount_paid >= invoice.total_amount);
          
          if (!isPaid && invoice.payment_token) {
            paymentToken = invoice.payment_token;
            needsPayment = true;
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        // Don't fail the request if payment check fails
      }
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
        event_type: contract.event_type || null,
        event_time: contract.event_time || null,
        end_time: contract.end_time || null,
        venue_name: contract.venue_name || null,
        venue_address: contract.venue_address || null,
        guest_count: contract.guest_count || null,
        total_amount: contract.total_amount,
        deposit_amount: contract.deposit_amount || null,
        status: contract.status,
        signed_at: contract.signed_at || null,
        signed_by_client: contract.signed_by_client || null,
        signed_by_client_email: contract.signed_by_client_email || null,
        client_signature_data: contract.client_signature_data || null,
        signed_by_vendor: contract.signed_by_vendor || null,
        signed_by_vendor_at: contract.signed_by_vendor_at || null,
        vendor_signature_data: contract.vendor_signature_data || null,
        is_personal: contract.is_personal,
        is_standalone: !contract.contact_id,
        sender_name: contract.sender_name,
        sender_email: contract.sender_email,
        invoice_id: contract.invoice_id || null,
        contact: contactInfo
      },
      needs_payment: needsPayment,
      payment_token: paymentToken
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error validating contract token:', error);
    res.status(500).json({ error: 'Failed to validate contract link' });
  }
}

