# 📧 Gmail OAuth Setup Guide

This guide will help you connect your Gmail account to send emails directly from your Gmail address instead of using Resend.

## 🎯 What This Does

- Allows you to send emails from your personal Gmail account
- Emails appear to come from your Gmail address (e.g., `djbenmurray@gmail.com`)
- Automatically refreshes tokens when they expire
- Falls back to Resend if Gmail is not connected

## 📋 Prerequisites

1. A Google Cloud Project
2. Gmail API enabled
3. OAuth 2.0 credentials configured

## 🚀 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name for later

### Step 2: Enable Gmail API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on **Gmail API** and click **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for personal use) or **Internal** (for Google Workspace)
   - App name: **M10 DJ Company** (or your preferred name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Add `https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`
   - Click **Save and Continue**
   - Test users: Add your Gmail address if using External type
   - Click **Save and Continue**
4. Application type: **Web application**
5. Name: **M10 DJ Company Email Sender**
6. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/admin/gmail/callback`
   - Production: `https://m10djcompany.com/api/admin/gmail/callback`
   - (Replace with your actual domain)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REDIRECT_URI=https://m10djcompany.com/api/admin/gmail/callback
GMAIL_ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here
```

**Important**: Generate a secure encryption key for `GMAIL_ENCRYPTION_KEY`:

```bash
# Generate a 32-byte (256-bit) hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `GMAIL_ENCRYPTION_KEY`.

### Step 5: Run Database Migration

Run the migration to add Gmail OAuth fields to the organizations table:

```bash
npm run supabase:push
```

Or if using Supabase CLI directly:

```bash
supabase db push
```

### Step 6: Connect Gmail in Admin Panel

1. Go to any contact page in the admin panel
2. Click **Request Review** (or any email action button)
3. In the email modal, you'll see a **Connect Gmail** button next to the "To" field
4. Click **Connect Gmail**
5. You'll be redirected to Google to authorize the app
6. Select your Gmail account and grant permissions
7. You'll be redirected back to the admin panel

### Step 7: Verify Connection

After connecting:
- The email modal will show "Sending from [your-email@gmail.com]"
- A green checkmark indicates Gmail is connected
- You can disconnect Gmail at any time using the **Disconnect** button

## 🔒 Security Notes

1. **Encryption Key**: The `GMAIL_ENCRYPTION_KEY` is critical for security. Store it securely and never commit it to version control.

2. **Token Storage**: Gmail tokens are encrypted before being stored in the database.

3. **Token Refresh**: The system automatically refreshes expired tokens using the refresh token.

4. **Fallback**: If Gmail connection fails, the system falls back to Resend automatically.

## 🧪 Testing

1. Connect Gmail using the steps above
2. Send a test email to yourself
3. Verify the email arrives from your Gmail address
4. Check the email headers to confirm it's sent via Gmail

## 🔧 Troubleshooting

### "Gmail OAuth not configured" Error

- Verify `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` are set in `.env.local`
- Restart your development server after adding environment variables

### "Failed to decrypt access token" Error

- Verify `GMAIL_ENCRYPTION_KEY` is set correctly
- The key must be a 64-character hex string (32 bytes)
- If you change the encryption key, you'll need to reconnect Gmail

### "Refresh token not available" Error

- Disconnect and reconnect Gmail
- Make sure you grant all requested permissions during OAuth

### Redirect URI Mismatch

- Verify the redirect URI in Google Cloud Console matches exactly:
  - Development: `http://localhost:3000/api/admin/gmail/callback`
  - Production: `https://yourdomain.com/api/admin/gmail/callback`
- The URI must match exactly (including http vs https, trailing slashes, etc.)

### Gmail Not Sending

- Check that Gmail API is enabled in Google Cloud Console
- Verify OAuth consent screen is configured
- Check that your Gmail account has "Less secure app access" enabled (if required)
- For Google Workspace accounts, admin may need to approve the app

## 📝 Notes

- **Token Expiry**: Access tokens expire after 1 hour. The system automatically refreshes them.
- **Refresh Tokens**: Refresh tokens don't expire unless revoked. They're stored securely in the database.
- **Multiple Organizations**: Each organization can have its own Gmail connection.
- **Switching Providers**: You can switch between Gmail and Resend at any time by connecting/disconnecting Gmail.

## 🎉 Success!

Once connected, all emails sent from the admin panel will be sent from your Gmail account. The system will automatically:
- Use Gmail when connected
- Fall back to Resend when Gmail is not connected
- Refresh tokens when they expire
- Handle errors gracefully

