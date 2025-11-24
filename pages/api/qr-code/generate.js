/**
 * QR Code Generation API
 * 
 * Generates QR codes for URLs
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use external QR code service (free, no API key required)
    // Alternative: Could use a library like 'qrcode' if we want to generate server-side
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    return res.status(200).json({
      success: true,
      qrCodeUrl,
      url
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return res.status(500).json({ 
      error: 'Failed to generate QR code',
      details: error.message 
    });
  }
}

