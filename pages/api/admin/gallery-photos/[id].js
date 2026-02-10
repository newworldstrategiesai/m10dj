/**
 * Admin API: update or delete a gallery photo
 * Platform admin only.
 * PATCH: body { alt?, caption?, sort_order?, fileData?, fileName? } — optional new image
 * DELETE: deletes row and removes file from Storage
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = 'm10-gallery';
const MAX_SIZE = 5 * 1024 * 1024;

function storagePathFromPublicUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const path = u.pathname;
    const prefix = '/storage/v1/object/public/m10-gallery/';
    if (path.startsWith(prefix)) {
      return path.slice(prefix.length);
    }
  } catch (_) {}
  return null;
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'PATCH') {
      const { alt, caption, sort_order, fileData, fileName } = req.body || {};
      const updates = { updated_at: new Date().toISOString() };
      if (alt !== undefined) updates.alt = alt;
      if (caption !== undefined) updates.caption = caption;
      if (sort_order !== undefined) updates.sort_order = Number(sort_order) ?? 0;

      let newSrc = null;
      if (fileData && fileName && fileData.startsWith('data:image/')) {
        const matches = fileData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          if (buffer.length <= MAX_SIZE) {
            const storagePath = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { error: uploadError } = await supabaseAdmin.storage
              .from(BUCKET)
              .upload(storagePath, buffer, {
                contentType: `image/${matches[1]}`,
                upsert: false,
              });
            if (!uploadError) {
              const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
              newSrc = publicUrl;
            }
          }
        }
      }
      if (newSrc) updates.src = newSrc;

      const { data: row, error } = await supabaseAdmin
        .from('gallery_photos')
        .update(updates)
        .eq('id', id)
        .select('id, src, alt, caption, sort_order, created_at, updated_at')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const { data: row, error: fetchError } = await supabaseAdmin
        .from('gallery_photos')
        .select('src')
        .eq('id', id)
        .single();
      if (fetchError || !row) {
        return res.status(404).json({ error: 'Not found' });
      }
      const path = storagePathFromPublicUrl(row.src);
      if (path) {
        await supabaseAdmin.storage.from(BUCKET).remove([path]);
      }
      const { error: deleteError } = await supabaseAdmin.from('gallery_photos').delete().eq('id', id);
      if (deleteError) return res.status(500).json({ error: deleteError.message });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin gallery-photos [id] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
