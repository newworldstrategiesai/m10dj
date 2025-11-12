#!/bin/bash

# SMS + OpenAI Webhook Test Script
# Tests the SMS webhook with simulated Twilio requests

echo "🧪 SMS + OpenAI Webhook Test Suite"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="${1:-https://m10djcompany.com/api/sms/incoming-message}"
TWILIO_PHONE="${2:-+14105556789}"
CUSTOMER_PHONE="${3:-+19015551234}"

echo -e "${BLUE}Configuration:${NC}"
echo "  Webhook URL: $WEBHOOK_URL"
echo "  Twilio Phone: $TWILIO_PHONE"
echo "  Customer Phone: $CUSTOMER_PHONE"
echo ""

# Test 1: Basic message
echo -e "${YELLOW}Test 1: Basic message reception${NC}"
echo "Sending: 'Hi, what's your cheapest package?'"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=$CUSTOMER_PHONE&To=$TWILIO_PHONE&Body=Hi,%20what's%20your%20cheapest%20package?&MessageSid=SM$(date +%s)&NumMedia=0" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s \
  -o /tmp/response1.txt

cat /tmp/response1.txt
echo ""
echo "---"
echo ""

# Test 2: Different message
echo -e "${YELLOW}Test 2: Event inquiry${NC}"
echo "Sending: 'I need a DJ for my wedding June 15th'"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B19015552345&To=$TWILIO_PHONE&Body=I%20need%20a%20DJ%20for%20my%20wedding%20June%2015th&MessageSid=SM$(date +%s)&NumMedia=0" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s \
  -o /tmp/response2.txt

cat /tmp/response2.txt
echo ""
echo "---"
echo ""

# Test 3: Check environment variables
echo -e "${YELLOW}Test 3: Environment Variables Check${NC}"
echo ""

vercel env pull --yes 2>/dev/null

echo -e "${BLUE}Checking required variables:${NC}"

if grep -q "OPENAI_API_KEY" .env.local; then
  echo -e "${GREEN}✅ OPENAI_API_KEY is set${NC}"
else
  echo -e "${RED}❌ OPENAI_API_KEY is missing${NC}"
fi

if grep -q "TWILIO_ACCOUNT_SID" .env.local; then
  echo -e "${GREEN}✅ TWILIO_ACCOUNT_SID is set${NC}"
else
  echo -e "${RED}❌ TWILIO_ACCOUNT_SID is missing${NC}"
fi

if grep -q "TWILIO_AUTH_TOKEN" .env.local; then
  echo -e "${GREEN}✅ TWILIO_AUTH_TOKEN is set${NC}"
else
  echo -e "${RED}❌ TWILIO_AUTH_TOKEN is missing${NC}"
fi

if grep -q "TWILIO_PHONE_NUMBER" .env.local; then
  echo -e "${GREEN}✅ TWILIO_PHONE_NUMBER is set${NC}"
else
  echo -e "${RED}❌ TWILIO_PHONE_NUMBER is missing${NC}"
fi

if grep -q "ADMIN_PHONE_NUMBER" .env.local; then
  echo -e "${GREEN}✅ ADMIN_PHONE_NUMBER is set${NC}"
else
  echo -e "${RED}❌ ADMIN_PHONE_NUMBER is missing${NC}"
fi

echo ""
echo "---"
echo ""

# Test 4: Vercel logs
echo -e "${YELLOW}Test 4: Recent Vercel Logs${NC}"
echo ""
echo "Last 20 log entries:"
vercel logs --follow --since 10m 2>/dev/null | head -20

echo ""
echo "---"
echo ""

# Test 5: Database check
echo -e "${YELLOW}Test 5: Database Verification${NC}"
echo ""
echo "Run this in Supabase SQL Editor:"
echo ""
echo -e "${BLUE}Recent SMS Conversations:${NC}"
cat << 'EOF'
SELECT 
  phone_number,
  message_count,
  last_message_at,
  conversation_status
FROM sms_conversations
ORDER BY last_message_at DESC
LIMIT 5;
EOF

echo ""
echo -e "${BLUE}Pending AI Responses:${NC}"
cat << 'EOF'
SELECT 
  phone_number,
  execution_time,
  status,
  created_at
FROM pending_ai_responses
WHERE status IN ('pending', 'sent')
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""
echo "---"
echo ""

# Summary
echo -e "${BLUE}Test Summary:${NC}"
echo ""
echo "Next steps:"
echo "1. Check Vercel logs for errors"
echo "2. Run SQL queries in Supabase to verify data storage"
echo "3. Send actual SMS to your Twilio number"
echo "4. Verify you receive admin notification"
echo "5. Wait 60 seconds to see AI response"
echo ""
echo "✅ Tests complete!"

