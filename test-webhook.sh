#!/bin/bash
# Script to test Stripe webhook with Stripe CLI

echo "🔧 Testing Stripe Webhook Setup"
echo "================================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install it with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI found: $(stripe --version)"
echo ""

# Check if logged in
echo "Checking Stripe CLI authentication..."
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged in to Stripe CLI"
    echo "Please run: stripe login"
    exit 1
fi

echo "✅ Stripe CLI authenticated"
echo ""

# Check if server is running
echo "Checking if dev server is running on port 3000..."
if ! lsof -ti:3000 &> /dev/null; then
    echo "⚠️  No server found on port 3000"
    echo "Please start your dev server with: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Start webhook listener in background
echo "Starting Stripe webhook listener..."
echo "Forwarding webhooks to: http://localhost:3000/api/webhooks/stripe"
echo ""

# Kill any existing stripe listen processes
pkill -f "stripe listen" 2>/dev/null

# Start new listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe &
LISTENER_PID=$!

# Wait for listener to start
sleep 3

echo "✅ Webhook listener started (PID: $LISTENER_PID)"
echo ""

# Test events
echo "📤 Triggering test events..."
echo ""

echo "1. Testing checkout.session.completed..."
stripe trigger checkout.session.completed

sleep 2

echo ""
echo "2. Testing payment_intent.succeeded..."
stripe trigger payment_intent.succeeded

sleep 2

echo ""
echo "3. Testing charge.succeeded..."
stripe trigger charge.succeeded

echo ""
echo "✅ Test events sent!"
echo ""
echo "Check your server logs and Stripe CLI output above to verify webhook processing."
echo ""
echo "To stop the webhook listener, run: kill $LISTENER_PID"
echo "Or press Ctrl+C and run: pkill -f 'stripe listen'"
