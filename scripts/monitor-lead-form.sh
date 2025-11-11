#!/bin/bash

# Lead Form Health Monitor
# This script checks if the lead form infrastructure is healthy
# Run this periodically (e.g., via cron) to monitor form health

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
HEALTH_CHECK_URL="${SITE_URL}/api/health-check"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_TO="${ADMIN_EMAIL:-}"

echo "================================================"
echo "Lead Form Health Check"
echo "================================================"
echo "Checking: $HEALTH_CHECK_URL"
echo "Time: $(date)"
echo "------------------------------------------------"

# Check health endpoint
response=$(curl -s -w "\n%{http_code}" "$HEALTH_CHECK_URL")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    
    # Parse response
    status=$(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "System Status: $status"
    
    # Check individual components
    echo ""
    echo "Component Status:"
    echo "$body" | grep -o '"[^"]*":{"name"[^}]*}' | while read -r line; do
        component=$(echo "$line" | cut -d'"' -f2)
        status=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$status" = "healthy" ]; then
            echo -e "  ${GREEN}✅${NC} $component: $status"
        elif [ "$status" = "warning" ]; then
            echo -e "  ${YELLOW}⚠️${NC} $component: $status"
        else
            echo -e "  ${RED}❌${NC} $component: $status"
        fi
    done
    
    exit 0
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Response: $body"
    
    # Send alert if configured
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚨 Lead Form Health Check Failed\n\nStatus: $http_code\nTime: $(date)\nURL: $HEALTH_CHECK_URL\"}"
    fi
    
    exit 1
fi

