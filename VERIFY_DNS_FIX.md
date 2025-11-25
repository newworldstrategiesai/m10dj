# ✅ Verify Your DNS Fix

## Step 1: Check Vercel DNS Record

In Vercel Dashboard → Domains → DNS Records, you should now see:

```
Name: @ (or empty)
Type: TXT
Value: v=spf1 include:resend.com include:amazonses.com ~all
```

**If you see this, you're good!** ✅

---

## Step 2: Wait for DNS Propagation

DNS changes can take:
- **Minimum**: 5-15 minutes
- **Maximum**: Up to 24 hours (rare)
- **Typical**: 10-30 minutes

**What to do**: Wait 10-15 minutes, then proceed to Step 3.

---

## Step 3: Verify in Resend Dashboard

1. Go to [Resend Domains](https://resend.com/domains)
2. Click on `m10djcompany.com`
3. Scroll to **"Enable Sending"** → **"SPF"** section
4. You should now see **TWO** SPF records:
   - ✅ One for `send` subdomain (existing - Amazon SES)
   - ✅ **NEW**: One for root domain (`@`) with `include:resend.com`
5. The new record should show **"Verified"** status ✅

**If you see "Verified"**: Your DNS fix is working! 🎉

---

## Step 4: Test Email Sending

1. Send a test email (password reset, magic link, etc.)
2. Check your inbox (not spam folder)
3. If it goes to inbox: **Success!** ✅
4. If still in spam: Wait 24-48 hours for email providers to update

---

## Step 5: Verify DNS Records Online (Optional)

You can verify the DNS record is live using these tools:

### Check SPF Record:
```bash
dig TXT m10djcompany.com | grep spf
```

Or use online tool:
- [MXToolbox SPF Check](https://mxtoolbox.com/spf.aspx)
- Enter: `m10djcompany.com`
- Should show: `v=spf1 include:resend.com include:amazonses.com ~all`

### Expected Output:
```
m10djcompany.com. 3600 IN TXT "v=spf1 include:resend.com include:amazonses.com ~all"
```

---

## Troubleshooting

### Issue: Resend still shows "Not Verified"

**Solutions:**
1. Wait longer (DNS can take up to 24 hours)
2. Check the record value is exactly: `v=spf1 include:resend.com include:amazonses.com ~all`
3. Make sure the record name is `@` (or empty) for root domain
4. Verify in Vercel that the record was saved correctly

### Issue: Still going to spam after 24 hours

**Additional steps:**
1. Update DMARC record (in Vercel):
   - Find `_dmarc` TXT record
   - Change to: `v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com`
2. Test with [Mail-Tester](https://www.mail-tester.com/):
   - Get test email address
   - Send email to it
   - Check score (aim for 10/10)
3. Check email headers:
   - In Gmail: Open email → Three dots → "Show original"
   - Look for: `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`

---

## Success Indicators

✅ SPF record shows in Resend dashboard  
✅ Status shows "Verified" in green  
✅ Test emails go to inbox (not spam)  
✅ Email headers show `SPF: PASS`

---

## Next Steps After Verification

Once DNS is verified:

1. ✅ **Update Supabase SMTP sender** to `hello@m10djcompany.com`
2. ✅ **Test all email types**:
   - Password reset
   - Magic link sign-in
   - Email confirmation
3. ✅ **Monitor for 1 week**:
   - Check bounce rates in Resend
   - Monitor spam complaints
   - Verify deliverability

---

**Status**: If Resend shows "Verified" ✅, you're all set!  
**Time to verify**: 10-15 minutes after adding DNS record

