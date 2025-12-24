#!/bin/bash
# Test script for bidding rounds cron endpoint

# Get CRON_SECRET from environment or prompt
if [ -z "$CRON_SECRET" ]; then
    echo "Enter your CRON_SECRET:"
    read CRON_SECRET
fi

# Test the endpoint
echo "🧪 Testing cron endpoint..."
echo ""

response=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://www.m10djcompany.com/api/cron/process-bidding-rounds)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

if [ "$http_code" = "200" ]; then
    echo ""
    echo "✅ Success! Cron endpoint is working"
else
    echo ""
    echo "❌ Error: HTTP $http_code"
    echo "Check that:"
    echo "  1. CRON_SECRET is set correctly in Vercel"
    echo "  2. The endpoint URL is correct"
    echo "  3. Vercel deployment is complete"
fi

