#!/bin/bash

# Test Webhook Verification
# This script tests the webhook endpoints with the correct tokens

echo "🧪 Testing Messenger Webhook..."
echo "================================"
MESSENGER_RESPONSE=$(curl -s "https://www.m10djcompany.com/api/messenger/webhook?hub.mode=subscribe&hub.verify_token=4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616&hub.challenge=MESSENGER_TEST_123")
echo "Response: $MESSENGER_RESPONSE"

if [ "$MESSENGER_RESPONSE" = "MESSENGER_TEST_123" ]; then
  echo "✅ Messenger webhook working!"
else
  echo "❌ Messenger webhook failed"
  echo "Expected: MESSENGER_TEST_123"
  echo "Got: $MESSENGER_RESPONSE"
fi

echo ""
echo "🧪 Testing Instagram Webhook..."
echo "================================"
INSTAGRAM_RESPONSE=$(curl -s "https://www.m10djcompany.com/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=f46e19ef1587bf5f6800224810eb48f354ad225958941197a4d186d2c4444202&hub.challenge=INSTAGRAM_TEST_456")
echo "Response: $INSTAGRAM_RESPONSE"

if [ "$INSTAGRAM_RESPONSE" = "INSTAGRAM_TEST_456" ]; then
  echo "✅ Instagram webhook working!"
else
  echo "❌ Instagram webhook failed"
  echo "Expected: INSTAGRAM_TEST_456"
  echo "Got: $INSTAGRAM_RESPONSE"
fi

echo ""
echo "📋 Summary"
echo "=========="
if [ "$MESSENGER_RESPONSE" = "MESSENGER_TEST_123" ] && [ "$INSTAGRAM_RESPONSE" = "INSTAGRAM_TEST_456" ]; then
  echo "✅ All webhooks working! Ready to configure in Meta."
else
  echo "⚠️  Check Vercel environment variables:"
  echo "   - MESSENGER_VERIFY_TOKEN"
  echo "   - INSTAGRAM_VERIFY_TOKEN"
fi

