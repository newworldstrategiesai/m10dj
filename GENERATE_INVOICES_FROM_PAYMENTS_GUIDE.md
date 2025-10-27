# 🧾 Generate Invoices from Payments - Guide

## Overview

This script **automatically creates invoices** for all your HoneyBook payment transactions by intelligently inferring what services were provided based on payment amounts, event types, and payment patterns.

---

## 🎯 What It Does

### **1. Intelligent Line Item Inference**
The script analyzes payment amounts and automatically creates detailed line items:

**Small Events ($500-$950):**
```json
{
  "description": "Professional DJ Services - Wedding",
  "quantity": 1,
  "rate": 850.00,
  "amount": 850.00
}
```

**Medium Events ($950-$1,200):**
```json
[
  {
    "description": "Professional DJ/MC Services - Wedding",
    "rate": 700.00  // 70% of total
  },
  {
    "description": "Premium Sound System & Equipment",
    "rate": 300.00  // 30% of total
  }
]
```

**Large Events ($1,200-$2,000):**
```json
[
  {
    "description": "Professional DJ/MC Services - Wedding",
    "rate": 750.00  // 60% of total
  },
  {
    "description": "Premium Lighting Package",
    "rate": 312.50  // 25% of total
  },
  {
    "description": "Complete Sound System Setup",
    "rate": 187.50  // 15% of total
  }
]
```

**Premium Events ($2,000+):**
```json
[
  {
    "description": "Professional DJ/MC Services (6-8 hours) - Wedding",
    "rate": 1250.00  // 50% of total
  },
  {
    "description": "Premium Uplighting & Dance Floor Lighting",
    "rate": 750.00   // 30% of total
  },
  {
    "description": "Complete Sound System & Microphones",
    "rate": 375.00   // 15% of total
  },
  {
    "description": "Professional Setup, Coordination & Backup Equipment",
    "rate": 125.00   // 5% of total
  }
]
```

### **2. Standard Package Matching**

The script automatically matches amounts to your standard packages:

- **Just the Basics** ($850 base)
- **Package #1 - Most Popular** ($1,095 base)
- **Package #2 - Premium** ($1,345 base)
- **Custom Package** (everything else)

### **3. Multi-Payment Handling**

If a client has multiple payments (e.g., "1 of 2 payments", "2 of 2 payments"):
- **Groups them into a single invoice**
- **Sums the total amount**
- **Tracks partial payments**
- **Shows payment plan in terms**

Example:
```
Payment 1: $1,250 (1 of 2 payments / Retainer)
Payment 2: $1,250 (2 of 2 payments)
→ Creates ONE invoice for $2,500 with "Payment plan: 2 payments"
```

### **4. Tax Calculation**

Automatically calculates Tennessee sales tax (8.75%):
```javascript
Total Amount: $2,175.00
Tax Amount: $175.00 (8.75%)
Subtotal: $2,000.00
```

### **5. Gratuity Tracking**

If payments include gratuity/tips, adds them as a separate line item:
```json
{
  "description": "Gratuity",
  "quantity": 1,
  "rate": 250.00,
  "amount": 250.00,
  "type": "gratuity"
}
```

### **6. Auto-Status Detection**

Sets invoice status based on payments:
- **Paid** - All payments received
- **Partial** - Some payments received
- **Overdue** - Past due date with no payment
- **Sent** - Invoice sent, payment pending

### **7. Payment Linking**

Automatically links all payments to their invoice:
```sql
UPDATE payments 
SET invoice_id = 'generated-invoice-id'
WHERE contact_id = 'contact-id';
```

---

## 🚀 How to Run

### **Step 1: Make sure the invoice migration is run**
```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/20250127000002_create_invoices_table_fixed.sql
```

### **Step 2: Run the script**
```bash
cd /Users/benmurray/m10dj
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/generate-invoices-from-payments.js
```

### **Step 3: Review the output**
```
🧾 Starting Invoice Generation from HoneyBook Payments

📊 Found 142 contacts to process

✅ Created invoice INV-202501-001 for John Smith - Paid - $2175.00
✅ Created invoice INV-202501-002 for Sarah Jones - Partial - $1500.00
✅ Created invoice INV-202501-003 for Mike Davis - Paid - $850.00
...

============================================================
✅ Invoice Generation Complete!
============================================================
✅ Invoices Created: 97
⏭️  Invoices Skipped: 0
❌ Errors: 0
============================================================
```

---

## 📊 What Gets Created

For each contact with payments, the script creates:

### **Invoice Record**
```sql
INSERT INTO invoices (
  contact_id,
  invoice_number,          -- INV-202501-001 (auto-generated)
  invoice_status,          -- Paid, Partial, Overdue, Sent
  invoice_title,           -- "Wedding DJ Services - John Smith"
  invoice_description,     -- "Professional DJ services for John Smith's wedding"
  invoice_date,           -- Date of first payment
  due_date,               -- Due date from payment
  subtotal,               -- Amount before tax
  tax_amount,             -- 8.75% TN sales tax
  tax_rate,               -- 8.75
  total_amount,           -- Full invoice total
  amount_paid,            -- Sum of paid payments
  balance_due,            -- Remaining balance
  line_items,             -- JSON array of services
  payment_terms,          -- "Payment plan: 2 payments" or "Payment due upon receipt"
  notes,                  -- Event date if available
  internal_notes,         -- "Auto-generated from HoneyBook payments"
  honeybook_invoice_id    -- Original HoneyBook payment ID
)
```

### **Line Items (JSON)**
```json
{
  "lineItems": [
    {
      "description": "Professional DJ/MC Services (4 hours) - Wedding",
      "quantity": 1,
      "rate": 1400.00,
      "amount": 1400.00,
      "type": "service"
    },
    {
      "description": "Premium Lighting Package",
      "quantity": 1,
      "rate": 500.00,
      "amount": 500.00,
      "type": "equipment"
    },
    {
      "description": "Complete Sound System Setup",
      "quantity": 1,
      "rate": 100.00,
      "amount": 100.00,
      "type": "equipment"
    },
    {
      "description": "Gratuity",
      "quantity": 1,
      "rate": 175.00,
      "amount": 175.00,
      "type": "gratuity"
    }
  ],
  "subtotal": 2175.00,
  "taxAmount": 190.31,
  "taxRate": 8.75,
  "total": 2365.31
}
```

---

## 🎨 Intelligent Package Detection

The script uses this logic to determine service packages:

```javascript
function inferServicePackage(totalAmount, eventType) {
  // Remove tax to get base amount
  const baseAmount = totalAmount / 1.0875;
  
  if (baseAmount < 950) return 'basic';        // Just the Basics
  if (baseAmount < 1200) return 'standard';    // Package #1
  if (baseAmount < 1500) return 'premium';     // Package #2
  return 'custom';                              // Custom Package
}
```

### **Package Breakdown:**

#### **Basic Package ($850)**
- Professional DJ/MC Services (3 hours)
- Premium Sound System
- Professional Setup & Coordination

#### **Standard Package ($1,095)**
- Professional DJ/MC Services (4 hours)
- Premium Sound System & Microphones
- Multi-Color LED Dance Floor Lighting
- Professional Setup & Coordination

#### **Premium Package ($1,345)**
- Professional DJ/MC Services (4 hours)
- Premium Sound System & Microphones
- Multi-Color LED Dance Floor Lighting
- Up to 16 Elegant Uplighting Fixtures
- Professional Setup & Coordination

#### **Custom Package**
Dynamically generated based on total amount, with percentages allocated to:
- DJ/MC Services (50-70%)
- Lighting (20-30%)
- Equipment (10-20%)
- Setup/Coordination (5-10%)

---

## 📈 Example Outputs

### **Example 1: Standard Wedding Package**

**Input:**
- Payment: $2,175.00
- Event Type: Wedding
- Contact: John & Sarah Smith

**Generated Invoice:**
```
Invoice: INV-202501-001
Title: Wedding DJ Services - John Smith
Status: Paid

Line Items:
1. Professional DJ/MC Services (4 hours) - Wedding ...... $1,400.00
2. Premium Lighting Package ............................ $500.00
3. Complete Sound System Setup ......................... $100.00
4. Gratuity ............................................ $175.00

Subtotal: .............................................. $2,175.00
Tax (8.75%): ........................................... $190.31
Total: ................................................. $2,365.31
Paid: .................................................. $2,365.31
Balance: ............................................... $0.00
```

### **Example 2: Multi-Payment Plan**

**Input:**
- Payment 1: $750.00 (1 of 2 payments / Retainer) - Paid
- Payment 2: $750.00 (2 of 2 payments) - Pending
- Event Type: Corporate Event

**Generated Invoice:**
```
Invoice: INV-202501-002
Title: Corporate Event DJ Services - ABC Company
Status: Partial
Payment Terms: Payment plan: 2 payments

Line Items:
1. Professional DJ/MC Services - Corporate Event ........ $1,050.00
2. Premium Sound System & Equipment ..................... $450.00

Subtotal: .............................................. $1,500.00
Tax (8.75%): ........................................... $131.25
Total: ................................................. $1,631.25
Paid: .................................................. $750.00
Balance: ............................................... $881.25
```

---

## 🔍 Verification Queries

After running the script, verify with these SQL queries:

### **Count Invoices Created**
```sql
SELECT COUNT(*) FROM invoices;
```

### **View Recent Invoices**
```sql
SELECT 
  invoice_number,
  invoice_title,
  invoice_status,
  total_amount,
  amount_paid,
  balance_due
FROM invoice_summary
ORDER BY invoice_date DESC
LIMIT 20;
```

### **Check Payment Linking**
```sql
SELECT 
  p.payment_name,
  p.total_amount,
  i.invoice_number,
  i.invoice_title
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
ORDER BY i.invoice_date DESC
LIMIT 20;
```

### **Find Invoices with Multiple Payments**
```sql
SELECT 
  i.invoice_number,
  i.invoice_title,
  i.total_amount,
  COUNT(p.id) as payment_count
FROM invoices i
JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.invoice_title, i.total_amount
HAVING COUNT(p.id) > 1
ORDER BY payment_count DESC;
```

### **Total Revenue Verification**
```sql
-- Compare payments total vs invoices total
SELECT 
  (SELECT SUM(total_amount) FROM payments WHERE payment_status = 'Paid') as payments_total,
  (SELECT SUM(amount_paid) FROM invoices) as invoices_total,
  (SELECT SUM(total_amount) FROM payments WHERE payment_status = 'Paid') - 
  (SELECT SUM(amount_paid) FROM invoices) as difference;
```

---

## 🛠️ Customization

### **Adjust Tax Rate**
```javascript
// In scripts/generate-invoices-from-payments.js
const taxRate = 0.0875; // Change to your state's rate
```

### **Modify Package Thresholds**
```javascript
function inferServicePackage(totalAmount, eventType) {
  const baseAmount = totalAmount / 1.0875;
  
  if (baseAmount < 900) return 'basic';      // Adjust these
  if (baseAmount < 1150) return 'standard';  // to match your
  if (baseAmount < 1400) return 'premium';   // actual packages
  return 'custom';
}
```

### **Change Line Item Percentages**
```javascript
// For custom packages > $2000
const djRate = amountBeforeGratuity * 0.5;        // 50% DJ services
const lightingRate = amountBeforeGratuity * 0.3;  // 30% Lighting
const equipmentRate = amountBeforeGratuity * 0.15; // 15% Equipment
const setupRate = amountBeforeGratuity * 0.05;     // 5% Setup
```

---

## ⚠️ Important Notes

1. **Run After Invoice Migration**: Make sure the invoice table exists first
2. **Backup First**: Always backup your database before running bulk operations
3. **Review Sample Invoices**: Check a few generated invoices manually before accepting all
4. **Idempotent**: Safe to run multiple times (won't create duplicates if invoice_number exists)
5. **Payment Grouping**: Payments are grouped by contact email and date
6. **HoneyBook ID**: Original HoneyBook payment ID stored in `honeybook_invoice_id`

---

## 🎉 Results

After running this script, you'll have:

✅ **Complete invoice records** for all 97 HoneyBook payments  
✅ **Detailed line items** with professional descriptions  
✅ **Proper tax calculations** (8.75% TN rate)  
✅ **Payment linking** - all payments connected to invoices  
✅ **Accurate status tracking** (Paid, Partial, Overdue)  
✅ **Beautiful UI display** on contact detail pages  
✅ **Ready for financial reporting** in dashboard  

---

## 📞 Next Steps

1. **Run the script** to generate all invoices
2. **Review in admin panel** at `/admin/contacts/[id]`
3. **Check financial dashboard** at `/admin/financial`
4. **Export to accounting software** (QuickBooks, Xero)
5. **Create new invoices manually** for future bookings

**Your entire HoneyBook payment history is now organized into professional invoices!** 🎊

