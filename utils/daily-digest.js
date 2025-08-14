// Daily digest system for contact form submissions
import { createClient } from '@supabase/supabase-js';
import { sendAdminSMS } from './sms-helper.js';

/**
 * Generate and send daily digest SMS
 * @param {Object} options - Configuration options
 * @returns {Object} Result of digest operation
 */
export async function sendDailyDigest(options = {}) {
  const {
    timezone = 'America/Chicago', // Memphis timezone
    includePreviousDay = false,
    testMode = false
  } = options;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calculate date range for today (or yesterday if specified)
    const now = new Date();
    const targetDate = includePreviousDay 
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : now;
    
    // Get start and end of day in Memphis timezone
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📊 Generating daily digest for ${targetDate.toDateString()}`);
    console.log(`📅 Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Fetch today's contact submissions
    const { data: todaySubmissions, error: todayError } = await supabase
      .from('contact_submissions')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (todayError) {
      throw new Error(`Failed to fetch today's submissions: ${todayError.message}`);
    }

    // Fetch notification success rate for today
    const { data: notificationLogs, error: notificationError } = await supabase
      .from('notification_log')
      .select('sms_success, email_success, successful_methods')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Calculate notification stats (don't fail if notification_log doesn't exist yet)
    let notificationStats = {
      total: 0,
      successful: 0,
      successRate: 100
    };

    if (!notificationError && notificationLogs) {
      notificationStats.total = notificationLogs.length;
      notificationStats.successful = notificationLogs.filter(log => log.successful_methods > 0).length;
      notificationStats.successRate = notificationStats.total > 0 
        ? Math.round((notificationStats.successful / notificationStats.total) * 100)
        : 100;
    }

    // Fetch yesterday's submissions for comparison
    const yesterdayStart = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000);

    const { data: yesterdaySubmissions } = await supabase
      .from('contact_submissions')
      .select('id')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    // Analyze submissions by event type
    const eventTypeBreakdown = todaySubmissions.reduce((acc, submission) => {
      const eventType = submission.event_type || 'Unknown';
      acc[eventType] = (acc[eventType] || 0) + 1;
      return acc;
    }, {});

    // Generate digest message
    const digestMessage = generateDigestMessage({
      date: targetDate,
      todayCount: todaySubmissions.length,
      yesterdayCount: yesterdaySubmissions?.length || 0,
      eventTypeBreakdown,
      notificationStats,
      recentSubmissions: todaySubmissions.slice(0, 3), // Last 3 submissions
      testMode
    });

    // Send SMS digest
    const smsResult = await sendAdminSMS(digestMessage);

    // Log digest attempt
    await logDigestAttempt(supabase, {
      date: targetDate,
      submissionCount: todaySubmissions.length,
      smsSuccess: smsResult.success,
      smsError: smsResult.error,
      notificationSuccessRate: notificationStats.successRate
    });

    return {
      success: smsResult.success,
      date: targetDate.toDateString(),
      submissionCount: todaySubmissions.length,
      digestMessage,
      smsResult,
      notificationStats
    };

  } catch (error) {
    console.error('❌ Daily digest failed:', error);
    
    // Send error notification
    try {
      const errorMessage = `🚨 Daily Digest Error\n\nFailed to generate daily digest for ${new Date().toDateString()}.\n\nError: ${error.message}\n\nPlease check the admin dashboard for manual review.`;
      await sendAdminSMS(errorMessage);
    } catch (smsError) {
      console.error('❌ Failed to send error notification:', smsError);
    }

    return {
      success: false,
      error: error.message,
      date: new Date().toDateString()
    };
  }
}

/**
 * Generate the digest message text
 */
function generateDigestMessage({
  date,
  todayCount,
  yesterdayCount,
  eventTypeBreakdown,
  notificationStats,
  recentSubmissions,
  testMode = false
}) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  let message = `📊 M10 DJ Daily Digest\n${testMode ? '[TEST MODE] ' : ''}${dayName}, ${dateString}\n\n`;

  // Main stats
  message += `📝 Contact Forms: ${todayCount}\n`;
  
  // Comparison with yesterday
  if (yesterdayCount !== undefined) {
    const change = todayCount - yesterdayCount;
    if (change > 0) {
      message += `📈 +${change} vs yesterday\n`;
    } else if (change < 0) {
      message += `📉 ${change} vs yesterday\n`;
    } else {
      message += `➖ Same as yesterday\n`;
    }
  }

  message += `\n`;

  // Event type breakdown (if there are submissions)
  if (todayCount > 0) {
    message += `🎯 Event Types:\n`;
    Object.entries(eventTypeBreakdown)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .forEach(([eventType, count]) => {
        const emoji = getEventTypeEmoji(eventType);
        message += `${emoji} ${eventType}: ${count}\n`;
      });
    message += `\n`;
  }

  // Notification system health
  if (notificationStats.total > 0) {
    const healthEmoji = notificationStats.successRate >= 95 ? '✅' : 
                       notificationStats.successRate >= 80 ? '⚠️' : '🚨';
    message += `${healthEmoji} Notifications: ${notificationStats.successRate}% success\n`;
    if (notificationStats.successRate < 95) {
      message += `⚠️ Check notification system!\n`;
    }
    message += `\n`;
  }

  // Recent submissions (if any)
  if (recentSubmissions.length > 0) {
    message += `📋 Recent Leads:\n`;
    recentSubmissions.forEach((submission, index) => {
      const time = new Date(submission.created_at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      message += `${index + 1}. ${submission.name} (${submission.event_type}) - ${time}\n`;
    });
    message += `\n`;
  }

  // Call to action
  if (todayCount === 0) {
    message += `💡 No leads today - consider checking marketing efforts or website analytics.`;
  } else if (todayCount >= 5) {
    message += `🔥 Great day for leads! Make sure to follow up promptly.`;
  } else {
    message += `📞 Follow up with today's leads to maximize conversion.`;
  }

  message += `\n\n📱 View details: m10djcompany.com/admin/dashboard`;

  return message;
}

/**
 * Get emoji for event type
 */
function getEventTypeEmoji(eventType) {
  const emojiMap = {
    'wedding': '💍',
    'Wedding': '💍',
    'corporate': '🏢',
    'Corporate Event': '🏢',
    'private_party': '🎉',
    'Private Party': '🎉',
    'school_dance': '🎓',
    'School Dance': '🎓',
    'holiday_party': '🎄',
    'Holiday Party': '🎄',
    'birthday': '🎂',
    'Birthday Party': '🎂'
  };
  
  return emojiMap[eventType] || '🎵';
}

/**
 * Log digest attempt to database
 */
async function logDigestAttempt(supabase, data) {
  try {
    const { error } = await supabase
      .from('notification_log')
      .insert([{
        contact_submission_id: null, // Digest logs don't relate to specific submissions
        notification_type: 'daily_digest',
        sms_success: data.smsSuccess,
        sms_error: data.smsError,
        email_success: null, // Digest is SMS only
        total_attempts: 1,
        successful_methods: data.smsSuccess ? 1 : 0,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.warn('⚠️ Failed to log digest attempt (this is not critical):', error.message);
    } else {
      console.log('✅ Daily digest attempt logged to database');
    }
  } catch (error) {
    console.warn('⚠️ Error logging digest attempt (this is not critical):', error.message);
  }
}

/**
 * Test the daily digest system
 */
export async function testDailyDigest() {
  console.log('🧪 Testing daily digest system...');
  
  const result = await sendDailyDigest({ 
    testMode: true,
    includePreviousDay: false 
  });
  
  console.log('🧪 Test digest result:', {
    success: result.success,
    submissionCount: result.submissionCount,
    messageLength: result.digestMessage?.length
  });
  
  return result;
}
