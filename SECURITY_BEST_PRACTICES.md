# Security Best Practices

## 🔒 Secrets Management

### ✅ What IS Protected

- `.env.local` - Actual environment variables (Git ignored)
- `.env` - Environment configuration (Git ignored)
- `.env.vercel` - Vercel-specific config (Git ignored)
- `.env.*.local` - Any local environment files (Git ignored)

### 📝 What IS Committed (Safe)

- `.env.example` - Template with placeholder values
- `.env.local.example` - Example configuration
- Documentation files (`.md`) with `your_...` placeholders
- Source code files without embedded secrets

### 🚫 What Should NEVER Be Committed

- OpenAI API keys (starts with `sk-proj-`)
- Supabase service role keys
- Twilio account SIDs/auth tokens
- Database passwords
- OAuth tokens
- JWT secrets
- API keys in `.js` or `.ts` files

---

## 🛡️ Current Security Status

### Repository Protection

- ✅ GitHub Push Protection enabled
- ✅ Secret Scanning enabled
- ✅ `.gitignore` properly configured
- ✅ All `*.local` files ignored
- ✅ No leaked credentials in history

### File Verification

All 611 tracked files have been verified:
- ✅ No API keys in documentation
- ✅ No credentials in source code
- ✅ All examples use placeholders
- ✅ Environment files properly excluded

---

## 📋 Before Committing

### Checklist

1. **Never hardcode secrets:**
   ```javascript
   // ❌ BAD
   const API_KEY = 'sk-proj-xyz123';
   
   // ✅ GOOD
   const API_KEY = process.env.OPENAI_API_KEY;
   ```

2. **Always use environment variables:**
   ```javascript
   // ✅ GOOD
   const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
   ```

3. **Use `.env.local` for local development:**
   ```bash
   # .env.local (git ignored)
   OPENAI_API_KEY=your_actual_key_here
   TWILIO_AUTH_TOKEN=your_token_here
   ```

4. **Use `.env.example` for documentation:**
   ```bash
   # .env.example (committed, safe)
   OPENAI_API_KEY=your_api_key_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   ```

---

## 🔄 Environment Variables in Use

### Required (Production)
- `OPENAI_API_KEY` - OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
- `TWILIO_ACCOUNT_SID` - Twilio account ID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio sender phone number

### Optional (Enhancements)
- `ADMIN_EMAIL` - Primary admin email
- `BACKUP_ADMIN_EMAIL` - Backup admin email
- `EMERGENCY_CONTACT_EMAIL` - Emergency contact email
- `ADMIN_PHONE` - Admin phone for SMS alerts
- `RESEND_API_KEY` - Resend email service key
- `RESEND_WEBHOOK_SECRET` - Resend webhook signature verification

### Public (Safe to Commit)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key (read-only)
- `NEXT_PUBLIC_*` - Any variable prefixed with `NEXT_PUBLIC_`

---

## 🚀 Deployment

### GitHub Actions

```yaml
# ✅ GOOD: Secrets injected at runtime
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Vercel

1. Go to Vercel project settings
2. Add environment variables in `Settings` → `Environment Variables`
3. Mark as `Encrypted` for sensitive values
4. **Never** hardcode in `vercel.json` or `.env` files

### Supabase

1. Secrets stored in project settings
2. Never expose `service_role_key` to frontend
3. Use Row-Level Security (RLS) for data protection
4. Rotate keys periodically

---

## 🔍 Scanning for Leaks

### Local Scan
```bash
# Check for common patterns
grep -r "sk-proj-\|sk_\|AKIA\|password\s*=" --include="*.js" --include="*.ts" .

# Use git-secrets (if installed)
git secrets --scan
```

### Before Pushing
```bash
# View what will be pushed
git diff origin/main

# Check commit contents
git show HEAD
```

---

## 🎯 Quick Reference

| What | Where | Commit? | Example |
|------|-------|---------|---------|
| API Keys | `.env.local` | ❌ No | `OPENAI_API_KEY=sk-...` |
| Passwords | `.env` | ❌ No | `DB_PASSWORD=xyz` |
| Examples | `.env.example` | ✅ Yes | `OPENAI_API_KEY=your_key_here` |
| Public Keys | Code | ✅ Yes | `NEXT_PUBLIC_KEY=...` |
| Docs | `.md` files | ✅ Yes | `your_api_key_here` |

---

## 📚 Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase Security](https://supabase.com/docs/learn/auth-deep-dive/auth-security)
- [OWASP Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)

---

**Last Updated:** November 2025  
**Status:** ✅ All security measures in place

