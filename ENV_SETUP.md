# 🔧 Environment Variables Setup

## Required Configuration

Add these variables to your `.env.local` file:

```bash
# Admin User Configuration
DEFAULT_ADMIN_USER_ID=aa23eed5-de23-4b28-bc5d-26e72077e7a8

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
ADMIN_PHONE_NUMBER=your-admin-phone-number

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
```

## 🎯 Critical Variables

The **DEFAULT_ADMIN_USER_ID** is essential for:
- Contact form submissions to be assigned to your admin account
- Proper access control for the contacts system
- Chat system integration

## 🚀 After Setup

1. Restart your development server: `npm run dev`
2. Visit: `http://localhost:3000/admin/contacts` (while logged in as admin)
3. Test contact form submissions to verify auto-creation

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Keep your Supabase service role key secure
- Use environment-specific URLs for production