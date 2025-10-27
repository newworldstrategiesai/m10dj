# 🚀 Complete Data Import Workflow

## Overview

This guide walks you through importing all your HoneyBook data and creating a complete, interconnected system of **Contacts → Projects → Invoices → Payments**.

---

## 📊 The Complete Data Structure

```
Contact (Lead/Client)
  ↓
Project (Event/Booking)
  ↓
Invoice (Bill)
  ↓
Payment (Transaction)
```

Each layer connects to create a complete business management system.

---

## ✅ Step-by-Step Import Process

### **STEP 1: Run Database Migrations**

First, ensure all database structures exist:

#### **A. Create Payments Table**
```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/20250127000001_create_payments_table.sql
```

#### **B. Create Invoices Table**
```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/20250127000002_create_invoices_table_fixed.sql
```

**What this creates:**
- ✅ `payments` table with all financial fields
- ✅ `invoices` table with line items and tracking
- ✅ SQL views: `monthly_revenue`, `outstanding_balances`, `invoice_summary`, etc.
- ✅ Auto-functions: `generate_invoice_number()`, balance calculations
- ✅ Triggers for auto-updates

---

### **STEP 2: Import HoneyBook Leads**

Import all your contacts from HoneyBook:

```bash
cd /Users/benmurray/m10dj
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/import-honeybook-leads.js
```

**What it imports:**
- ✅ 142 contacts with full details
- ✅ Names, emails, phones, addresses
- ✅ Event types, dates, venues
- ✅ Budget ranges, guest counts
- ✅ Special requests and notes
- ✅ Lead status and sources

**Expected output:**
```
✅ Import Complete!
✅ Created: 142
⏭️  Skipped: 0 (duplicates)
❌ Errors: 0
```

---

### **STEP 3: Import HoneyBook Payments**

Import all payment transactions:

```bash
node scripts/import-honeybook-payments.js
```

**What it imports:**
- ✅ 97 payment transactions
- ✅ Full amounts, fees, gratuity
- ✅ Payment methods and dates
- ✅ Payment plan tracking (1 of 2, 2 of 2)
- ✅ Links to contacts automatically

**Expected output:**
```
💰 FINANCIAL SUMMARY:
   Gross Revenue: $69,289.20
   Processing Fees: $2,311.37 (3.34%)
   Net Revenue: $66,977.83
```

---

### **STEP 4: Generate Projects from Payments**

Create event/project records for all contacts:

```bash
node scripts/generate-projects-from-payments.js
```

**What it creates:**
- ✅ ~97 project records (one per contact with payments)
- ✅ Smart project names: "John Smith - Wedding - Jan 27, 2025 - Peabody Hotel"
- ✅ Intelligent status: Confirmed, Pending, or Completed
- ✅ Estimated duration based on package price
- ✅ Inferred start times by event type
- ✅ Links to contacts, payments

**Expected output:**
```
✅ Created project for John Smith - confirmed - 2 payment(s)
✅ Created project for Sarah Jones - pending - 1 payment(s)
...
✅ Projects Created: 97
```

**Project Status Logic:**
- **Completed** - Event date in the past
- **Confirmed** - 80%+ paid or fully paid
- **Pending** - Partial payment or upcoming event

---

### **STEP 5: Generate Invoices from Payments**

Create detailed invoices with line items:

```bash
node scripts/generate-invoices-from-payments.js
```

**What it creates:**
- ✅ ~97 invoices (groups multi-payment plans)
- ✅ Intelligent line item breakdown
- ✅ Package matching (Basic, Standard, Premium)
- ✅ Tax calculations (8.75% TN rate)
- ✅ Gratuity tracking
- ✅ Links to contacts, projects, and payments

**Expected output:**
```
✅ Created invoice INV-202501-001 for John Smith - Paid - $2175.00
✅ Created invoice INV-202501-002 for Sarah Jones - Partial - $1500.00
...
✅ Invoices Created: 97
```

**Line Item Intelligence:**
- **$500-$950**: Single DJ service item
- **$950-$1,200**: DJ + Equipment (70/30)
- **$1,200-$2,000**: DJ + Lighting + Equipment (60/25/15)
- **$2,000+**: DJ + Lighting + Equipment + Setup (50/30/15/5)

---

## 🎯 Complete Data Relationships

After all imports, your data is fully interconnected:

```
Contact: John Smith
  ↓
Project: John Smith - Wedding - Jan 27, 2025 - Peabody Hotel
  ↓
Invoice: INV-202501-001 - Wedding DJ Services - John Smith
  ↓  ↓  ↓
Payment 1: $1,087.50 (1 of 2 / Retainer) - Paid
Payment 2: $1,087.50 (2 of 2) - Paid
```

---

## 📊 What You Get

### **Contacts (/admin/contacts)**
- 142 complete contact records
- Full contact information
- Lead status tracking
- Custom fields and notes

### **Projects (/admin/projects)**
- 97 event/booking records
- Project names and details
- Status tracking (Confirmed, Pending, Completed)
- Event dates, venues, guest counts
- Duration estimates

### **Invoices (on contact pages)**
- 97 professional invoices
- Detailed line items
- Tax calculations
- Payment tracking
- Status indicators

### **Payments (on contact pages)**
- 97 payment transactions
- Full financial details
- Fee tracking
- Payment method breakdown
- Net revenue calculations

### **Financial Dashboard (/admin/financial)**
- Monthly revenue trends
- Payment method stats
- Outstanding balances
- Top clients by revenue
- Complete financial overview

---

## 🔗 Data Linking Summary

All data is automatically linked:

### **Contact → Project**
```sql
-- Contact has project_id field
SELECT * FROM contacts WHERE id = 'contact-uuid';
-- Returns: { ..., project_id: 'project-uuid', ... }
```

### **Project → Invoice**
```sql
-- Invoice has project_id field
SELECT * FROM invoices WHERE project_id = 'project-uuid';
```

### **Invoice → Payments**
```sql
-- Payment has invoice_id field
SELECT * FROM payments WHERE invoice_id = 'invoice-uuid';
```

### **Complete Chain Query**
```sql
SELECT 
  c.first_name,
  c.last_name,
  e.event_name as project_name,
  i.invoice_number,
  COUNT(p.id) as payment_count,
  SUM(p.total_amount) as total_paid
FROM contacts c
JOIN events e ON e.submission_id = c.id
JOIN invoices i ON i.project_id = e.id
JOIN payments p ON p.invoice_id = i.id
WHERE c.id = 'contact-uuid'
GROUP BY c.id, e.id, i.id, c.first_name, c.last_name, e.event_name, i.invoice_number;
```

---

## 📈 Verification Queries

After importing, verify everything is linked correctly:

### **Check Contact → Project Links**
```sql
SELECT 
  c.first_name,
  c.last_name,
  c.email_address,
  e.event_name,
  e.status
FROM contacts c
LEFT JOIN events e ON e.client_email = c.email_address
WHERE c.email_address IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 20;
```

### **Check Project → Invoice Links**
```sql
SELECT 
  e.event_name,
  i.invoice_number,
  i.invoice_status,
  i.total_amount
FROM events e
LEFT JOIN invoices i ON i.project_id = e.id
ORDER BY e.event_date DESC
LIMIT 20;
```

### **Check Invoice → Payment Links**
```sql
SELECT 
  i.invoice_number,
  i.total_amount as invoice_total,
  COUNT(p.id) as payment_count,
  SUM(p.total_amount) as payments_total
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.total_amount
ORDER BY invoice_total DESC
LIMIT 20;
```

### **Find Unlinked Records**
```sql
-- Contacts without projects
SELECT COUNT(*) FROM contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM events e WHERE e.client_email = c.email_address
);

-- Projects without invoices
SELECT COUNT(*) FROM events e
WHERE NOT EXISTS (
  SELECT 1 FROM invoices i WHERE i.project_id = e.id
);

-- Invoices without payments
SELECT COUNT(*) FROM invoices i
WHERE NOT EXISTS (
  SELECT 1 FROM payments p WHERE p.invoice_id = i.id
);
```

---

## 🎨 UI Access Points

### **View Everything:**

1. **Contacts List** → `/admin/contacts`
   - See all 142 contacts
   - Search, filter, sort
   - Click to view details

2. **Contact Detail** → `/admin/contacts/[id]`
   - Full contact information
   - Projects section (shows linked events)
   - Invoices section (shows all invoices)
   - Payment history (shows all payments)

3. **Projects Dashboard** → `/admin/projects`
   - See all 97 projects
   - Filter by status, type, date
   - Summary stats
   - Click to view details

4. **Financial Dashboard** → `/admin/financial`
   - Monthly revenue trends
   - Outstanding balances
   - Payment method breakdown
   - Top clients

---

## 🔧 Maintenance & Updates

### **Re-running Scripts**

All scripts are **idempotent** (safe to run multiple times):

- **Leads Import**: Skips duplicates by email
- **Payments Import**: Skips duplicates by HoneyBook ID
- **Projects Generator**: Skips if project exists for email
- **Invoices Generator**: Skips if invoice exists with same number

### **Updating Existing Data**

To update data after changes:

```bash
# 1. Update a specific contact
# Use the admin UI at /admin/contacts/[id]

# 2. Regenerate projects (will skip existing)
node scripts/generate-projects-from-payments.js

# 3. Regenerate invoices (will skip existing)
node scripts/generate-invoices-from-payments.js
```

---

## 🎉 Complete System Summary

After following this workflow, you have:

### **📊 Database:**
- ✅ 142 Contacts
- ✅ 97 Projects
- ✅ 97 Invoices
- ✅ 97 Payments
- ✅ Complete linking between all entities

### **💰 Financial Tracking:**
- ✅ $69,289.20 total revenue tracked
- ✅ $66,977.83 net revenue (after fees)
- ✅ Complete payment history
- ✅ Outstanding balance tracking

### **🎯 Management Tools:**
- ✅ Projects dashboard with filtering
- ✅ Financial dashboard with analytics
- ✅ Contact management with full details
- ✅ Invoice tracking with status

### **🔗 Data Integrity:**
- ✅ Every payment linked to invoice
- ✅ Every invoice linked to project
- ✅ Every project linked to contact
- ✅ Complete business history

---

## 📞 Quick Command Reference

```bash
# Set environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Import contacts (142 records)
node scripts/import-honeybook-leads.js

# Import payments (97 records)
node scripts/import-honeybook-payments.js

# Generate projects (97 records)
node scripts/generate-projects-from-payments.js

# Generate invoices (97 records)
node scripts/generate-invoices-from-payments.js
```

---

## ✅ Success Checklist

- [ ] Database migrations run
- [ ] Contacts imported (142)
- [ ] Payments imported (97)
- [ ] Projects generated (97)
- [ ] Invoices generated (97)
- [ ] Verified contact → project links
- [ ] Verified project → invoice links
- [ ] Verified invoice → payment links
- [ ] Tested admin UI navigation
- [ ] Reviewed financial dashboard

---

## 🎊 You're Done!

Your complete HoneyBook business history is now in your admin system with:

✅ **Full data import** from HoneyBook  
✅ **Intelligent project generation** with smart defaults  
✅ **Professional invoices** with detailed line items  
✅ **Complete financial tracking** with analytics  
✅ **Beautiful admin UI** for management  
✅ **All data linked and interconnected**  

**Navigate to `/admin/projects` or `/admin/financial` to see your complete business management system!** 🚀

