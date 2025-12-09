// API endpoint to handle audio file uploads for crowd requests
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse multipart form data
    const formData = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        // Simple multipart parsing - in production, use a library like 'formidable' or 'multer'
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) {
          reject(new Error('No boundary found'));
          return;
        }
        
        const parts = buffer.toString('binary').split(`--${boundary}`);
        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="audio"')) {
            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd === -1) continue;
            
            const fileData = part.substring(headerEnd + 4);
            const fileEnd = fileData.indexOf(`\r\n--${boundary}`);
            const actualFileData = fileEnd !== -1 ? fileData.substring(0, fileEnd) : fileData;
            
            // Extract filename
            const filenameMatch = part.match(/filename="([^"]+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `audio-${Date.now()}.mp3`;
            
            resolve({
              file: Buffer.from(actualFileData, 'binary'),
              filename: filename
            });
            return;
          }
        }
        reject(new Error('No audio file found'));
      });
      req.on('error', reject);
    });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = formData.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `crowd-requests/audio/${timestamp}-${sanitizedFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crowd-requests')
      .upload(filePath, formData.file, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('crowd-requests')
      .getPublicUrl(filePath);

    res.status(200).json({ 
      url: urlData.publicUrl,
      path: filePath
    });

  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload audio file',
      details: error.message 
    });
  }
}

