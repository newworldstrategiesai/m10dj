/**
 * Admin API: create gallery photo (upload image to Storage + insert row)
 * Platform admin only. Body: fileData (base64), fileName, alt, caption, sort_order
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = 'm10-gallery';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!isPlatformAdmin(session.user?.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { fileData, fileName, alt = '', caption = '', sort_order = 0 } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'Missing fileData or fileName' });
    }
    if (!fileData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid file format. Must be an image' });
    }

    const matches = fileData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }
    const imageType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }

    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${timestamp}-${sanitized}`;

    const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey);
    const { error: uploadError } = await supabaseStorage.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: `image/${imageType}`,
        upsert: false,
      });
    if (uploadError) {
      console.error('Gallery upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
    }

    const { data: { publicUrl } } = supabaseStorage.storage.from(BUCKET).getPublicUrl(storagePath);

    const { data: row, error: insertError } = await supabaseStorage
      .from('gallery_photos')
      .insert({
        src: publicUrl,
        alt: alt || fileName,
        caption: caption || '',
        sort_order: Number(sort_order) || 0,
        updated_at: new Date().toISOString(),
      })
      .select('id, src, alt, caption, sort_order, created_at')
      .single();

    if (insertError) {
      console.error('Gallery insert error:', insertError);
      return res.status(500).json({ error: insertError.message });
    }
    return res.status(201).json(row);
  } catch (err) {
    console.error('admin gallery-photos create error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
