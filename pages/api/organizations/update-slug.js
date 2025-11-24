import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const { slug } = req.body;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug is required and must be a string' });
    }

    // Validate slug format (alphanumeric and hyphens only, 3-50 characters)
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ 
        error: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only' 
      });
    }

    // Check if slug is already taken by another organization
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id, owner_id')
      .eq('slug', slug)
      .single();

    if (existingOrg && existingOrg.owner_id !== user.id) {
      return res.status(409).json({ error: 'This slug is already taken' });
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !userOrg) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // If slug hasn't changed, return success
    if (userOrg.slug === slug) {
      return res.status(200).json({ 
        organization: { ...userOrg, slug },
        message: 'Slug unchanged' 
      });
    }

    // Update the slug
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ slug })
      .eq('id', userOrg.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization slug:', updateError);
      return res.status(500).json({ error: 'Failed to update slug' });
    }

    return res.status(200).json({ 
      organization: updatedOrg,
      message: 'Slug updated successfully' 
    });
  } catch (error) {
    console.error('Error in update-slug API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

