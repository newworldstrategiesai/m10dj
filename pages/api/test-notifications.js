// API endpoint for testing notification system health
import { testNotificationSystem } from '../../utils/notification-system.js';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check - only allow admin users
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔍 Running notification system health check...');
    const healthResults = await testNotificationSystem();

    const response = {
      timestamp: new Date().toISOString(),
      status: healthResults.summary.successfulMethods > 0 ? 'HEALTHY' : 'CRITICAL',
      results: {
        sms: {
          success: healthResults.sms.success,
          attempts: healthResults.sms.attempts,
          error: healthResults.sms.error,
          phoneUsed: healthResults.sms.phoneUsed
        },
        email: {
          success: healthResults.email.success,
          error: healthResults.email.error
        },
        database: {
          success: healthResults.database.success,
          error: healthResults.database.error
        }
      },
      summary: {
        totalAttempts: healthResults.summary.totalAttempts,
        successfulMethods: healthResults.summary.successfulMethods,
        overallHealth: healthResults.summary.successfulMethods > 0 ? 'HEALTHY' : 'CRITICAL'
      },
      recommendations: generateHealthRecommendations(healthResults)
    };

    // Log health check to database
    await logHealthCheck(response);

    res.status(200).json(response);

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      details: error.message,
      status: 'CRITICAL'
    });
  }
}

function generateHealthRecommendations(results) {
  const recommendations = [];

  if (!results.sms.success) {
    recommendations.push({
      type: 'SMS_FAILURE',
      priority: 'HIGH',
      message: 'SMS notifications are failing. Check Twilio configuration and admin phone numbers.',
      actions: [
        'Verify TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables',
        'Check ADMIN_PHONE_NUMBER format (should be +1XXXXXXXXXX)',
        'Verify Twilio account has sufficient balance',
        'Test Twilio credentials manually'
      ]
    });
  }

  if (!results.email.success) {
    recommendations.push({
      type: 'EMAIL_FAILURE',
      priority: 'HIGH',
      message: 'Email notifications are failing. Check Resend configuration.',
      actions: [
        'Verify RESEND_API_KEY environment variable',
        'Check admin email addresses',
        'Verify Resend account status'
      ]
    });
  }

  if (results.summary.successfulMethods === 0) {
    recommendations.push({
      type: 'TOTAL_FAILURE',
      priority: 'CRITICAL',
      message: 'ALL notification methods are failing! This is a critical issue that will cause missed leads.',
      actions: [
        'Immediately check all environment variables',
        'Verify third-party service accounts (Twilio, Resend)',
        'Consider manual monitoring until fixed',
        'Set up alternative notification channels'
      ]
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'HEALTHY',
      priority: 'INFO',
      message: 'All notification systems are functioning correctly.',
      actions: ['Continue regular monitoring']
    });
  }

  return recommendations;
}

async function logHealthCheck(results) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('notification_log')
      .insert([{
        contact_submission_id: null, // Health checks don't have submissions
        notification_type: 'health_check',
        sms_success: results.results.sms.success,
        sms_attempts: results.results.sms.attempts,
        sms_error: results.results.sms.error,
        email_success: results.results.email.success,
        email_error: results.results.email.error,
        total_attempts: results.summary.totalAttempts,
        successful_methods: results.summary.successfulMethods
      }]);

    if (error) {
      console.error('Failed to log health check:', error);
    }
  } catch (error) {
    console.error('Health check logging error:', error);
  }
}
