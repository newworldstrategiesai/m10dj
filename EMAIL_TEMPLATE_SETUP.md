# 🎨 Custom Email Template Setup Guide

This guide will help you replace the default Supabase emails with beautiful, branded M10 DJ Company templates.

## ✨ What You Get

- **White-labeled emails** (no Supabase branding)
- **Professional M10 DJ Company branding**
- **Responsive design** (mobile-friendly)
- **Modern styling** with your brand colors (black, white, gold)
- **Security notices** and professional copy

## 📧 Templates Included

1. **Signup Confirmation** (`confirm-signup.html`)
2. **Password Reset** (`reset-password.html`) 
3. **Magic Link Sign-in** (`magic-link.html`)

## 🚀 Setup Instructions

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your M10 DJ project 
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Each Template

#### A. Confirm Signup Template

1. Click **"Confirm signup"** template
2. **Replace the entire HTML content** with the contents of `email-templates/confirm-signup.html`
3. **Subject line**: `Welcome to M10 DJ Company - Confirm Your Account`
4. Click **Save**

#### B. Reset Password Template

1. Click **"Reset Password"** template
2. **Replace the entire HTML content** with the contents of `email-templates/reset-password.html`
3. **Subject line**: `Reset Your M10 DJ Company Password`
4. Click **Save**

#### C. Magic Link Template

1. Click **"Magic Link"** template
2. **Replace the entire HTML content** with the contents of `email-templates/magic-link.html`
3. **Subject line**: `Sign in to M10 DJ Company`
4. Click **Save**

### Step 3: Configure SMTP Settings (Optional but Recommended)

For production use, set up custom SMTP:

1. Go to **Authentication** → **Settings** 
2. Scroll to **SMTP Settings**
3. Configure with your email provider:
   - **Gmail**: Use Gmail SMTP
   - **SendGrid**: Professional email service
   - **AWS SES**: Cost-effective option

### Step 4: Update URLs for Production

When you deploy to production, update these URLs in all templates:

```html
<!-- Change this -->
<a href="http://localhost:3001">Visit Website</a>

<!-- To your production URL -->
<a href="https://m10djcompany.com">Visit Website</a>
```

## 🎯 Template Features

### ✅ Brand Consistency
- M10 DJ Company logo and colors
- Professional messaging
- Consistent footer with contact info

### ✅ Security & Trust
- Clear security notices
- Professional appearance builds trust
- Mobile-responsive design

### ✅ Call-to-Action Optimization
- Large, prominent buttons
- Alternative text links for accessibility
- Clear instructions

### ✅ Contact Information
- Phone: (901) 497-7001
- Email: djbenmurray@gmail.com
- Service areas mentioned

## 🧪 Testing Your Templates

### Test Signup Confirmation:
1. Create a new account with a test email
2. Check the email you receive
3. Verify the styling and links work

### Test Password Reset:
1. Go to signin page
2. Click "Forgot Password"
3. Enter your email
4. Check the reset email

### Test Magic Link:
1. Go to signin page
2. Use email signin (if enabled)
3. Check the magic link email

## 🔧 Customization Options

### Colors
Current brand colors:
- **Primary**: `#fcba00` (Gold)
- **Black**: `#000000`, `#1a1a1a`
- **White**: `#ffffff`
- **Text**: `#4a5568`, `#718096`

### Phone Number
Currently set to: `(901) 497-7001`
Update in all templates if this changes.

### Service Areas
Currently: "Memphis, TN & Surrounding Areas"
Update if you expand service areas.

## 📱 Mobile Optimization

All templates include:
- Responsive design for mobile devices
- Optimized button sizes for touch
- Readable fonts on small screens
- Proper viewport configuration

## 🚨 Important Notes

1. **Test thoroughly** before going live
2. **Keep templates updated** with current contact info
3. **Monitor email deliverability** after changes
4. **Have a backup plan** in case of issues

## 🎉 Result

Your customers will now receive:
- Professional, branded emails
- No mention of Supabase
- Beautiful design that matches your website
- Clear calls-to-action
- Mobile-friendly experience

This creates a seamless, professional experience that builds trust with your potential clients! 