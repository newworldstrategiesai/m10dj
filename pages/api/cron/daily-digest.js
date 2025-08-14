// Vercel cron job endpoint for daily digest
import { sendDailyDigest } from '../../../utils/daily-digest.js';

export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('⏰ Daily digest cron job triggered at:', new Date().toISOString());
    
    // Send the daily digest
    const result = await sendDailyDigest({
      timezone: 'America/Chicago', // Memphis timezone
      testMode: false
    });

    console.log('📊 Daily digest cron result:', {
      success: result.success,
      date: result.date,
      submissionCount: result.submissionCount,
      smsDelivered: result.smsResult?.success
    });

    // Return success response for Vercel
    res.status(200).json({
      success: result.success,
      message: 'Daily digest sent successfully',
      timestamp: new Date().toISOString(),
      data: {
        date: result.date,
        submissionCount: result.submissionCount,
        smsDelivered: result.smsResult?.success || false,
        notificationHealth: result.notificationStats?.successRate || 100
      },
      error: result.error || null
    });

  } catch (error) {
    console.error('❌ Daily digest cron job failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Daily digest cron job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
