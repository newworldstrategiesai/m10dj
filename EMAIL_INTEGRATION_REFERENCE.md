# Email Integration - Quick Reference Card

## 🚀 Quick Commands

### Setup
```bash
# Install dependencies
npm install googleapis

# Run migration
supabase db push

# Start dev server
npm run dev
```

### Access
- **Dashboard:** `http://localhost:3000/admin/email`
- **OAuth:** Click "Connect Gmail Account"
- **Sync:** Click "Sync Now" button

---

## 📋 Environment Variables
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/email/auth/google` | GET | Start OAuth |
| `/api/email/auth/callback` | GET | OAuth callback |
| `/api/email/sync` | POST | Sync emails |
| `/api/email/send` | POST | Send email |
| `/api/email/webhook` | POST | Real-time updates |
| `/api/email/disconnect` | POST | Disconnect |

---

## 💾 Database Tables

| Table | Purpose |
|-------|---------|
| `email_messages` | All emails |
| `email_attachments` | Attachments |
| `email_sync_log` | Sync history |
| `email_oauth_tokens` | OAuth tokens |

---

## 🔍 Lead Detection Keywords

Automatically detected:
- book, booking, available, availability
- price, pricing, cost, quote
- wedding, event, party, dj
- interested, inquiry, contact
- information, details, packages

---

## 🛠️ Common Queries

### Recent Emails
```sql
SELECT * FROM email_messages 
ORDER BY timestamp DESC LIMIT 20;
```

### Lead Stats
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_lead_inquiry) as leads,
  COUNT(*) FILTER (WHERE contact_id IS NOT NULL) as converted
FROM email_messages;
```

### Sync History
```sql
SELECT * FROM email_sync_log 
ORDER BY started_at DESC LIMIT 10;
```

---

## 📖 Documentation Files

1. **EMAIL_QUICKSTART.md** - 15-min setup
2. **EMAIL_INTEGRATION_SETUP.md** - Complete guide
3. **EMAIL_INTEGRATION_SUMMARY.md** - What was built
4. **EMAIL_INTEGRATION_REFERENCE.md** - This file

---

## 🆘 Troubleshooting

### Not connected?
1. Check environment variables
2. Verify OAuth redirect URI
3. Try reconnecting

### No emails syncing?
1. Check last 7 days window
2. Verify INBOX label
3. Check sync logs

### "Unverified app" warning?
- Click "Advanced" → "Continue"
- Normal during development
- Submit for verification in production

---

## 🎯 Next Steps

1. ✅ Dependencies installed
2. ⬜ Google Cloud setup
3. ⬜ Environment variables
4. ⬜ Run migration
5. ⬜ Connect & test

---

## 🌐 Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Gmail API Docs](https://developers.google.com/gmail/api)
- [OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

---

**Ready to launch!** 🚀

