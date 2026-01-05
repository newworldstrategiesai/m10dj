# Stripe Price IDs - Configured

**Date**: January 2025  
**Status**: ✅ Products created in Stripe

---

## 📋 Stripe Price IDs

### Free Forever
- **Price ID**: `price_1Sm2NcEJct0cvYrGASesY7rC`
- **Price**: $0.00/month
- **Environment Variable**: `TIPJAR_STARTER_PRICE_ID`

### Pro
- **Price ID**: `price_1Sm2OJEJct0cvYrGS0S66bat`
- **Price**: $29.00/month
- **Environment Variable**: `TIPJAR_PROFESSIONAL_PRICE_ID`

### Embed Pro
- **Price ID**: `price_1Sm2P9EJct0cvYrGws3YPG2o`
- **Price**: $49.00/month
- **Environment Variable**: `TIPJAR_ENTERPRISE_PRICE_ID`

---

## 🔑 Environment Variables to Set

### In Vercel (Production)

Go to: [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

**Server-Side (Private) Variables:**
```bash
TIPJAR_STARTER_PRICE_ID=price_1Sm2NcEJct0cvYrGASesY7rC
TIPJAR_PROFESSIONAL_PRICE_ID=price_1Sm2OJEJct0cvYrGS0S66bat
TIPJAR_ENTERPRISE_PRICE_ID=price_1Sm2P9EJct0cvYrGws3YPG2o
```

**Client-Side (Public) Variables:**
```bash
NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_1Sm2NcEJct0cvYrGASesY7rC
NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_1Sm2OJEJct0cvYrGS0S66bat
NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_1Sm2P9EJct0cvYrGws3YPG2o
```

---

### In Local Development (.env.local)

Create or edit `.env.local` in your project root:

```bash
# TipJar Price IDs (Server-side - Private)
TIPJAR_STARTER_PRICE_ID=price_1Sm2NcEJct0cvYrGASesY7rC
TIPJAR_PROFESSIONAL_PRICE_ID=price_1Sm2OJEJct0cvYrGS0S66bat
TIPJAR_ENTERPRISE_PRICE_ID=price_1Sm2P9EJct0cvYrGws3YPG2o

# TipJar Price IDs (Client-side - Public)
NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID=price_1Sm2NcEJct0cvYrGASesY7rC
NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID=price_1Sm2OJEJct0cvYrGS0S66bat
NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID=price_1Sm2P9EJct0cvYrGws3YPG2o
```

**Important**: After adding these to `.env.local`, **restart your development server**.

---

## ✅ Verification Checklist

- [x] Products created in Stripe Dashboard
- [x] Price IDs obtained
- [ ] Environment variables set in Vercel (Production)
- [ ] Environment variables set in `.env.local` (Local Development)
- [ ] Development server restarted (if testing locally)
- [ ] Test subscription flow end-to-end

---

## 🧪 Next Steps

1. **Set environment variables** in Vercel and `.env.local` (see above)
2. **Implement subscription webhook handlers** (next task)
3. **Test subscription creation flow**
4. **Test subscription webhook processing**

---

**Status**: Ready to set environment variables! 🚀

