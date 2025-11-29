// API endpoint to parse email content and return extracted data for preview
import { parseEmailContent } from '@/utils/email-parser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailContent } = req.body;

    if (!emailContent || !emailContent.trim()) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    const extractedData = parseEmailContent(emailContent);

    return res.status(200).json({
      success: true,
      extractedData,
    });
  } catch (error) {
    console.error('Error parsing email content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse email content',
      details: error.message,
    });
  }
}
