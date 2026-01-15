# 🧠 Smart Email Template Recommendation System
## Intelligent Template Suggestions Based on Customer Journey

---

## 🎯 Overview

The Smart Email Template System automatically analyzes each customer's journey state and recommends the most relevant email templates at the right time. Instead of manually searching through 64+ templates, admins see **context-aware recommendations** prioritized by urgency and relevance.

---

## 🏗️ Architecture

### **1. Database Schema**

#### `email_templates` Table (Extended)
- **Template Metadata**: Name, subject, category, journey stage
- **Recommendation Rules**: Priority, trigger conditions, cooldown periods
- **Required Fields**: What data must exist to use template
- **File Path**: Location of HTML template file

#### `email_template_rules` Table
- **Complex Rules**: Multi-condition recommendation logic
- **Rule Types**: Pipeline stage, contract status, invoice status, time-based

#### `email_template_history` Table
- **Tracking**: When templates were recommended/sent
- **Cooldown Management**: Prevents spam by tracking send frequency
- **Effectiveness**: Tracks opens, clicks, conversions

### **2. Recommendation Engine**

**File**: `lib/email/template-recommendation-engine.ts`

**How It Works**:
1. **Analyze Customer Context**
   - Fetches all related data (contact, contracts, invoices, payments, quotes)
   - Calculates time-based metrics (days until event, days overdue, etc.)
   - Determines journey stage automatically

2. **Score Each Template**
   - **Journey Stage Match**: +0.2 if matches current stage
   - **Time Sensitivity**: +0.3 if event is tomorrow
   - **Context Conditions**: +0.2-0.3 for specific conditions (overdue, expiring, etc.)
   - **Priority Boost**: +0.15 for high-priority templates
   - **Cooldown Penalty**: Score = 0 if in cooldown period
   - **Missing Fields Penalty**: Score *= 0.5 if required fields missing

3. **Rank & Filter**
   - Sort by urgency → score → priority
   - Filter out templates below 0.3 score
   - Return top 10 recommendations

### **3. API Endpoint**

**File**: `pages/api/templates/recommendations.js`

**Request**:
```json
POST /api/templates/recommendations
{
  "contactId": "uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "recommendations": [
    {
      "template_key": "contract-invoice-ready",
      "template_name": "Contract & Invoice Ready",
      "subject": "Contract & Invoice Ready - Wedding",
      "category": "contract",
      "recommendation_score": 0.95,
      "recommendation_reason": "Matches your current stage: Booked • Has unsigned contract",
      "priority": 9,
      "time_sensitive": true,
      "urgency_level": "high",
      "context_summary": "Stage: Booked • Event in 45 days",
      "can_send_now": true,
      "required_fields": ["contract_id", "invoice_id"],
      "missing_fields": []
    }
  ],
  "count": 8
}
```

### **4. UI Component**

**File**: `components/admin/SmartEmailTemplateSelector.tsx`

**Features**:
- **Smart Recommendations**: Shows top 10 templates based on context
- **Urgency Grouping**: Critical → High → Medium → Low
- **Filters**: By urgency level and category
- **Template Cards**: Show score, reason, context, cooldown status
- **One-Click Send**: Direct template selection and sending

---

## 📊 Recommendation Logic

### **Journey Stage Matching**

Templates are matched to customer journey stages:

| Stage | Typical State | Recommended Templates |
|-------|--------------|----------------------|
| **New** | Just submitted inquiry | Initial inquiry confirmation |
| **Contacted** | Admin has reached out | Quote ready, follow-up templates |
| **Qualified** | Budget/price discussed | Quote/proposal templates |
| **Proposal Sent** | Quote generated | Abandoned quote reminders, contract ready |
| **Negotiating** | Contract exists, unsigned | Contract reminders, expiration warnings |
| **Booked** | Contract signed | Payment reminders, pre-event confirmations |
| **Retainer Paid** | Deposit paid | Pre-event confirmations, final payment reminders |
| **Completed** | Event passed | Thank you, review requests |

### **Context-Based Scoring**

Templates get higher scores when:

1. **Time-Sensitive Conditions**
   - Event tomorrow: +0.3 score, `critical` urgency
   - Event this week: +0.2 score, `high` urgency
   - Contract expiring in 7 days: +0.25 score, `high` urgency
   - Invoice overdue: +0.3 score, `high` urgency

2. **State Conditions**
   - Has unsigned contract: +0.2 score
   - Has overdue invoice: +0.3 score
   - Missing payment: +0.2 score
   - Event passed: +0.2 score for post-event templates

3. **Priority Boost**
   - Priority ≥ 8: +0.15 score, `high` urgency
   - Priority ≥ 6: +0.1 score, `medium` urgency

### **Cooldown Management**

Prevents spam by tracking send history:

- **Cooldown Periods**: Templates define `cooldown_hours`
- **Automatic Blocking**: Templates in cooldown get score = 0
- **Visual Indicators**: UI shows "Unavailable" and cooldown expiry time
- **History Tracking**: All recommendations tracked in `email_template_history`

---

## 🎨 UI/UX Design

### **Template Card Display**

Each recommendation shows:

1. **Urgency Badge**: Critical/High/Medium/Low with color coding
2. **Template Name & Subject**: Clear identification
3. **Category Badge**: Payment/Contract/Event/etc.
4. **Recommendation Score**: Visual percentage (80% match = green)
5. **Context Summary**: "Stage: Booked • Event in 45 days"
6. **Recommendation Reason**: "Matches your current stage: Booked"
7. **Cooldown Status**: When last sent, when can send again
8. **Missing Fields Warning**: If required data is missing
9. **Time Sensitive Badge**: If timing is critical

### **Filtering & Sorting**

- **Urgency Filter**: Show only Critical/High/Medium/Low
- **Category Filter**: Filter by Payment/Contract/Event/etc.
- **Auto-Sort**: By urgency → score → priority

### **Special Actions**

- **Contract & Invoice Email**: Special prominent section when both exist
- **Quick Actions**: Preview, Test, Send buttons on cards
- **Template Preview**: Modal with rendered HTML preview

---

## 🚀 Usage

### **For Admins**

1. **Navigate to Contact Detail Page**
   - Go to `/admin/contacts/[id]`
   - Scroll to "Smart Email Recommendations" section

2. **View Recommendations**
   - System automatically analyzes contact state
   - Shows top 10 recommended templates
   - Grouped by urgency (Critical → High → Medium → Low)

3. **Filter & Select**
   - Use urgency/category filters
   - Click "Use Template" on desired template
   - Preview before sending
   - Send or test email

4. **Track History**
   - See when templates were last sent
   - Understand cooldown periods
   - View recommendation scores

### **For Developers**

#### **Adding New Template**

1. **Create HTML Template**
   ```bash
   # Create file: email-templates/my-new-template.html
   ```

2. **Add to Seed Script**
   ```typescript
   // In scripts/seed-email-templates.ts
   {
     template_key: 'my-new-template',
     name: 'My New Template',
     subject: 'Template Subject',
     category: 'payment',
     journey_stage: ['Booked', 'Retainer Paid'],
     priority: 7,
     recommended_when: 'When X happens',
     // ... other fields
   }
   ```

3. **Run Seed Script**
   ```bash
   npm run seed-templates
   ```

#### **Custom Recommendation Rules**

Create complex rules in database:

```sql
INSERT INTO email_template_rules (
  template_key,
  rule_name,
  rule_type,
  rule_condition,
  priority
) VALUES (
  'invoice-overdue',
  'overdue_30_days',
  'invoice_status',
  '{"status": "Overdue", "days_overdue": {"min": 30}}',
  10
);
```

---

## 📈 Template Registry

All 64 templates are registered with:

- **Template Key**: Unique identifier
- **Category**: payment, contract, event, post-event, etc.
- **Journey Stages**: Where template applies
- **Priority**: 1-10 (higher = more important)
- **Trigger Conditions**: When to recommend
- **Required Fields**: Data needed to send
- **Cooldown Hours**: Minimum time between sends
- **Auto-Send**: Whether to auto-send or manual

See `scripts/seed-email-templates.ts` for complete registry.

---

## 🔄 Integration Points

### **1. Customer Journey Detection**

Uses existing `determineStageFromData()` function from `PipelineView.tsx`:
- Analyzes contracts, invoices, payments, quotes
- Determines current stage automatically
- Updates as data changes

### **2. Template Rendering**

When template is selected:
1. Load HTML file from `email-templates/` directory
2. Replace variables with contact data
3. Render preview or send email

### **3. Email Sending**

Integrates with existing email system:
- Uses Resend API for sending
- Stores in `emails` table
- Tracks in `email_template_history`

### **4. Automation Queue**

Future integration with `automation_queue`:
- Templates with `auto_send: true` can be scheduled
- Triggered by events (contract signed, payment received, etc.)
- Respects cooldown periods automatically

---

## 🎯 Benefits

### **For Admins**
- ✅ **No Guessing**: Always know which template to send
- ✅ **Context Aware**: Recommendations based on actual customer state
- ✅ **Time Sensitive**: Urgent emails rise to top
- ✅ **Spam Prevention**: Cooldown periods prevent over-sending
- ✅ **Efficiency**: One-click template selection

### **For Customers**
- ✅ **Right Message, Right Time**: Receive relevant emails at appropriate times
- ✅ **Consistency**: Professional, branded communications
- ✅ **Completeness**: No missing steps in journey
- ✅ **Timeliness**: Urgent communications sent promptly

### **For Business**
- ✅ **Increased Engagement**: Better email relevance = higher open rates
- ✅ **Faster Bookings**: Prompt contract/payment reminders
- ✅ **Better Reviews**: Automated post-event follow-up
- ✅ **Reduced Manual Work**: Smart recommendations reduce admin time

---

## 🔮 Future Enhancements

### **Phase 2: Machine Learning**
- Track open rates, click rates per template
- Adjust recommendation scores based on effectiveness
- Learn which templates work best for each journey stage

### **Phase 3: A/B Testing**
- Test multiple variants of high-value templates
- Track which versions perform better
- Auto-select winning variant

### **Phase 4: Personalization**
- Analyze customer preferences
- Recommend templates based on past behavior
- Customize messaging based on event type

### **Phase 5: Automation**
- Auto-send templates with `auto_send: true`
- Schedule based on trigger conditions
- Integrate with cron jobs for time-based sends

---

## 📝 Next Steps

1. ✅ Database schema created
2. ✅ Recommendation engine built
3. ✅ API endpoint created
4. ✅ UI component created
5. ⏳ Seed all 64 templates (run `npm run seed-templates`)
6. ⏳ Integrate into contact detail page
7. ⏳ Create remaining HTML template files
8. ⏳ Test recommendation accuracy
9. ⏳ Add automation triggers

---

**Last Updated**: January 30, 2025
**Version**: 1.0.0
