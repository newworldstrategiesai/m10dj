import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
    
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Validate updates - only allow specific fields
    const allowedFields = [
      'event_name',
      'event_date',
      'event_type',
      'event_time',
      'end_time',
      'venue_name',
      'venue_address',
      'guest_count',
      'total_amount',
      'deposit_amount'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Use service role for admin updates
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if contract has signatures before updating
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('client_signature_data, vendor_signature_data')
      .eq('id', id)
      .single();

    const hasSignatures = existingContract?.client_signature_data || existingContract?.vendor_signature_data;
    
    // Fields that affect contract HTML generation
    const htmlAffectingFields = ['event_name', 'event_date', 'event_type', 'event_time', 'end_time', 'venue_name', 'venue_address', 'guest_count', 'total_amount', 'deposit_amount'];
    const updatedHtmlAffectingField = Object.keys(filteredUpdates).some(key => htmlAffectingFields.includes(key));
    
    // Prepare update object
    const updateData = {
      ...filteredUpdates,
      updated_at: new Date().toISOString()
    };
    
    // Note: We'll regenerate HTML after the update, so we don't need to clear it here

    // Update contract
    const { data, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      return res.status(500).json({ error: 'Failed to update contract', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // If we updated fields that affect HTML, regenerate it immediately
    // We'll preserve signatures during regeneration
    if (updatedHtmlAffectingField) {
      try {
        // Fetch invoice and contact for regeneration
        const { data: contractForRegen } = await supabase
          .from('contracts')
          .select(`
            id,
            invoice_id,
            contact_id,
            contract_number,
            event_name,
            event_type,
            event_date,
            event_time,
            end_time,
            venue_name,
            venue_address,
            guest_count,
            total_amount,
            deposit_amount,
            invoices:invoice_id(
              id,
              total_amount,
              deposit_amount,
              payment_plan,
              contact_id,
              project_id,
              contacts:contact_id(*),
              events:project_id(*)
            )
          `)
          .eq('id', id)
          .single();

        if (contractForRegen) {
          const invoice = contractForRegen.invoices;
          const contact = invoice?.contacts || null;
          const event = invoice?.events || null;

          if (contact) {
            // Import and call generateContractHtml
            const { generateContractHtml } = await import('@/utils/ensure-contract-exists-for-invoice');
            const result = await generateContractHtml(
              invoice || { total_amount: contractForRegen.total_amount || 0, line_items: [] },
              contact,
              event || (contractForRegen.event_date ? {
                event_name: contractForRegen.event_name,
                event_type: contractForRegen.event_type,
                event_date: contractForRegen.event_date,
                start_time: contractForRegen.event_time,
                end_time: contractForRegen.end_time,
                venue_name: contractForRegen.venue_name,
                venue_address: contractForRegen.venue_address,
                number_of_guests: contractForRegen.guest_count
              } : null),
              contractForRegen.contract_number || '',
              supabase,
              contractForRegen.id // Pass contractId to include participants
            );

            if (result && result.contractHtml) {
              // If signatures exist, preserve them in the regenerated HTML
              let finalHtml = result.contractHtml;
              
              if (hasSignatures) {
                // Preserve client signature
                if (existingContract.client_signature_data) {
                  const signatureImg = `<img src="${existingContract.client_signature_data}" alt="Client Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
                  const replacement = `<div id="client-signature-area" class="signature-line-area" data-signer-type="client" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
                  const regex = /<div id="client-signature-area"[^>]*>[\s\S]*?<\/div>/g;
                  finalHtml = finalHtml.replace(regex, replacement);
                }
                
                // Preserve vendor signature
                if (existingContract.vendor_signature_data) {
                  const signatureImg = `<img src="${existingContract.vendor_signature_data}" alt="Owner Signature" style="max-width: 100%; height: auto; max-height: 50px; display: block; margin-bottom: 5px;" />`;
                  const replacement = `<div id="owner-signature-area" class="signature-line-area" data-signer-type="owner" style="cursor: default;">${signatureImg}<div class="signature-line" style="border-bottom: 1px solid #000; height: 1px; margin: 0;"></div></div>`;
                  const regex = /<div id="owner-signature-area"[^>]*>[\s\S]*?<\/div>/g;
                  finalHtml = finalHtml.replace(regex, replacement);
                }
              }
              
              await supabase
                .from('contracts')
                .update({ contract_html: finalHtml })
                .eq('id', id);
              
              // Update the response data
              data.contract_html = finalHtml;
              console.log('[update-fields] Contract HTML regenerated successfully' + (hasSignatures ? ' (signatures preserved)' : ''));
            }
          }
        }
      } catch (regenError) {
        console.error('[update-fields] Error regenerating contract HTML:', regenError);
        // Don't fail the request, just log the error
      }
    }

    res.status(200).json({ contract: data });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    console.error('Error in update-fields handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
