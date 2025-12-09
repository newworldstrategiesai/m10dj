/**
 * Test Email Configuration
 * Endpoint to diagnose email sending issues
 * Blocked in production for security
 */

import { Resend } from 'resend';

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Check 1: Resend API Key
  const apiKey = process.env.RESEND_API_KEY;
  diagnostics.checks.resendApiKey = {
    configured: !!apiKey,
    exists: !!apiKey,
    format: apiKey ? (apiKey.startsWith('re_') ? '✅ Valid format' : '❌ Invalid format (should start with re_)') : '❌ Not set',
    length: apiKey ? apiKey.length : 0
  };

  // Check 2: Can create Resend client?
  try {
    if (apiKey) {
      const resend = new Resend(apiKey);
      diagnostics.checks.resendClient = {
        status: '✅ Client created successfully',
        instance: !!resend
      };

      // Check 3: Try to verify the API key with a test call
      try {
        // This will fail gracefully if key is invalid
        const result = await resend.emails.send({
          from: 'M10 DJ Company <onboarding@resend.dev>',
          to: ['delivered@resend.dev'], // Resend's test email
          subject: 'Test Email - Configuration Check',
          html: '<p>This is a test email to verify Resend configuration.</p>'
        });

        if (result.error) {
          diagnostics.checks.resendApiTest = {
            status: '❌ API call failed',
            error: result.error,
            message: 'API key may be invalid or restricted'
          };
        } else {
          diagnostics.checks.resendApiTest = {
            status: '✅ API working correctly',
            emailId: result.data?.id,
            message: 'Successfully sent test email'
          };
        }
      } catch (testError) {
        diagnostics.checks.resendApiTest = {
          status: '❌ API call threw error',
          error: testError.message,
          message: 'Check API key validity'
        };
      }
    } else {
      diagnostics.checks.resendClient = {
        status: '❌ Cannot create client - API key not configured',
        instance: false
      };
      diagnostics.checks.resendApiTest = {
        status: '⏭️ Skipped - no API key'
      };
    }
  } catch (clientError) {
    diagnostics.checks.resendClient = {
      status: '❌ Failed to create client',
      error: clientError.message
    };
  }

  // Check 4: Supabase credentials
  diagnostics.checks.supabase = {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'
  };

  // Overall status
  const allChecks = Object.values(diagnostics.checks);
  const hasErrors = JSON.stringify(diagnostics).includes('❌');
  
  diagnostics.overallStatus = hasErrors ? '❌ Issues Found' : '✅ All Systems Operational';
  diagnostics.recommendation = hasErrors 
    ? 'Please check the issues above and add missing environment variables to .env.local'
    : 'Email configuration looks good! If emails still fail, check Resend dashboard for delivery issues.';

  return res.status(200).json(diagnostics);
}

