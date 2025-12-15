// Test endpoint to verify Stripe webhook configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks = {
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabaseConfigured: !!(supabaseUrl && supabaseServiceKey),
    timestamp: new Date().toISOString(),
  };

  // Test Stripe connection
  if (checks.stripeConfigured) {
    try {
      const account = await stripe.accounts.retrieve();
      checks.stripeConnection = {
        success: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      };
    } catch (error) {
      checks.stripeConnection = {
        success: false,
        error: error.message,
      };
    }
  }

  // Test Supabase connection
  if (checks.supabaseConfigured) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('crowd_requests')
        .select('id')
        .limit(1);
      
      checks.supabaseConnection = {
        success: !error,
        error: error?.message,
      };
    } catch (error) {
      checks.supabaseConnection = {
        success: false,
        error: error.message,
      };
    }
  }

  // Check recent webhook events from Stripe (last 24 hours)
  if (checks.stripeConfigured && checks.stripeConnection?.success) {
    try {
      const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      const events = await stripe.events.list({
        limit: 10,
        created: { gte: oneDayAgo },
      });

      checks.recentWebhookEvents = {
        count: events.data.length,
        events: events.data.map((event) => ({
          id: event.id,
          type: event.type,
          created: new Date(event.created * 1000).toISOString(),
          livemode: event.livemode,
        })),
      };
    } catch (error) {
      checks.recentWebhookEvents = {
        error: error.message,
      };
    }
  }

  // Check webhook endpoints in Stripe
  if (checks.stripeConfigured && checks.stripeConnection?.success) {
    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
      checks.webhookEndpoints = {
        count: endpoints.data.length,
        endpoints: endpoints.data.map((endpoint) => ({
          id: endpoint.id,
          url: endpoint.url,
          status: endpoint.status,
          enabled_events: endpoint.enabled_events,
          api_version: endpoint.api_version,
        })),
      };
    } catch (error) {
      checks.webhookEndpoints = {
        error: error.message,
      };
    }
  }

  const allChecksPass = 
    checks.stripeConfigured &&
    checks.webhookSecretConfigured &&
    checks.supabaseConfigured &&
    checks.stripeConnection?.success &&
    checks.supabaseConnection?.success;

  return res.status(200).json({
    status: allChecksPass ? 'healthy' : 'issues_detected',
    checks,
    recommendations: getRecommendations(checks),
  });
}

function getRecommendations(checks) {
  const recommendations = [];

  if (!checks.stripeConfigured) {
    recommendations.push({
      priority: 'high',
      issue: 'STRIPE_SECRET_KEY not configured',
      fix: 'Set STRIPE_SECRET_KEY environment variable',
    });
  }

  if (!checks.webhookSecretConfigured) {
    recommendations.push({
      priority: 'high',
      issue: 'STRIPE_WEBHOOK_SECRET not configured',
      fix: 'Set STRIPE_WEBHOOK_SECRET environment variable. Get it from Stripe Dashboard > Developers > Webhooks',
    });
  }

  if (!checks.supabaseConfigured) {
    recommendations.push({
      priority: 'high',
      issue: 'Supabase credentials not configured',
      fix: 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables',
    });
  }

  if (checks.stripeConnection && !checks.stripeConnection.success) {
    recommendations.push({
      priority: 'high',
      issue: 'Stripe connection failed',
      fix: `Check STRIPE_SECRET_KEY: ${checks.stripeConnection.error}`,
    });
  }

  if (checks.webhookEndpoints && checks.webhookEndpoints.count === 0) {
    recommendations.push({
      priority: 'high',
      issue: 'No webhook endpoints configured in Stripe',
      fix: 'Create a webhook endpoint in Stripe Dashboard > Developers > Webhooks pointing to your /api/webhooks/stripe endpoint',
    });
  }

  if (checks.webhookEndpoints && checks.webhookEndpoints.endpoints) {
    const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
    const hasCorrectEndpoint = checks.webhookEndpoints.endpoints.some(
      (endpoint) => endpoint.url.includes(productionUrl) || endpoint.url.includes('localhost')
    );

    if (!hasCorrectEndpoint) {
      recommendations.push({
        priority: 'medium',
        issue: 'Webhook endpoint URL may not match your deployment',
        fix: `Verify webhook endpoint URL in Stripe matches: ${productionUrl}/api/webhooks/stripe`,
      });
    }
  }

  if (checks.recentWebhookEvents && checks.recentWebhookEvents.count === 0) {
    recommendations.push({
      priority: 'low',
      issue: 'No recent webhook events in last 24 hours',
      fix: 'This is normal if no payments have been processed recently. Test by processing a test payment.',
    });
  }

  return recommendations;
}

