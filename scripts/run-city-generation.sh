#!/bin/bash

# City Page Generation Script Runner
# This script loads environment variables and runs the city page generator

set -e

echo "🚀 DJ Dash City Page Generator"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found"
  echo "   Please create .env.local with:"
  echo "   - OPENAI_API_KEY=your-key-here"
  echo "   - NEXT_PUBLIC_SUPABASE_URL=your-url"
  echo "   - SUPABASE_SERVICE_ROLE_KEY=your-key"
  exit 1
fi

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Check required variables
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY not set in .env.local"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Check if user wants to generate all cities or just one
if [ "$1" == "--batch" ] || [ "$1" == "" ]; then
  echo "📋 Generating city pages for ALL major US cities..."
  echo "⏱️  Estimated time: ~4-5 hours"
  echo "💰 Estimated cost: ~$5-10 in OpenAI API usage"
  echo ""
  read -p "Continue? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
  
  npx tsx scripts/generate-city-page-content.ts --batch
else
  echo "📋 Generating city page for: $1"
  npx tsx scripts/generate-city-page-content.ts "$1"
fi

