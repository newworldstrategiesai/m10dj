/**
 * Debug endpoint to check environment variables
 * DELETE THIS FILE after debugging!
 */

export default async function handler(req, res) {
  // Only allow in development or with special header
  if (process.env.NODE_ENV === 'production' && req.headers['x-debug-token'] !== 'debug-m10dj-2025') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const envCheck = {
    MESSENGER_VERIFY_TOKEN_EXISTS: !!process.env.MESSENGER_VERIFY_TOKEN,
    MESSENGER_VERIFY_TOKEN_LENGTH: process.env.MESSENGER_VERIFY_TOKEN?.length || 0,
    MESSENGER_VERIFY_TOKEN_PREVIEW: process.env.MESSENGER_VERIFY_TOKEN?.substring(0, 10) + '...',
    
    INSTAGRAM_VERIFY_TOKEN_EXISTS: !!process.env.INSTAGRAM_VERIFY_TOKEN,
    INSTAGRAM_VERIFY_TOKEN_LENGTH: process.env.INSTAGRAM_VERIFY_TOKEN?.length || 0,
    INSTAGRAM_VERIFY_TOKEN_PREVIEW: process.env.INSTAGRAM_VERIFY_TOKEN?.substring(0, 10) + '...',
    
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  res.status(200).json(envCheck);
}

