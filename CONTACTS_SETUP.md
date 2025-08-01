# 📋 Contacts System Setup Guide

## 🚀 Quick Setup

### 1. Run the Database Migration

```bash
# Apply the contacts table migration
npx supabase migration up
```

### 2. Set Admin User ID

Add this to your `.env.local` file:
```bash
DEFAULT_ADMIN_USER_ID=aa23eed5-de23-4b28-bc5d-26e72077e7a8
```

### 3. Test the System

Test the contacts table:
```
http://localhost:3000/api/test-contacts-table
```

Test the full workflow:
```
POST http://localhost:3000/api/test-contact-workflow
```

## 🎯 Features Enabled

### ✅ Automatic Contact Creation
- Contact form submissions automatically create contacts
- Duplicate detection by email and phone
- Lead scoring and classification

### ✅ DJ Business Fields
- Event types (wedding, corporate, etc.)
- Venue and event details
- Music preferences and special requests
- Budget and pricing information

### ✅ Lead Management
- Lead status pipeline tracking
- Temperature scoring (Hot/Warm/Cold)
- Follow-up scheduling
- Communication history

### ✅ Chat Integration
- Contacts populate in new message modal
- Contact search and matching
- Lead status badges

### ✅ Search & Analytics
- Full-text search across all fields
- Summary statistics views
- Hot leads filtering

## 🔧 Troubleshooting

### Migration Errors
If you get schema errors:
1. Make sure Supabase is running: `npx supabase start`
2. Check that your users are in auth.users schema
3. Verify environment variables are set

### Contact Creation Issues
1. Ensure `DEFAULT_ADMIN_USER_ID` is set correctly
2. Check that the user ID exists in auth.users
3. Verify RLS policies allow contact creation

### Chat Integration
1. Contacts should appear in the new message modal
2. Search functionality should work across names/emails/phones
3. Recent contacts should show based on lead status

## 📊 Database Schema

The contacts table includes:
- **Personal Info**: Names, email, phone, address
- **Event Details**: Type, date, venue, guest count
- **Music Preferences**: Genres, special requests, equipment needs
- **Business Tracking**: Lead status, source, scoring, pipeline
- **Communication**: History, preferences, follow-ups
- **Financial**: Budget, quotes, deposits, contracts
- **Post-Event**: Feedback, ratings, testimonials

## 🔐 Admin Access

The contacts system is available at:
- **URL**: `m10djcompany.com/admin/contacts` ✅
- **Access**: Admin users only (automatic redirect for non-admin) ✅
- **Navigation**: Contacts link appears in navbar when logged in as admin ✅
- **Routes**: Properly configured for Next.js Pages Router ✅

### Files Structure:
```
pages/admin/
├── contacts/
│   ├── index.tsx          # Main contacts list page  
│   └── [id].tsx           # Individual contact detail page
└── leads/
    ├── index.js           # Redirects to dashboard
    └── [id].js            # Lead details page (contact submissions)
```

### Navigation Flow:
1. **Dashboard** → Click form submission row → **Lead Details** (`/admin/leads/[id]`)
2. **Lead Details** → Click "Manage Contact" → **Contact Management** (`/admin/contacts/[id]?from=lead`)
3. **Contact Management** → Back button → Returns to **Lead Details** (when `from=lead`)

This separation allows for:
- 📋 Simple **lead review** and status updates (Lead Details)
- 📊 Comprehensive **contact management** and CRM features (Contact Management)
- 🔄 Seamless **navigation** between both views

## 🎵 Perfect for DJ Business!

This system is specifically designed for DJ businesses with fields for:
- Wedding and event management
- Music preference tracking
- Equipment and service requests
- Lead pipeline management
- Client relationship building