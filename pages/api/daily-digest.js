// API endpoint for daily digest system
import { sendDailyDigest, testDailyDigest } from '../../utils/daily-digest.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, testMode, includePreviousDay } = req.body;

    // Basic security check - require API key for production
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (!testMode && apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let result;

    switch (action) {
      case 'test':
        console.log('🧪 Running test digest...');
        result = await testDailyDigest();
        break;

      case 'send':
        console.log('📊 Sending daily digest...');
        result = await sendDailyDigest({ 
          includePreviousDay: includePreviousDay || false,
          testMode: testMode || false
        });
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use "test" or "send"' 
        });
    }

    // Return result
    res.status(200).json({
      success: result.success,
      action,
      timestamp: new Date().toISOString(),
      data: {
        date: result.date,
        submissionCount: result.submissionCount,
        messagePreview: result.digestMessage?.substring(0, 100) + '...',
        smsDelivered: result.smsResult?.success || false,
        notificationHealth: result.notificationStats?.successRate
      },
      error: result.error || null
    });

  } catch (error) {
    console.error('Daily digest API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Export for Vercel cron jobs or external schedulers
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
