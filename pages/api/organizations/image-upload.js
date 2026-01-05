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
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const { fileData, fileName, fileType, storagePath = 'organization-assets' } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileData, fileName' 
      });
    }

    // Validate file format (should be base64 encoded)
    if (!fileData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid file format. Must be an image' });
    }

    // Extract image data
    const matches = fileData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const imageType = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Validate image size (max 5MB by default, can be customized)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageFilePath = `organizations/${organization.id}/images/${timestamp}-${sanitizedFileName}`;
    
    const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from('organization-assets')
      .upload(storageFilePath, buffer, {
        contentType: `image/${imageType}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return res.status(500).json({ 
        error: 'Failed to upload file', 
        details: uploadError.message 
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseStorage.storage
      .from('organization-assets')
      .getPublicUrl(storageFilePath);

    res.status(200).json({ 
      url: publicUrl,
      path: storageFilePath
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

