// Test script to verify Stripe webhook handling
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhook() {
  console.log('🧪 Testing Stripe Webhook Functionality\n');
  
  // Test 1: Check webhook endpoint configuration
  console.log('1️⃣ Checking webhook endpoint configuration...');
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe/test');
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log('✅ Webhook configuration is healthy');
      console.log(`   - Stripe connected: ${data.checks.stripeConnection?.success ? 'Yes' : 'No'}`);
      console.log(`   - Webhook secret configured: ${data.checks.webhookSecretConfigured ? 'Yes' : 'No'}`);
      console.log(`   - Supabase connected: ${data.checks.supabaseConnection?.success ? 'Yes' : 'No'}`);
      console.log(`   - Webhook endpoints: ${data.checks.webhookEndpoints?.count || 0}`);
    } else {
      console.log('⚠️ Webhook configuration has issues:');
      data.recommendations?.forEach(rec => {
        console.log(`   - ${rec.issue}: ${rec.fix}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error checking configuration: ${error.message}`);
  }
  
  console.log('\n2️⃣ Testing webhook event handling...');
  
  // Create a test payment intent with metadata
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      metadata: {
        request_id: 'test-request-' + Date.now(),
        request_type: 'song_request',
        test: 'true'
      },
      description: 'Test webhook payment'
    });
    
    console.log(`✅ Created test payment intent: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Metadata:`, paymentIntent.metadata);
    
    // Simulate payment success
    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: 'pm_card_visa'
    });
    
    console.log(`✅ Payment intent confirmed: ${confirmed.status}`);
    
    // Check webhook logs
    setTimeout(async () => {
      try {
        const logsResponse = await fetch('http://localhost:3000/api/webhooks/stripe/logs');
        const logsData = await logsResponse.json();
        console.log(`\n3️⃣ Recent webhook activity:`);
        console.log(`   - Total payments processed: ${logsData.stats?.totalPayments || 0}`);
        console.log(`   - Recent activity: ${logsData.stats?.recentActivity?.length || 0} days`);
      } catch (error) {
        console.log(`   ⚠️ Could not fetch logs: ${error.message}`);
      }
    }, 2000);
    
  } catch (error) {
    console.log(`❌ Error creating test payment: ${error.message}`);
    if (error.type === 'StripeCardError') {
      console.log('   Note: This is expected in test mode. The webhook should still fire.');
    }
  }
  
  console.log('\n✅ Test complete! Check your server logs for webhook processing.');
  console.log('   Webhook events should appear in Stripe Dashboard > Developers > Events');
}

testWebhook().catch(console.error);

