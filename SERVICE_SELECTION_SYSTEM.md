# 🎯 Private Service Selection System

## **WHAT THIS IS**

A **private, non-public** service selection page system that lets wedding leads choose their DJ packages and add-ons interactively. Perfect for sending after initial inquiries to streamline the quoting process.

---

## 🎨 **FEATURES**

### **For Leads:**
- ✅ Beautiful, interactive package selection
- ✅ Visual comparison of 3 wedding packages ($2,000, $2,500, $3,000)
- ✅ Add-on selection with quantity controls
- ✅ Real-time total calculation
- ✅ Optional notes/questions field
- ✅ Mobile-friendly responsive design
- ✅ Personalized greeting with their name
- ✅ Success confirmation after submission

### **For You (Admin):**
- ✅ One-click link generation
- ✅ Secure tokenized URLs (can't be guessed)
- ✅ Email template with link pre-populated
- ✅ Selections saved to contact record automatically
- ✅ Lead status updated to "Proposal Sent"
- ✅ Notes appended with their selections

---

## 📦 **WHAT WAS CREATED**

### **1. Service Selection Page** (`pages/select-services/[token].tsx`)
- Private page (not indexed by search engines)
- Accessed via unique token URL
- Loads contact info from database
- Interactive package & add-on selection
- Saves selections back to contact record

### **2. API Endpoint** (`pages/api/generate-service-selection-link.js`)
- Generates secure tokenized links
- Admin-only access
- Stores token in contact's custom_fields
- Returns shareable URL

### **3. Admin Component** (`components/admin/ServiceSelectionButton.tsx`)
- Easy-to-use button for admin interface
- One-click link generation
- Copy to clipboard functionality
- Pre-filled email template
- Shows generated link with actions

---

## 🚀 **HOW TO USE**

### **Step 1: Add Button to Admin Contacts Page**

In your admin contacts page (e.g., `pages/admin/contacts/[id].tsx`), add:

```tsx
import ServiceSelectionButton from '@/components/admin/ServiceSelectionButton';

// Inside your contact detail page component:
<ServiceSelectionButton 
  contactId={contact.id}
  contactName={`${contact.first_name} ${contact.last_name}`}
  contactEmail={contact.email_address}
/>
```

### **Step 2: Generate Link for a Lead**

1. Open a contact in your admin dashboard
2. Click "Generate Service Selection Link"
3. Wait 1-2 seconds for generation
4. Link appears with two options:
   - **Copy Link** - Copy to clipboard to paste anywhere
   - **Send Email** - Opens pre-filled email template

### **Step 3: Send to Lead**

**Option A: Use Pre-Filled Email**
1. Click "Send Email" button
2. Your email client opens with template pre-filled
3. Review and send

**Option B: Copy & Paste**
1. Click "Copy Link"
2. Paste into your preferred communication method (email, text, etc.)

**Example Email Template:**
```
Subject: Select Your Wedding DJ Services - M10 DJ Company

Hi [First Name],

Thank you for your interest in M10 DJ Company for your special day!

I've created a personalized service selection page where you can choose your perfect package and add-ons. This will help me prepare an accurate proposal tailored to your needs.

Click here to select your services:
[LINK]

Once you submit your selections, I'll prepare a detailed proposal and follow up within 24 hours.

If you have any questions, feel free to call me at (901) 410-2020.

Looking forward to making your celebration unforgettable!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
www.m10djcompany.com
```

---

## 📋 **PACKAGES & PRICING**

### **Package 1 - Reception Only** ($2,000)
- DJ / MC Services at Reception (4 hours)
- Premium speakers & microphones
- Dance Floor Lighting (multi-color LED)
- Uplighting (up to 16 fixtures)
- Additional Speaker for cocktail hour

### **Package 2 - Ceremony & Reception** ($2,500) ⭐ MOST POPULAR
- Everything in Package 1
- Ceremony Audio (additional hour + music programming)
- Monogram Projection (custom graphic)

### **Package 3 - Premium** ($3,000)
- Everything in Package 2
- Dancing on the Clouds (dry ice first dance effect)

### **Add-Ons:**
- Ceremony Audio (a la carte): $500
- Additional Speaker: $250
- Monogram Projection: $350
- Uplighting Add-on: $300
- Additional Hour(s): $150
- 4 Hours DJ/MC (a la carte): $1,500
- 3 Hours DJ/MC (a la carte): $1,300
- Dance Floor Lighting (a la carte): $350
- Dancing on the Clouds: $500
- Cold Spark Fountain Effect: $600

---

## 💾 **WHAT GETS SAVED**

When a lead submits their selections:

### **Stored in `contacts.custom_fields`:**
```json
{
  "service_selection": {
    "package": {
      "id": "package-2",
      "name": "Package 2",
      "basePrice": 2500
    },
    "addOns": [
      {
        "id": "dancing-clouds",
        "name": "Dancing on the Clouds",
        "price": 500,
        "quantity": 1
      }
    ],
    "total": 3000,
    "additionalNotes": "We want purple uplighting to match our theme",
    "submittedAt": "2025-01-27T10:30:00Z"
  }
}
```

### **Updated in `contacts` table:**
- `lead_status` → Changed to "Proposal Sent"
- `notes` → Appended with summary of selections
- `updated_at` → Timestamp updated

---

## 🔐 **SECURITY**

### **How Tokens Work:**
1. Token is generated from contact ID + email + secret + timestamp
2. Base64URL encoded (URL-safe)
3. Stored in contact's `custom_fields` for verification
4. Can't be guessed or tampered with (includes hash)

### **Access Control:**
- ✅ Only admin users can generate links
- ✅ Links are unique per contact
- ✅ Page is `noindex, nofollow` (not searchable)
- ✅ Invalid tokens redirect to homepage
- ✅ One-time use (after submission, shows thank you page)

### **Production Improvements:**
For enhanced security in production, consider:
- JWT tokens with expiration
- Database table for tokens with expiry timestamps
- Rate limiting on link generation
- Email verification before showing selections

---

## 🎨 **CUSTOMIZATION**

### **Change Package Prices:**

Edit `pages/select-services/[token].tsx`:

```tsx
const packages: Package[] = [
  {
    id: 'package-1',
    name: 'Package 1',
    description: 'Reception Only',
    basePrice: 2000, // Change this
    // ...
  },
  // ...
];
```

### **Add/Remove Add-Ons:**

```tsx
const addOns: AddOn[] = [
  {
    id: 'new-addon',
    name: 'New Service',
    description: 'Description here',
    price: 400,
    category: 'effects'
  },
  // ...
];
```

### **Change Colors/Branding:**

The page uses Tailwind classes:
- `from-purple-600 to-pink-600` - Gradient for selected package
- `bg-brand` - Your brand color
- `text-brand-gold` - Gold accent for "Most Popular"

---

## 📊 **WORKFLOW EXAMPLE**

**Scenario:** Sarah contacts you about her June wedding.

1. **Lead Comes In:**
   - Sarah fills out contact form on your website
   - Creates contact record in your admin dashboard
   - Status: "New"

2. **You Respond:**
   - Open Sarah's contact in admin
   - Click "Generate Service Selection Link"
   - Click "Send Email" (pre-filled template opens)
   - Send email to Sarah

3. **Sarah Selects Services:**
   - Sarah clicks link in email
   - Sees personalized page: "Hi Sarah! Select Your Perfect Package"
   - Chooses Package 2 ($2,500)
   - Adds "Dancing on the Clouds" ($500)
   - Total shows: $3,000
   - Adds note: "We want purple uplighting"
   - Clicks "Submit My Selections"

4. **System Updates:**
   - Sarah sees success message
   - Contact status → "Proposal Sent"
   - Selections saved to `custom_fields`
   - Notes appended with summary
   - You get notification (if notifications enabled)

5. **You Follow Up:**
   - Check Sarah's contact in admin
   - See her selections in custom_fields
   - Prepare detailed proposal
   - Send proposal within 24 hours

---

## 🔧 **INTEGRATION WITH ADMIN DASHBOARD**

### **Option 1: Add to Contact Detail Page**

```tsx
// pages/admin/contacts/[id].tsx

import ServiceSelectionButton from '@/components/admin/ServiceSelectionButton';

export default function ContactDetail({ contact }) {
  return (
    <div>
      <h1>{contact.first_name} {contact.last_name}</h1>
      
      {/* Contact Info */}
      <div className="mb-6">
        {/* ... existing contact info ... */}
      </div>
      
      {/* Service Selection Link Generator */}
      {contact.event_type === 'wedding' && contact.lead_status !== 'Lost' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Service Selection</h3>
          <ServiceSelectionButton 
            contactId={contact.id}
            contactName={`${contact.first_name} ${contact.last_name}`}
            contactEmail={contact.email_address}
          />
        </div>
      )}
      
      {/* Show Selections if Submitted */}
      {contact.custom_fields?.service_selection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Selected Services
          </h3>
          <div className="space-y-2">
            <p><strong>Package:</strong> {contact.custom_fields.service_selection.package.name}</p>
            <p><strong>Base Price:</strong> ${contact.custom_fields.service_selection.package.basePrice}</p>
            
            {contact.custom_fields.service_selection.addOns.length > 0 && (
              <div>
                <strong>Add-Ons:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {contact.custom_fields.service_selection.addOns.map((addon, idx) => (
                    <li key={idx}>
                      {addon.name} x{addon.quantity} - ${addon.price * addon.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-xl font-bold text-blue-900 mt-3">
              Total: ${contact.custom_fields.service_selection.total}
            </p>
            
            {contact.custom_fields.service_selection.additionalNotes && (
              <div className="mt-3">
                <strong>Notes:</strong>
                <p className="text-gray-700 mt-1">
                  {contact.custom_fields.service_selection.additionalNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📧 **EMAIL TEMPLATES**

### **Initial Service Selection Email:**

```
Subject: Select Your Wedding DJ Services - M10 DJ Company

Hi [First Name],

Thank you for reaching out about DJ services for your [Date] wedding at [Venue]!

To help me prepare an accurate proposal, I've created a personalized service selection page where you can:
✓ Compare our 3 wedding packages
✓ Choose add-ons like uplighting, monogram projection, and special effects
✓ See your total investment in real-time
✓ Add any special requests or questions

Click here to select your services:
[LINK]

This will only take 2-3 minutes, and once you submit, I'll prepare a detailed proposal and follow up within 24 hours.

Questions? Call/text me at (901) 410-2020 anytime!

Best,
Ben Murray
M10 DJ Company
```

### **Follow-Up After Selection:**

```
Subject: Your Custom Wedding DJ Proposal - M10 DJ Company

Hi [First Name],

Thank you for selecting your services! I've reviewed your choices:

Package: [Package Name] - $[Price]
Add-Ons: [List]
Total Investment: $[Total]

Based on your selections and your note about "[Their Note]", I've prepared a custom proposal for your [Date] wedding.

[Attach proposal or link to proposal]

Let's schedule a quick call to go over the details and answer any questions. When works best for you this week?

Looking forward to making your celebration unforgettable!

Best,
Ben Murray
(901) 410-2020
```

---

## 🎯 **BENEFITS**

### **For You:**
- ✅ **Saves Time** - No more back-and-forth pricing questions
- ✅ **Pre-Qualified Leads** - They see pricing upfront
- ✅ **Professional** - Modern, polished experience
- ✅ **Organized** - All selections stored in one place
- ✅ **Trackable** - Know which packages are most popular
- ✅ **Faster Closing** - Leads are more committed after selecting

### **For Leads:**
- ✅ **Transparent** - See all options and pricing clearly
- ✅ **Interactive** - Visual, engaging experience
- ✅ **Convenient** - Do it on their own time
- ✅ **Personalized** - Feels custom to them
- ✅ **Informed** - Make educated decisions
- ✅ **No Pressure** - Not a sales call, just information

---

## 📈 **ANALYTICS & TRACKING**

### **Track Popular Packages:**

```sql
-- Which packages are most selected?
SELECT 
  custom_fields->'service_selection'->'package'->>'name' as package_name,
  COUNT(*) as selections,
  AVG((custom_fields->'service_selection'->>'total')::numeric) as avg_total
FROM contacts
WHERE custom_fields->'service_selection' IS NOT NULL
GROUP BY package_name
ORDER BY selections DESC;
```

### **Track Popular Add-Ons:**

```sql
-- Which add-ons are most popular?
-- (Requires JSONB array expansion)
SELECT 
  addon->>'name' as addon_name,
  SUM((addon->>'quantity')::int) as total_quantity,
  COUNT(*) as times_selected
FROM contacts,
  jsonb_array_elements(custom_fields->'service_selection'->'addOns') as addon
WHERE custom_fields->'service_selection' IS NOT NULL
GROUP BY addon_name
ORDER BY total_quantity DESC;
```

---

## 🚦 **STATUS**

- ✅ Service selection page created
- ✅ API endpoint for link generation
- ✅ Admin component for easy use
- ✅ Security implemented
- ✅ Mobile-responsive design
- ✅ Success/thank you page
- ✅ Data saving to contact records
- ✅ Documentation complete

**Status:** Ready to use immediately!

---

## 📞 **NEXT STEPS**

1. ✅ Add `ServiceSelectionButton` to your admin contacts page
2. ✅ Test with a sample contact
3. ✅ Send to your next wedding inquiry
4. ✅ Review selections in contact records
5. ✅ Track which packages/add-ons are most popular

---

**Created:** January 27, 2025  
**Status:** Production-ready  
**Pages:** `/select-services/[token]`  
**API:** `/api/generate-service-selection-link`  
**Component:** `ServiceSelectionButton.tsx`

