#!/bin/bash

echo "============================================"
echo "🧪 FEATURE TEST SUITE"
echo "============================================"
echo ""
echo "Testing M10 DJ Company New Features"
echo "Timestamp: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# ============================================
# TEST 1: TypeScript Compilation
# ============================================
echo -e "${YELLOW}📋 Test 1: TypeScript Compilation${NC}"
cd /Users/benmurray/m10dj

if npm run build 2>&1 | grep -q "✓ Compiled successfully"; then
  echo -e "${GREEN}✅ PASSED: TypeScript compilation successful${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED: TypeScript compilation failed${NC}"
  ((FAILED++))
fi

echo ""

# ============================================
# TEST 2: Dev Server Health
# ============================================
echo -e "${YELLOW}📋 Test 2: Dev Server Health Check${NC}"

if curl -s http://localhost:3000 | grep -q "<!DOCTYPE html>"; then
  echo -e "${GREEN}✅ PASSED: Dev server is running and responding${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED: Dev server not responding${NC}"
  ((FAILED++))
fi

echo ""

# ============================================
# TEST 3: API Endpoints
# ============================================
echo -e "${YELLOW}📋 Test 3: API Endpoints Accessibility${NC}"

# Test chat endpoint
echo "  Testing /api/leads/chat..."
if curl -s -X POST http://localhost:3000/api/leads/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"leadData":{}}' \
  2>&1 | grep -qE '"message"|error'; then
  echo -e "  ${GREEN}✅ Chat endpoint responds${NC}"
  ((PASSED++))
else
  echo -e "  ${RED}❌ Chat endpoint not responding${NC}"
  ((FAILED++))
fi

echo ""

# ============================================
# TEST 4: File Structure
# ============================================
echo -e "${YELLOW}📋 Test 4: New Feature Files Exist${NC}"

files=(
  "pages/api/leads/chat.ts"
  "pages/api/leads/sms.ts"
  "components/company/ContactFormChat.js"
  "utils/lead-assistant-prompt.js"
  "supabase/migrations/20250115000000_create_sms_conversations.sql"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✅${NC} $file"
    ((PASSED++))
  else
    echo -e "  ${RED}❌${NC} $file"
    ((FAILED++))
  fi
done

echo ""

# ============================================
# TEST 5: Documentation
# ============================================
echo -e "${YELLOW}📋 Test 5: Documentation Files${NC}"

docs=(
  "AI_ASSISTANT_ECOSYSTEM.md"
  "AI_LEAD_ASSISTANT_SETUP.md"
  "TWILIO_SMS_ASSISTANT_SETUP.md"
  "SECURITY_BEST_PRACTICES.md"
  "TEST_SETUP_INSTRUCTIONS.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "  ${GREEN}✅${NC} $doc"
    ((PASSED++))
  else
    echo -e "  ${RED}❌${NC} $doc"
    ((FAILED++))
  fi
done

echo ""

# ============================================
# TEST 6: Component Imports
# ============================================
echo -e "${YELLOW}📋 Test 6: Component File Validity${NC}"

if grep -q "export default function ContactFormChat" pages/api/../components/company/ContactFormChat.js; then
  echo -e "  ${GREEN}✅${NC} ContactFormChat component properly exported"
  ((PASSED++))
else
  echo -e "  ${RED}❌${NC} ContactFormChat component export issue"
  ((FAILED++))
fi

if grep -q "export const getLeadAssistantPrompt" utils/lead-assistant-prompt.js; then
  echo -e "  ${GREEN}✅${NC} Lead assistant prompt properly exported"
  ((PASSED++))
else
  echo -e "  ${RED}❌${NC} Lead assistant prompt export issue"
  ((FAILED++))
fi

echo ""

# ============================================
# TEST 7: Security
# ============================================
echo -e "${YELLOW}📋 Test 7: Security Checks${NC}"

# Check for exposed secrets
if grep -r "sk-proj-\|AKIA\|BEGIN PRIVATE KEY" --include="*.js" --include="*.ts" --include="*.md" \
  --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | grep -v "your_"; then
  echo -e "  ${RED}❌ Potential secrets found in files${NC}"
  ((FAILED++))
else
  echo -e "  ${GREEN}✅${NC} No exposed secrets in tracked files"
  ((PASSED++))
fi

# Check .gitignore
if grep -q "\.env.*local" .gitignore; then
  echo -e "  ${GREEN}✅${NC} .env.local properly in .gitignore"
  ((PASSED++))
else
  echo -e "  ${RED}❌${NC} .env.local not in .gitignore"
  ((FAILED++))
fi

echo ""

# ============================================
# TEST 8: Database Migration
# ============================================
echo -e "${YELLOW}📋 Test 8: SMS Conversation Migration${NC}"

if grep -q "CREATE TABLE.*sms_conversations" supabase/migrations/20250115000000_create_sms_conversations.sql; then
  echo -e "  ${GREEN}✅${NC} SMS conversations table definition found"
  ((PASSED++))
else
  echo -e "  ${RED}❌${NC} SMS conversations table definition missing"
  ((FAILED++))
fi

if grep -q "ADD COLUMN IF NOT EXISTS" supabase/migrations/20250115000000_create_sms_conversations.sql; then
  echo -e "  ${GREEN}✅${NC} Migration uses idempotent approach"
  ((PASSED++))
else
  echo -e "  ${RED}❌${NC} Migration not idempotent"
  ((FAILED++))
fi

echo ""

# ============================================
# TEST 9: Git Status
# ============================================
echo -e "${YELLOW}📋 Test 9: Git Repository Status${NC}"

if git status --short | grep -q "??"; then
  echo -e "  ${YELLOW}ℹ️${NC} Untracked files present"
else
  echo -e "  ${GREEN}✅${NC} No untracked files"
  ((PASSED++))
fi

if git log --oneline -1 | grep -q "Feature\|Fix\|Docs"; then
  echo -e "  ${GREEN}✅${NC} Recent commits present"
  ((PASSED++))
else
  echo -e "  ${RED}❌${NC} No recent commits"
  ((FAILED++))
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "============================================"
echo "📊 TEST SUMMARY"
echo "============================================"
echo -e "Total Tests:  $(($PASSED + $FAILED))"
echo -e "${GREEN}Passed:       $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed:       $FAILED${NC}"
else
  echo -e "Failed:       $FAILED"
fi

echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  exit 1
fi

