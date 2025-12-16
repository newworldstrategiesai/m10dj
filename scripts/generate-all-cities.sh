#!/bin/bash

# Generate City Pages for All Major US Cities
# This script runs the TypeScript generator for all cities

echo "🚀 Starting city page generation for all major US cities..."
echo "⏱️  This will take approximately 1-2 hours for all cities"
echo "📊 Progress will be shown in real-time"
echo ""

# Run the batch generation script
npx tsx scripts/generate-city-page-content.ts --batch

echo ""
echo "✅ Batch generation complete!"
echo "📊 Check the summary above for success/failure counts"
echo "🌐 Visit /djdash/cities/[city-slug] to view generated pages"

