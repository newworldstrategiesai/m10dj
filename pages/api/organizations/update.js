/**
 * Update Organization API
 * 
 * Updates organization settings (used during onboarding)
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getCurrentOrganization } from '@/utils/organization-context';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, slug, requests_header_artist_name, requests_header_location } = req.body;

    // Get current organization
    const organization = await getCurrentOrganization(supabase);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Verify user owns the organization
    if (organization.owner_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) {
      // Check if slug is available (if changed)
      if (slug !== organization.slug) {
        const { data: existingOrg } = await supabaseAdmin
          .from('organizations')
          .select('id, owner_id')
          .eq('slug', slug)
          .neq('id', organization.id)
          .maybeSingle();

        if (existingOrg) {
          return res.status(400).json({ 
            error: 'This URL is already taken. Please choose another.' 
          });
        }
      }
      updateData.slug = slug;
    }
    if (requests_header_artist_name !== undefined) {
      updateData.requests_header_artist_name = requests_header_artist_name;
    }
    if (requests_header_location !== undefined) {
      updateData.requests_header_location = requests_header_location;
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', organization.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return res.status(500).json({ error: 'Failed to update organization' });
    }

    // Also update user metadata with display name if provided
    if (requests_header_artist_name !== undefined && requests_header_artist_name) {
      try {
        const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              ...user.user_metadata,
              display_name: requests_header_artist_name,
              full_name: requests_header_artist_name
            }
          }
        );
        if (userUpdateError) {
          console.error('Error updating user metadata with display name:', userUpdateError);
          // Non-critical, continue anyway
        }
      } catch (error) {
        console.error('Error updating user metadata:', error);
        // Non-critical, continue anyway
      }
    }

    return res.status(200).json({ 
      organization: updatedOrg,
      message: 'Organization updated successfully' 
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

