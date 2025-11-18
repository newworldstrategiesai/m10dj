# 🚀 Quick Start: 100% Off Buyer Simulation

## Step 1: Create the Discount Code

**Option A: Using SQL (Recommended)**
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Run: `database/create-test-discount-code.sql`
4. Verify: You should see the TEST100 code created

**Option B: Using Node Script**
```bash
node scripts/create-test-discount-code.js
```

**Option C: Using Admin Interface**
1. Start dev server: `npm run dev`
2. Go to: `http://localhost:3001/admin/discount-codes`
3. Click "Create Code"
4. Fill in:
   - Code: `TEST100`
   - Description: `100% Off - Test Code`
   - Discount Type: `Percentage`
   - Discount Value: `100`
   - Active: ✅ Checked
5. Click "Create Code"

## Step 2: Start the Simulation

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** `http://localhost:3001`

3. **Follow the complete journey:**
   - Submit contact form → Get quote link
   - View quote page → Select package
   - **Apply code: TEST100** → See $0.00 total
   - Save selection → Go to confirmation
   - Make payment ($0) → Complete checkout
   - Sign contract → Complete questionnaire

## Step 3: Verify Results

Check the database:
```sql
-- See discount code usage
SELECT * FROM discount_code_usage 
WHERE discount_code_id = (
  SELECT id FROM discount_codes WHERE code = 'TEST100'
);

-- See quote with discount
SELECT 
  lead_id,
  package_name,
  total_price,
  discount_code,
  discount_amount
FROM quote_selections
WHERE discount_code = 'TEST100'
ORDER BY created_at DESC;
```

## ✅ Expected Results

- ✅ Discount code TEST100 applies 100% discount
- ✅ Total price shows $0.00
- ✅ Payment flow completes (even for $0)
- ✅ All data saved correctly
- ✅ Contract signing works
- ✅ Questionnaire submission works

## 🎯 Test Scenarios

### Scenario 1: Basic 100% Off
- Select Package 1 ($2,000)
- Apply TEST100
- **Expected:** Total = $0.00

### Scenario 2: 100% Off with Add-ons
- Select Package 2 ($2,500)
- Add MC Service ($200)
- Add Uplighting ($300)
- Subtotal: $3,000
- Apply TEST100
- **Expected:** Total = $0.00

### Scenario 3: Full Journey
- Complete entire flow from form → payment → contract → questionnaire
- **Expected:** All steps complete successfully with $0 total

---

**Need help?** See `BUYER_SIMULATION_GUIDE.md` for detailed step-by-step instructions.

