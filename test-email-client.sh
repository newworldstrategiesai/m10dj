#!/bin/bash

# Test script for debugging email client issues
# Usage: ./test-email-client.sh

echo "📧 Email Client Debug Test"
echo "========================="
echo ""

# Get the base URL
if [ -z "$NEXT_PUBLIC_SITE_URL" ]; then
  BASE_URL="http://localhost:3000"
else
  BASE_URL="$NEXT_PUBLIC_SITE_URL"
fi

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Check if app is running
echo "1️⃣  Checking if app is running..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin/email-client" | grep -q "200\|401\|302"; then
  echo "✅ App is running"
else
  echo "❌ App is not responding"
  exit 1
fi
echo ""

# Test 2: Test accounts endpoint
echo "2️⃣  Testing /api/emails/accounts endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/emails/accounts")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Endpoint returned 200"
  echo "Response: $BODY" | head -n 50
elif [ "$HTTP_CODE" = "401" ]; then
  echo "⚠️  Unauthorized (401) - Check authentication"
  echo "Response: $BODY"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ Server Error (500)"
  echo "Response: $BODY"
else
  echo "⚠️  Unexpected status code: $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Test emails endpoint
echo "3️⃣  Testing /api/emails endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/emails?folder=unified&limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Endpoint returned 200"
  echo "Response: $BODY" | head -n 50
elif [ "$HTTP_CODE" = "401" ]; then
  echo "⚠️  Unauthorized (401) - Check authentication"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ Server Error (500)"
  echo "Response: $BODY"
else
  echo "⚠️  Unexpected status code: $HTTP_CODE"
fi
echo ""

echo "📋 Summary"
echo "=========="
echo "If you see 401 errors: Check that you're logged in as an admin user"
echo "If you see 500 errors: Check server logs and Supabase RLS policies"
echo "If you see timeouts: API is not responding, check service status"
echo ""
echo "For more details, see: EMAIL_CLIENT_INFINITE_LOADING_FIX.md"

