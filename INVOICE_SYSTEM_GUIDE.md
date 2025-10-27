## 🧾 Invoice System - Complete Guide

### **System Overview**

Your M10 DJ Company now has a **comprehensive invoice management system** that:

✅ **Tracks all invoices** with full status management  
✅ **Links invoices to contacts, projects, and payments**  
✅ **Auto-calculates balances** and updates statuses  
✅ **Generates invoice numbers** automatically  
✅ **Shows overdue invoices** for follow-up  
✅ **Displays invoices on contact pages** with beautiful UI  
✅ **Fixed project fetching** for HoneyBook contacts  

---

## 📊 Database Structure

### **Invoices Table**

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  project_id UUID REFERENCES events(id),
  
  -- Identity
  invoice_number VARCHAR(100) UNIQUE NOT NULL, -- INV-202501-001
  invoice_status VARCHAR(50), -- Draft, Sent, Viewed, Paid, Partial, Overdue, Cancelled
  invoice_title VARCHAR(255),
  invoice_description TEXT,
  
  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_date TIMESTAMP,
  paid_date TIMESTAMP,
  
  -- Amounts
  subtotal NUMERIC(10,2),
  discount_amount NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) DEFAULT 0,
  
  -- Content
  line_items JSONB, -- [{ description, quantity, rate, amount }]
  payment_terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  reminder_sent_count INTEGER DEFAULT 0,
  
  -- Integration
  honeybook_invoice_id TEXT UNIQUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Key Features**

#### **1. Auto-Status Updates**
Invoices automatically update their status based on:
- **Paid** - When `amount_paid >= total_amount`
- **Partial** - When `amount_paid > 0` but less than total
- **Overdue** - When past `due_date` and not paid/cancelled
- **Viewed** - When client opens the invoice

#### **2. Auto-Calculate Balance**
```sql
balance_due = total_amount - amount_paid
```
Updated automatically on insert/update via trigger.

#### **3. Auto-Generate Invoice Numbers**
```sql
SELECT generate_invoice_number();
-- Returns: INV-202501-001, INV-202501-002, etc.
```
Format: `INV-YYYYMM-###` (increments monthly)

---

## 📈 SQL Views

### **1. Invoice Summary** (`invoice_summary`)
Complete overview with contact and payment info:

```sql
SELECT * FROM invoice_summary WHERE contact_id = 'uuid-here';
```

**Columns:**
- Invoice details (number, status, dates, amounts)
- Contact info (name, email, phone)
- Project link (if any)
- Payment count and last payment date
- Status color for UI
- Days overdue calculation

### **2. Overdue Invoices** (`overdue_invoices`)
All unpaid invoices past their due date:

```sql
SELECT * FROM overdue_invoices ORDER BY days_overdue DESC;
```

**Use for:**
- Follow-up reminders
- Collections priority list
- Dashboard alerts

### **3. Monthly Invoice Stats** (`monthly_invoice_stats`)
Aggregated stats by month:

```sql
SELECT * FROM monthly_invoice_stats ORDER BY month DESC LIMIT 12;
```

**Metrics:**
- Total invoices created
- Paid vs overdue count
- Total invoiced amount
- Total collected
- Outstanding balance
- Average invoice amount

---

## 🎨 UI Components

### **InvoiceList Component**
Location: `components/admin/InvoiceList.tsx`

**Features:**
- ✅ Summary cards (total invoiced, paid, balance, overdue count)
- ✅ Status indicators with icons
- ✅ Payment progress bars
- ✅ Project linking
- ✅ Days overdue warnings
- ✅ Click to view invoice details
- ✅ Create new invoice button

**Props:**
```typescript
interface InvoiceListProps {
  contactId: string;
  invoices: Invoice[];
  onViewInvoice?: (invoiceId: string) => void;
  onCreateInvoice?: () => void;
}
```

**Usage:**
```jsx
<InvoiceList
  contactId={contactId}
  invoices={invoices}
  onViewInvoice={(id) => router.push(`/admin/invoices/${id}`)}
  onCreateInvoice={() => router.push(`/admin/invoices/new?contactId=${contactId}`)}
/>
```

---

## 🔗 Integration with Payments

### **Linking Payments to Invoices**

The `payments` table now has an `invoice_id` column:

```sql
ALTER TABLE payments 
ADD COLUMN invoice_id UUID REFERENCES invoices(id);
```

**When a payment is made:**
1. Link payment to invoice (`payment.invoice_id = invoice.id`)
2. Update invoice's `amount_paid`
3. Trigger auto-updates balance and status

**Example:**
```sql
-- Record a payment for an invoice
INSERT INTO payments (
  contact_id,
  invoice_id,
  payment_name,
  payment_status,
  payment_method,
  total_amount,
  net_amount,
  transaction_date
) VALUES (
  'contact-uuid',
  'invoice-uuid',
  'Invoice INV-202501-001 Payment',
  'Paid',
  'Credit Card',
  1500.00,
  1455.00,
  '2025-01-27'
);

-- Auto-update invoice
UPDATE invoices
SET amount_paid = amount_paid + 1500.00
WHERE id = 'invoice-uuid';
-- Triggers will update balance_due and status automatically
```

---

## 🛠️ Fixed: Project Fetching

### **Problem**
Contacts imported from HoneyBook had payments but no projects showing up because they weren't linked via `contact_submissions` table.

### **Solution**
Updated `/api/get-contact-projects` to use **multiple fallback methods**:

**Method 1: Direct/Email Match**
```javascript
const { data } = await supabase
  .from('events')
  .select('*')
  .or(`submission_id.eq.${contactId},client_email.eq.${email}`);
```

**Method 2: Submission-Based (fallback)**
```javascript
// Find submissions by email
const { data: submissions } = await supabase
  .from('contact_submissions')
  .select('id')
  .eq('email', email);

// Then find projects with those submission IDs
const { data: projects } = await supabase
  .from('events')
  .select('*')
  .in('submission_id', submissionIds);
```

**Result:** Contacts now show projects regardless of import source! 🎉

---

## 📋 Creating Invoices

### **Manual Creation (SQL)**

```sql
-- Create a new invoice
INSERT INTO invoices (
  contact_id,
  project_id,
  invoice_number,
  invoice_status,
  invoice_title,
  invoice_date,
  due_date,
  subtotal,
  tax_amount,
  total_amount,
  line_items,
  payment_terms
) VALUES (
  'contact-uuid-here',
  'project-uuid-here',
  generate_invoice_number(), -- Auto-generate
  'Draft',
  'Wedding DJ Services - Smith Wedding',
  '2025-01-27',
  '2025-02-27', -- Net 30
  2000.00,
  175.00, -- 8.75% tax
  2175.00,
  '[
    {
      "description": "Professional Wedding DJ - 6 hours",
      "quantity": 1,
      "rate": 1500.00,
      "amount": 1500.00
    },
    {
      "description": "Premium Uplighting Package",
      "quantity": 1,
      "rate": 500.00,
      "amount": 500.00
    }
  ]'::jsonb,
  'Net 30 - Due within 30 days of invoice date'
);
```

### **Line Items Format (JSONB)**

```json
[
  {
    "description": "Service or product description",
    "quantity": 1,
    "rate": 1000.00,
    "amount": 1000.00,
    "type": "service" // or "product", "discount", etc.
  }
]
```

---

## 📊 Reporting Queries

### **Total Revenue by Invoice Status**

```sql
SELECT 
  invoice_status,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_invoiced,
  SUM(amount_paid) as total_collected,
  SUM(balance_due) as total_outstanding
FROM invoices
WHERE invoice_status != 'Cancelled'
GROUP BY invoice_status
ORDER BY total_invoiced DESC;
```

### **Collection Efficiency**

```sql
-- Average days to payment
SELECT 
  AVG(EXTRACT(epoch FROM (paid_date::timestamp - invoice_date::timestamp))/86400) as avg_days_to_pay,
  MIN(EXTRACT(epoch FROM (paid_date::timestamp - invoice_date::timestamp))/86400) as fastest_payment,
  MAX(EXTRACT(epoch FROM (paid_date::timestamp - invoice_date::timestamp))/86400) as slowest_payment
FROM invoices
WHERE invoice_status = 'Paid'
  AND paid_date IS NOT NULL;
```

### **Clients with Overdue Balances**

```sql
SELECT 
  c.first_name,
  c.last_name,
  c.email_address,
  c.phone,
  COUNT(i.id) as overdue_count,
  SUM(i.balance_due) as total_overdue,
  MAX(i.due_date) as most_recent_due_date,
  MAX(CURRENT_DATE - i.due_date) as days_overdue
FROM contacts c
JOIN invoices i ON c.id = i.contact_id
WHERE i.invoice_status IN ('Overdue', 'Partial', 'Sent')
  AND i.balance_due > 0
  AND i.due_date < CURRENT_DATE
GROUP BY c.id, c.first_name, c.last_name, c.email_address, c.phone
ORDER BY total_overdue DESC;
```

### **Revenue Forecast**

```sql
-- Expected revenue from open invoices
SELECT 
  DATE_TRUNC('month', due_date) as expected_month,
  SUM(balance_due) as expected_revenue,
  COUNT(*) as invoice_count
FROM invoices
WHERE invoice_status IN ('Sent', 'Partial', 'Draft')
  AND balance_due > 0
  AND due_date >= CURRENT_DATE
GROUP BY expected_month
ORDER BY expected_month;
```

---

## 🔔 Follow-Up Workflows

### **Overdue Invoice Reminders**

```sql
-- Invoices that need reminders (7+ days overdue, no reminder in 7 days)
SELECT 
  i.invoice_number,
  c.first_name,
  c.last_name,
  c.email_address,
  i.balance_due,
  CURRENT_DATE - i.due_date as days_overdue,
  i.reminder_sent_count,
  i.last_reminder_sent_at
FROM invoices i
JOIN contacts c ON i.contact_id = c.id
WHERE i.invoice_status IN ('Overdue', 'Sent', 'Partial')
  AND i.balance_due > 0
  AND CURRENT_DATE - i.due_date >= 7
  AND (
    i.last_reminder_sent_at IS NULL 
    OR i.last_reminder_sent_at < CURRENT_DATE - INTERVAL '7 days'
  )
ORDER BY days_overdue DESC;
```

### **Update Reminder Tracking**

```sql
-- After sending a reminder
UPDATE invoices
SET 
  reminder_sent_count = reminder_sent_count + 1,
  last_reminder_sent_at = NOW()
WHERE id = 'invoice-uuid-here';
```

---

## 🎯 Where Things Are

### **Database Objects**
- **Table:** `public.invoices`
- **Views:** `invoice_summary`, `overdue_invoices`, `monthly_invoice_stats`
- **Functions:** `generate_invoice_number()`, `calculate_invoice_balance()`, `update_invoices_updated_at()`
- **Migration:** `supabase/migrations/20250127000002_create_invoices_table.sql`

### **UI Components**
- **InvoiceList:** `components/admin/InvoiceList.tsx`
- **Integrated in:** `pages/admin/contacts/[id].tsx`

### **API Endpoints** (Future)
- `/api/invoices` - List all invoices
- `/api/invoices/[id]` - Get/update invoice
- `/api/invoices/create` - Create new invoice
- `/api/invoices/[id]/send` - Email invoice to client
- `/api/invoices/[id]/record-payment` - Record payment

---

## 🚀 Next Steps

### **Recommended Enhancements:**

1. **Invoice Detail Page** (`/admin/invoices/[id]`)
   - View full invoice with line items
   - Edit draft invoices
   - Print/PDF generation
   - Send via email

2. **Invoice Creation Form** (`/admin/invoices/new`)
   - Select contact and project
   - Add line items dynamically
   - Calculate tax and totals
   - Save as draft or send immediately

3. **Invoice Email Templates**
   - Professional HTML email design
   - Include payment link
   - Track email opens
   - Include PDF attachment

4. **Payment Recording**
   - Quick "Record Payment" button on invoices
   - Auto-link payment to invoice
   - Update invoice status
   - Send payment confirmation

5. **Invoice Dashboard** (`/admin/invoices`)
   - All invoices list with filters
   - Status breakdown
   - Overdue alerts
   - Quick actions

6. **Automated Reminders**
   - Schedule reminder emails
   - Escalation workflow (7 days, 14 days, 30 days)
   - Configurable templates
   - Log reminder history

7. **PDF Generation**
   - Generate professional invoice PDFs
   - Custom branding
   - Include payment terms
   - Download or email

---

## ✅ Current Status

**What's Working:**
- ✅ Invoice database structure
- ✅ Auto-status updates
- ✅ Auto-balance calculations
- ✅ Invoice number generation
- ✅ SQL views for reporting
- ✅ InvoiceList component
- ✅ Integration with contacts page
- ✅ Payment linking
- ✅ Fixed project fetching

**What Needs Building:**
- ⏳ Invoice detail/edit pages
- ⏳ Invoice creation form
- ⏳ Email sending functionality
- ⏳ PDF generation
- ⏳ Payment recording UI
- ⏳ Invoice dashboard
- ⏳ Automated reminders

---

## 🎉 Summary

Your invoice system is **structurally complete** with a solid database foundation and beautiful UI components. You can now:

1. **View invoices** on each contact page
2. **Track payment progress** with visual indicators
3. **Identify overdue invoices** automatically
4. **Link payments to invoices** for accurate tracking
5. **See projects** for HoneyBook contacts (fixed!)
6. **Generate invoice numbers** automatically
7. **Query financial data** with powerful SQL views

**The infrastructure is ready for you to start creating invoices and managing your entire billing workflow!** 🚀

---

## 📞 Quick Reference

### **View Invoices**
- Visit `/admin/contacts/[id]` → See "Invoices" section
- Click any invoice to view details (page needs to be built)

### **Create Invoice (Manual)**
- Run SQL insert in Supabase SQL Editor
- Use `generate_invoice_number()` for auto numbering

### **Check Overdue**
```sql
SELECT * FROM overdue_invoices ORDER BY days_overdue DESC;
```

### **Monthly Stats**
```sql
SELECT * FROM monthly_invoice_stats ORDER BY month DESC LIMIT 6;
```

**Happy invoicing! 🧾💰**

