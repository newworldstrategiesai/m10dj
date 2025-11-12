# Quick Test: Service Selection Form

## 🎯 One-Minute Test

1. **Get Link:** Send yourself a test lead form email
2. **Click:** Open the service selection link from your email
3. **Select Package:** Choose any package (e.g., Package 2)
4. **Submit:** Click "Submit Selections & Get Quote"
5. **Verify:** 
   - ✅ See "Thank You" success screen
   - ✅ See green checkmark icon
   - ✅ See your package details
   - ✅ See "What Happens Next" section

---

## 🔍 What You Should See

### Before Clicking Submit
```
Form with:
- Event details (pre-filled from email)
- Package selection boxes
- Add-ons checkboxes
- Music preferences field
- Special requests field
- Blue "Submit Selections & Get Quote" button
```

### While Submitting (1-3 seconds)
```
Button shows:
🔄 Submitting...
(Button is disabled, you can't click again)
```

### After Success (3-5 seconds)
```
✅ Thank You, [Your Name]!
Your service selections have been received 🎉

[Green checkmark box]

Your Selections
- Package: [Selected package name]
- Price: $2,500
- Features listed
- Add-ons listed (if any)

Invoice Created
- Total: $2,500

What Happens Next:
1. We'll review your selections
2. Prepare a custom quote
3. Reach out within 24 hours

[Call Us] [Visit Website]
```

---

## ⚠️ If You See an Error

Red box appears with:
```
❌ Something went wrong
[Error message]
Please try again or call (901) 410-2020
```

**Solution:**
1. Try submitting again
2. Make sure a package is selected
3. Try a different browser/device
4. Call support if it persists

---

## 🚀 Testing Checklist

- [ ] Form loads successfully
- [ ] Fields are pre-filled with event details
- [ ] Can select a package
- [ ] Submit button clicks
- [ ] Submitting state shows spinner
- [ ] Success screen appears within 5 seconds
- [ ] Success screen shows correct package info
- [ ] All sections visible (selections, invoice, what's next)
- [ ] Can click "Call Us" button
- [ ] Can click "Visit Website" button
- [ ] No JavaScript errors (check F12 console)

---

## 📧 Post-Submission Checklist

After submitting, verify:
- [ ] Confirmation email received within 1 minute
- [ ] Contact appears in admin panel
- [ ] Contact has "Qualified" status
- [ ] Invoice was created
- [ ] Contract was generated (if applicable)

---

## 🐛 Debugging Tips

**If something goes wrong:**

1. **Open DevTools:** Press F12
2. **Go to Console tab:** Look for error messages
3. **Go to Network tab:** Click "Submit" again, look for red X on `/api/service-selection/submit`
4. **Screenshot everything** and send to support

---

## 🆘 Quick Fixes

| Problem | Fix |
|---------|-----|
| Button won't click | Refresh page, try again |
| Error message appears | Check error text, call if persists |
| Success screen not visible | Scroll to top of page |
| Form doesn't load | Check email link validity |
| No confirmation email | Check spam folder |

---

**Status:** ✅ Ready for Testing  
**Deployment:** Production  
**Last Updated:** Today


