# Contract & E-Signature Quickstart ⚡

Get your **free e-signature system** running in 5 minutes!

---

## ✅ Step 1: Run Migration (1 min)

```bash
# In Supabase SQL Editor, paste and run:
supabase/migrations/20250128000005_add_contracts.sql
```

This creates:
- Contract tables
- Default template
- Secure signing system

---

## ✅ Step 2: Access Admin (30 sec)

Navigate to: **`/admin/contracts`**

You'll see two tabs:
- **Templates** - Your contract templates
- **Contracts** - Generated contracts

---

## ✅ Step 3: Generate Contract (1 min)

1. Click "Contracts" tab
2. Click "Generate Contract" button
3. Select a contact from dropdown
4. Click "Generate"

✨ Contract created with unique number: `CONT-20250128-001`

---

## ✅ Step 4: Send for Signature (30 sec)

1. Click eye icon (👁️) to preview
2. Review the contract
3. Click "Send for Signature"

📧 Client receives email with signing link!

---

## ✅ Step 5: Client Signs (2 min)

Client's experience:
1. Receives email
2. Clicks "Sign Contract" button
3. Reviews contract
4. Enters full name
5. **Draws signature OR types name in cursive**
6. Checks agreement box
7. Clicks "Sign Contract"

🎉 Done! Both parties get confirmation email.

---

## 🎨 Signature Options

### Option 1: Draw Signature
- Use mouse or touchscreen
- Natural handwriting
- Works on any device

### Option 2: Type in Cursive
- Type full name
- Choose from 5 cursive fonts
- Professional signature style

---

## 📝 Smart Fields Reference

Use these in templates to auto-populate data:

### Client
- `{{client_full_name}}` → John Smith
- `{{client_email}}` → john@example.com
- `{{client_phone}}` → (901) 555-1234

### Event
- `{{event_name}}` → Smith Wedding
- `{{event_date}}` → Sat, May 2, 2026
- `{{venue_name}}` → Memphis Botanic Garden
- `{{venue_address}}` → Full address

### Money
- `{{invoice_total}}` → $2,500.00
- `{{deposit_amount}}` → $750.00
- `{{payment_schedule}}` → Auto-generated

### Contract
- `{{contract_number}}` → Auto-generated
- `{{effective_date}}` → Today's date
- `{{company_name}}` → M10 DJ Company

[Full list in CONTRACT_ESIGNATURE_GUIDE.md]

---

## 🔧 Quick Customization

### Change Colors

Edit `/pages/sign-contract/[token].tsx`:

```tsx
// Find:
className="bg-purple-600"

// Change to your brand color:
className="bg-blue-600"
```

### Update Company Info

Edit `/pages/api/contracts/generate.js`:

```javascript
// Find the variables object and update:
company_name: 'Your Company Name',
company_address: 'Your Address',
company_email: 'your@email.com',
company_phone: 'Your Phone'
```

---

## 🎯 Common Tasks

### View All Contracts
`/admin/contracts` → Contracts tab

### Edit Template
`/admin/contracts` → Templates tab → Click edit icon

### Copy Signing Link
Contracts tab → Click copy icon (📋)

### Resend Contract
Contracts tab → Click send icon (📤)

### Track Status
Look at badge color:
- **Gray** = Draft (not sent)
- **Blue** = Sent (awaiting signature)
- **Yellow** = Viewed (client opened)
- **Green** = Signed (complete!)

---

## ⚡ Pro Tips

1. **Test first** - Generate a test contract for yourself
2. **Mobile-friendly** - Signing works great on phones
3. **30-day expiry** - Links auto-expire for security
4. **Track everything** - IP, timestamp, signature method logged
5. **No fees** - Unlimited contracts, forever free

---

## 🚨 Troubleshooting

### Client can't access link
- Check if expired (>30 days)
- Regenerate and resend

### Smart fields not replacing
- Check spelling: `{{client_name}}` not `{{clientName}}`
- Must be exact match

### Email not sending
- Verify email integration is working
- Test with `/api/email/send`

---

## 📊 Your First Week

**Day 1:** Set up system, test with yourself  
**Day 2:** Generate contract for real client  
**Day 3:** Get your first signature! 🎉  
**Day 4:** Create custom template  
**Day 5:** Automate from service selection  

---

## 🎉 What You Built

✅ Professional e-signature system  
✅ $0 monthly fees (vs $480/year for DocuSign)  
✅ Unlimited signatures  
✅ Draw OR type signatures  
✅ Mobile-friendly  
✅ Legally binding  
✅ Full audit trail  
✅ Email automation  
✅ Secure token system  

**Comparable to:** DocuSign, PandaDoc, HelloSign  
**Your cost:** **$0**  

---

## 📚 Full Documentation

See: `CONTRACT_ESIGNATURE_GUIDE.md`

For complete details on:
- All smart fields
- API reference
- Security features
- Customization
- Best practices
- ROI analysis

---

## 🆘 Need Help?

**Email:** m10djcompany@gmail.com  
**Files:** `/components/admin/ContractTemplateEditor.tsx`  
**Admin:** `/pages/admin/contracts.tsx`  

---

**Ready? Go to `/admin/contracts` and generate your first contract!** 🚀

