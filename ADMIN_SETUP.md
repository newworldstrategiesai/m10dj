# Admin Backend Setup Guide

## 🚀 Getting Started

Your admin backend system is now ready! Here's how to get it fully operational:

## 📋 Prerequisites

1. **Supabase Project**: You need a Supabase project set up
2. **Environment Variables**: Configure your `.env.local` file
3. **Admin User**: Create your first admin user

## 🔧 Step 1: Environment Setup

Make sure your `.env.local` file contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key_for_emails
```

## 🗄️ Step 2: Database Setup

### Option A: Run the Migration (Recommended)

In your Supabase Dashboard:

1. Go to **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/20241201000000_create_admin_tables.sql`
3. Click **Run**

### Option B: Manual Setup via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

## 👤 Step 3: Create Your First Admin User

### Update Admin Email List

Edit `utils/auth-helpers/admin.ts` and add your email to the admin list:

```typescript
const adminEmails = [
  'your-admin-email@domain.com',  // Add your email here
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
];
```

### Create the User in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication > Users**
3. Click **Add User**
4. Enter your email and temporary password
5. Make sure to use the same email you added to the admin list

## 🧪 Step 4: Test the System

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the contact form**:
   - Go to `http://localhost:3000`
   - Fill out and submit the contact form
   - Check that it shows success message

3. **Access admin dashboard**:
   - Go to `http://localhost:3000/admin/dashboard`
   - Sign in with your admin email
   - You should see the submission you just created!

## ✨ Features Included

### ✅ Contact Form System
- **Frontend Form**: Modern, responsive contact form
- **Backend API**: `/api/contact` endpoint that saves to database
- **Email Notifications**: Automatic emails to both client and admin
- **Database Storage**: All submissions stored in `contact_submissions` table

### ✅ Admin Dashboard
- **Authentication**: Protected admin-only access
- **Submissions Management**: View and update submission status
- **Analytics**: Real-time stats and event type breakdown
- **Modern UI**: Professional design matching your site theme
- **Status Tracking**: Track leads from "new" to "completed"

### ✅ Database Tables
- `contact_submissions` - Contact form submissions
- `testimonials` - Customer testimonials
- `faqs` - Frequently asked questions
- `events` - Booked events details
- `blog_posts` - SEO blog content
- `preferred_vendors` - Vendor network
- `preferred_venues` - Venue recommendations
- `services` - Service offerings
- `gallery_images` - Photo gallery
- `admin_users` - Admin user management

## 🔐 Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Admin Authentication**: Only approved emails can access admin features
- **Public/Private Access**: Proper permissions for public vs admin data
- **Input Validation**: Form validation and sanitization

## 📊 Admin Dashboard Features

### Status Management
Track leads through these statuses:
- **New**: Fresh submissions
- **Contacted**: Initial contact made
- **Quoted**: Price quote provided
- **Booked**: Event confirmed
- **Completed**: Event finished
- **Cancelled**: Event cancelled

### Analytics
- Total submissions count
- Monthly submission trends
- Event type breakdown
- New inquiry alerts
- Booked events tracking

## 🎨 Customization

### Adding More Admin Users
Edit the `adminEmails` array in `utils/auth-helpers/admin.ts`:

```typescript
const adminEmails = [
  'owner@m10djcompany.com',
  'manager@m10djcompany.com',
  'assistant@m10djcompany.com',
  // Add more emails as needed
];
```

### Email Templates
Customize email templates in `pages/api/contact.js`:
- Customer confirmation email
- Admin notification email

### Form Fields
Add more form fields by updating:
- `components/company/ContactForm.js` (frontend)
- `pages/api/contact.js` (backend processing)
- Database schema if needed

## 🚨 Troubleshooting

### "Supabase not configured" Error
- Check your environment variables are set correctly
- Restart your development server after adding env vars

### "Access Denied" on Admin Dashboard
- Ensure your email is in the `adminEmails` array
- Check that you're signed in with the correct email
- Verify the user exists in Supabase Authentication

### Contact Form Not Submitting
- Check browser console for error messages
- Verify the `/api/contact` endpoint is working
- Check Supabase table permissions

### Database Errors
- Ensure all tables are created properly
- Check Row Level Security policies
- Verify your service role key has proper permissions

## 📈 Next Steps

Once everything is working:

1. **Production Setup**: Deploy to Vercel/Netlify with production environment variables
2. **Email Domain**: Set up proper sending domain in Resend
3. **Backup Strategy**: Set up regular database backups
4. **Monitoring**: Add error tracking (Sentry, LogRocket, etc.)
5. **Analytics**: Add Google Analytics or similar
6. **SEO**: Optimize meta tags and add sitemap

## 🆘 Need Help?

If you run into issues:

1. Check the browser console for error messages
2. Check the Supabase logs in your dashboard
3. Verify all environment variables are set
4. Make sure you're using the correct admin email

Your admin system is now ready to handle customer inquiries professionally! 🎉 