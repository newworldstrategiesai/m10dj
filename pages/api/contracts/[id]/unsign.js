import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
    
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    // Use service role for admin updates
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch contract to check current status
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, status, client_signature_data, vendor_signature_data, signed_by_vendor, signed_by_vendor_at')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only allow unsigning if customer hasn't signed yet
    if (contract.client_signature_data) {
      return res.status(400).json({ 
        error: 'Cannot unsign contract: Customer has already signed. Once the customer signs, the contract cannot be unsigned.' 
      });
    }

    // Only allow unsigning if vendor has signed
    if (!contract.vendor_signature_data && !contract.signed_by_vendor) {
      return res.status(400).json({ 
        error: 'Contract is not signed by vendor, nothing to unsign' 
      });
    }

    // Update contract to remove vendor signature
    const updateData = {
      signed_by_vendor: null,
      signed_by_vendor_at: null,
      vendor_signature_data: null,
      // Reset status to 'draft' if it was 'signed' (shouldn't be, but just in case)
      status: contract.status === 'signed' && !contract.client_signature_data ? 'draft' : contract.status,
      updated_at: new Date().toISOString()
    };

    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error unsigning contract:', updateError);
      return res.status(500).json({ error: 'Failed to unsign contract', details: updateError.message });
    }

    // Also need to remove the signature from the contract HTML
    if (updatedContract.contract_html) {
      try {
        // Remove vendor signature from HTML
        let updatedHtml = updatedContract.contract_html;
        
        // Remove the signature image if it exists in the owner signature area
        const ownerSignatureRegex = /<div id="owner-signature-area"[^>]*>[\s\S]*?<\/div>/g;
        updatedHtml = updatedHtml.replace(ownerSignatureRegex, (match) => {
          // Replace with empty signature area
          return '<div id="owner-signature-area" class="signature-line-area" data-signer-type="owner"></div>';
        });

        // Update the contract HTML
        await supabase
          .from('contracts')
          .update({ contract_html: updatedHtml })
          .eq('id', id);
      } catch (htmlError) {
        console.error('Error updating contract HTML:', htmlError);
        // Don't fail the request, just log the error
      }
    }

    console.log(`✅ Contract ${updatedContract.contract_number} unsigned by admin`);

    res.status(200).json({ 
      success: true,
      message: 'Contract unsigned successfully',
      contract: updatedContract 
    });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    console.error('Error in unsign handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
