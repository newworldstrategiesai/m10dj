import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileData, fileName } = body as { fileData?: string; fileName?: string };

    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: fileData, fileName' },
        { status: 400 }
      );
    }

    if (!fileData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid file format. Must be an image (JPEG, PNG, WebP, or GIF)' },
        { status: 400 }
      );
    }

    const matches = fileData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid base64 image data' },
        { status: 400 }
      );
    }

    const imageType = matches[1].toLowerCase();
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    if (buffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image must be 2MB or smaller' },
        { status: 400 }
      );
    }

    const mimeType = `image/${imageType}`;
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Allowed formats: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const ext = imageType === 'jpeg' ? 'jpg' : imageType;
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
    const storagePath = `user-avatars/${user.id}/${timestamp}-${sanitized}.${ext}`;

    const supabaseStorage = createServiceClient(supabaseUrl, supabaseServiceKey);
    const { error: uploadError } = await supabaseStorage.storage
      .from('organization-assets')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabaseStorage.storage
      .from('organization-assets')
      .getPublicUrl(storagePath);

    return NextResponse.json({ url: publicUrl, path: storagePath });
  } catch (err) {
    console.error('Account avatar API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
