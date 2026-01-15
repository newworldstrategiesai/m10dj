# 🧠 Smart Email Template System - Implementation Guide
## Complete Setup & Usage Instructions

---

## ✅ What's Been Built

### **1. Database Schema** ✅
- **Migration**: `supabase/migrations/20250131000000_create_email_template_recommendation_system.sql`
- **Tables Created**:
  - Extended `email_templates` table with recommendation metadata
  - `email_template_rules` for complex recommendation logic
  - `email_template_history` for tracking recommendations/sends
  - Database function `get_recommended_templates()` for SQL-based recommendations

### **2. Recommendation Engine** ✅
- **File**: `lib/email/template-recommendation-engine.ts`
- **Features**:
  - Analyzes customer context (contact, contracts, invoices, payments, quotes)
  - Determines journey stage automatically
  - Scores templates based on relevance
  - Filters by cooldown periods and required fields
  - Returns top 10 ranked recommendations

### **3. API Endpoint** ✅
- **File**: `pages/api/templates/recommendations.js`
- **Endpoint**: `POST /api/templates/recommendations`
- **Features**: 
  - Admin authentication required
  - Returns recommended templates for contact
  - Tracks recommendations in history table

### **4. UI Component** ✅
- **File**: `components/admin/SmartEmailTemplateSelector.tsx`
- **Features**:
  - Displays recommended templates grouped by urgency
  - Filters by urgency level and category
  - Shows recommendation scores and reasons
  - One-click template selection
  - Preview and send functionality

### **5. Template Registry** ✅
- **File**: `scripts/seed-email-templates.ts`
- **Content**: All 64 templates with metadata, rules, and conditions
- **Status**: Ready to seed (templates need HTML files created)

### **6. Integration** ✅
- **File**: `pages/admin/contacts/[id].tsx`
- **Status**: Smart template selector integrated into contact detail page

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

```bash
# The migration file is ready
# Run it in Supabase SQL Editor or via migration tool

# File: supabase/migrations/20250131000000_create_email_template_recommendation_system.sql
```

### **Step 2: Seed Template Registry**

```bash
# Compile TypeScript seed script
npx tsc scripts/seed-email-templates.ts --module commonjs --target es2020

# Run seed script
node scripts/seed-email-templates.js

# Or use ts-node directly
npx ts-node scripts/seed-email-templates.ts
```

This will:
- Create template records in `email_templates` table
- Set up recommendation rules and metadata
- Note: HTML template files need to be created separately

### **Step 3: Create HTML Template Files**

For each template in the seed script, create the corresponding HTML file:

```bash
# Example: Create contract-signed-client.html
# Location: email-templates/contract-signed-client.html

# Use contract-invoice-ready.html as a template/reference
```

**Template Files Needed** (from seed script):
- `email-templates/quote-ready.html`
- `email-templates/abandoned-quote-reminder-1.html`
- `email-templates/contract-ready.html`
- `email-templates/contract-signed-client.html`
- ... (and 60 more)

**Quick Start**: Create the Phase 1 priority templates first (7 templates).

### **Step 4: Verify Integration**

1. Navigate to any contact detail page: `/admin/contacts/[id]`
2. Scroll to "Smart Email Recommendations" section
3. You should see:
   - Contract & Invoice Email Actions (if applicable)
   - Recommended Email Templates list
   - Templates grouped by urgency (Critical → High → Medium → Low)

### **Step 5: Test Recommendations**

1. **Test with different contact stages**:
   - New contact → Should recommend inquiry confirmation
   - Has quote → Should recommend quote reminders
   - Has unsigned contract → Should recommend contract reminders
   - Event tomorrow → Should show urgent event confirmation

2. **Test Filters**:
   - Filter by urgency (Critical/High/Medium/Low)
   - Filter by category (Payment/Contract/Event/etc.)

3. **Test Template Selection**:
   - Click "Use Template" on a recommendation
   - Preview template
   - Send test email

---

## 🎯 How It Works

### **1. Customer Context Analysis**

When you open a contact detail page:

1. **Data Fetching**: System fetches:
   - Contact details
   - Contracts
   - Invoices
   - Payments
   - Quote selections

2. **Context Analysis**: Engine calculates:
   - Current journey stage (New → Contacted → Qualified → ... → Completed)
   - Time-based metrics (days until event, days overdue, etc.)
   - State conditions (has unsigned contract, overdue invoice, etc.)

3. **Template Scoring**: Each template is scored:
   - Base score: 0.5
   - Journey stage match: +0.2
   - Time sensitivity: +0.3 (if event tomorrow)
   - Context conditions: +0.2-0.3
   - Priority boost: +0.1-0.15
   - Cooldown penalty: Score = 0 (if in cooldown)
   - Missing fields penalty: Score *= 0.5

4. **Ranking**: Templates sorted by:
   - Urgency level (Critical → High → Medium → Low)
   - Recommendation score (highest first)
   - Priority (highest first)

5. **Display**: Top 10 recommendations shown in UI

### **2. Recommendation Rules**

Templates are recommended when:

**Journey Stage Match**:
- Template's `journey_stage` array includes current stage
- Or template has no stage restriction (universal)

**Trigger Conditions**:
- Time-based: `days_until_event: 7`, `days_overdue: { min: 1, max: 7 }`
- State-based: `has_unsigned_contract: true`, `has_overdue_invoice: true`
- Data-based: `signed_contract: true`, `paid_payment: true`

**Required Fields**:
- Template won't show if required fields are missing
- Example: Contract template requires `contract_id`

**Cooldown Periods**:
- Template won't recommend if sent recently (within cooldown hours)
- Prevents spam and over-sending

### **3. Urgency Levels**

**Critical** 🔴:
- Event tomorrow
- Contract expiring in 1 day
- Invoice 30+ days overdue
- Payment missing day before event

**High** 🟠:
- Event this week
- Contract expiring in 7 days
- Invoice 1-2 weeks overdue
- Missing payment

**Medium** 🟡:
- Event in 2 weeks
- Contract expiring soon
- Payment reminder
- Pre-event confirmation

**Low** 🟢:
- General follow-ups
- Thank you messages
- Review reminders
- Non-urgent communications

---

## 📊 Template Scoring Examples

### **Example 1: Contract & Invoice Ready**

**Context**: Contact in "Booked" stage, has unsigned contract, has invoice

**Scoring**:
- Base score: 0.5
- Journey stage match ("Booked"): +0.2 = 0.7
- Has unsigned contract: +0.2 = 0.9
- High priority (9): +0.15 = 1.05 (capped at 1.0)
- **Final Score**: 1.0 (100% match)
- **Urgency**: High (time sensitive)

### **Example 2: Event Confirmation (1 Day Before)**

**Context**: Event tomorrow, contact in "Retainer Paid" stage

**Scoring**:
- Base score: 0.5
- Journey stage match ("Retainer Paid"): +0.2 = 0.7
- Event tomorrow (time sensitive): +0.3 = 1.0
- **Final Score**: 1.0 (100% match)
- **Urgency**: Critical

### **Example 3: Payment Reminder (7 Days Before)**

**Context**: Invoice due in 7 days, contact in "Booked" stage

**Scoring**:
- Base score: 0.5
- Journey stage match ("Booked"): +0.2 = 0.7
- Time-based trigger (7 days): +0.1 = 0.8
- Medium priority (6): +0.1 = 0.9
- **Final Score**: 0.9 (90% match)
- **Urgency**: Medium

---

## 🔧 Customization

### **Add Custom Recommendation Rule**

```sql
INSERT INTO email_template_rules (
  template_key,
  rule_name,
  rule_type,
  rule_condition,
  priority,
  is_active
) VALUES (
  'custom-template-key',
  'custom_rule_name',
  'custom',
  '{
    "days_until_event": {"min": 7, "max": 14},
    "has_custom_field": true
  }',
  8,
  true
);
```

### **Adjust Template Priority**

```sql
UPDATE email_templates
SET priority = 9
WHERE template_key = 'important-template-key';
```

### **Change Cooldown Period**

```sql
UPDATE email_templates
SET cooldown_hours = 48
WHERE template_key = 'frequent-template-key';
```

---

## 📈 Analytics & Tracking

### **View Template Recommendations History**

```sql
SELECT 
  contact_id,
  template_key,
  recommended_at,
  sent_at,
  opened_at,
  clicked_at,
  recommendation_score,
  status
FROM email_template_history
WHERE contact_id = 'contact-uuid'
ORDER BY recommended_at DESC;
```

### **Track Template Effectiveness**

```sql
SELECT 
  template_key,
  COUNT(*) as times_recommended,
  COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as times_sent,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as times_opened,
  AVG(recommendation_score) as avg_score
FROM email_template_history
WHERE recommended_at > NOW() - INTERVAL '30 days'
GROUP BY template_key
ORDER BY times_sent DESC;
```

### **Find Underperforming Templates**

```sql
SELECT 
  template_key,
  COUNT(*) as recommendations,
  COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sends,
  ROUND(
    COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as send_rate
FROM email_template_history
GROUP BY template_key
HAVING COUNT(*) > 5
ORDER BY send_rate ASC;
```

---

## 🎨 UI Features

### **Template Card Display**

Each recommendation card shows:
1. **Urgency Badge**: Color-coded (Red/Orange/Yellow/Green)
2. **Template Name**: Clear identification
3. **Subject Line**: What client will see
4. **Category Badge**: Payment/Contract/Event/etc.
5. **Time Sensitive Badge**: If timing is critical
6. **Recommendation Score**: Percentage match (visual)
7. **Recommendation Reason**: Why this template is recommended
8. **Context Summary**: "Stage: Booked • Event in 45 days"
9. **Last Sent Info**: When template was last sent (if applicable)
10. **Cooldown Status**: When can send again
11. **Missing Fields Warning**: If required data is missing
12. **Action Button**: "Use Template" or "Unavailable"

### **Filtering Options**

- **Urgency Filter**: All / Critical / High / Medium / Low
- **Category Filter**: All / Payment / Contract / Event / Post-Event / etc.

### **Special Sections**

- **Contract & Invoice Email**: Prominent section when both exist
  - Uses `ContractInvoiceEmailActions` component
  - Preview, Test, Send buttons

---

## 🐛 Troubleshooting

### **No Recommendations Showing**

**Check**:
1. Contact exists and has data
2. Templates are seeded in database
3. Templates have `is_active: true`
4. Templates have matching journey stages
5. Templates not in cooldown period

**Debug Query**:
```sql
-- Check if templates exist
SELECT template_key, name, journey_stage, is_active
FROM email_templates
WHERE is_active = true;

-- Check contact journey stage
SELECT 
  c.id,
  c.lead_status,
  COUNT(ct.id) as contract_count,
  COUNT(i.id) as invoice_count,
  COUNT(p.id) as payment_count
FROM contacts c
LEFT JOIN contracts ct ON ct.contact_id = c.id
LEFT JOIN invoices i ON i.contact_id = c.id
LEFT JOIN payments p ON p.contact_id = c.id
WHERE c.id = 'contact-uuid'
GROUP BY c.id;
```

### **Recommendations Not Accurate**

**Check**:
1. Journey stage calculation logic
2. Template scoring algorithm
3. Trigger conditions
4. Required fields

**Debug**: Add console logs to `template-recommendation-engine.ts`

### **Templates Not Sending**

**Check**:
1. Template HTML file exists
2. Required fields are present
3. Cooldown period expired
4. Email service configured (Resend API key)

---

## 🔮 Future Enhancements

### **Phase 2: Auto-Send Automation**
- Templates with `auto_send: true` automatically sent
- Integration with cron jobs
- Time-based triggers (event tomorrow, invoice due, etc.)

### **Phase 3: A/B Testing**
- Multiple template variants
- Track open/click rates
- Auto-select winning variant

### **Phase 4: Machine Learning**
- Learn from open/click rates
- Adjust recommendation scores dynamically
- Personalize based on customer behavior

### **Phase 5: Multi-Channel**
- SMS recommendations
- Phone call suggestions
- Multi-channel templates

---

## 📝 Next Steps

1. ✅ **Database Migration**: Run migration file
2. ✅ **Seed Templates**: Run seed script
3. ⏳ **Create HTML Templates**: Build all 64 template HTML files
4. ⏳ **Test Recommendations**: Test with various contact states
5. ⏳ **Add Auto-Send**: Implement automation for `auto_send: true` templates
6. ⏳ **Analytics Dashboard**: Build template effectiveness dashboard

---

## 📚 Related Files

- **Database Migration**: `supabase/migrations/20250131000000_create_email_template_recommendation_system.sql`
- **Recommendation Engine**: `lib/email/template-recommendation-engine.ts`
- **API Endpoint**: `pages/api/templates/recommendations.js`
- **UI Component**: `components/admin/SmartEmailTemplateSelector.tsx`
- **Template Registry**: `scripts/seed-email-templates.ts`
- **System Documentation**: `SMART_EMAIL_TEMPLATE_SYSTEM.md`
- **Template Plan**: `EMAIL_TEMPLATES_COMPREHENSIVE_PLAN.md`

---

**Last Updated**: January 30, 2025
**Version**: 1.0.0
