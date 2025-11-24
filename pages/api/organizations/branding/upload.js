/**
 * Upload Branding Assets API
 * 
 * Handles logo and favicon uploads for white-label branding
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = session.user;

    // Get user's organization
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, subscription_tier, white_label_enabled')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if white-label is enabled or if user has white_label/enterprise tier
    const hasWhiteLabelAccess = 
      organization.white_label_enabled || 
      organization.subscription_tier === 'white_label' || 
      organization.subscription_tier === 'enterprise';

    if (!hasWhiteLabelAccess) {
      return res.status(403).json({ 
        error: 'White-label branding is not available for your subscription tier',
        requiredTier: 'white_label or enterprise'
      });
    }

    const { fileType, fileData, fileName } = req.body;

    if (!fileType || !fileData || !fileName) {
      return res.status(400).json({ error: 'Missing required fields: fileType, fileData, fileName' });
    }

    // Validate file type
    const allowedTypes = ['logo', 'favicon'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid fileType. Must be "logo" or "favicon"' });
    }

    // Validate file format (should be base64 encoded)
    if (!fileData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid file format. Must be a base64-encoded image' });
    }

    // Extract image data
    const matches = fileData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const imageType = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Validate image size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }

    // Upload to Supabase Storage
    const storagePath = `organizations/${organization.id}/branding/${fileType}-${Date.now()}.${imageType}`;
    const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from('organization-assets')
      .upload(storagePath, buffer, {
        contentType: `image/${imageType}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseStorage.storage
      .from('organization-assets')
      .getPublicUrl(storagePath);

    // Update organization with new branding URL
    const updateField = fileType === 'logo' ? 'custom_logo_url' : 'custom_favicon_url';
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ [updateField]: publicUrl })
      .eq('id', organization.id);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return res.status(500).json({ error: 'Failed to update organization branding' });
    }

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileType,
      message: `${fileType} uploaded successfully`,
    });
  } catch (error) {
    console.error('Error in branding upload API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

