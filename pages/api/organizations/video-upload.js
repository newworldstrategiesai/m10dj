import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Allow up to 100MB for video uploads
    },
  },
};

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

    const { fileData, fileName, fileType } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileData, fileName' 
      });
    }

    // Validate file format (should be base64 encoded video)
    if (!fileData.startsWith('data:video/')) {
      return res.status(400).json({ error: 'Invalid file format. Must be a video (MP4, WebM, etc.)' });
    }

    // Extract video data
    const matches = fileData.match(/^data:video\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 video data' });
    }

    const videoType = matches[1];
    const videoData = matches[2];
    const buffer = Buffer.from(videoData, 'base64');

    // Validate video size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageFilePath = `organizations/${organization.id}/videos/${timestamp}-${sanitizedFileName}`;
    
    const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey);

    // Check if videos bucket exists, if not the organization-assets bucket will be used
    const bucketName = 'organization-assets';

    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from(bucketName)
      .upload(storageFilePath, buffer, {
        contentType: `video/${videoType}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading video:', uploadError);
      return res.status(500).json({ 
        error: 'Failed to upload video', 
        details: uploadError.message 
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseStorage.storage
      .from(bucketName)
      .getPublicUrl(storageFilePath);

    res.status(200).json({ 
      url: publicUrl,
      path: storageFilePath
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

