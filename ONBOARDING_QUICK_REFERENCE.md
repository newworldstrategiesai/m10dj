# 🎯 Onboarding Quick Reference

## For DJs: What They Get

### 1. **Dedicated URL**
- **Format**: `yourplatform.com/{their-slug}/requests`
- **Example**: `yourplatform.com/m10dj/requests`
- **Use Case**: Share on social media, email, print on flyers

### 2. **Embed Code**
- **Format**: Copy-paste iframe code
- **Use Case**: Add to their website (WordPress, Wix, etc.)
- **Customizable**: Theme, height, border radius

### 3. **QR Codes**
- **Generated in**: Admin dashboard
- **Use Case**: Print for events, display on screen
- **Links to**: Their dedicated URL or event-specific page

---

## Onboarding Flow

```
Sign Up
  ↓
Create Organization (auto-generated slug)
  ↓
Welcome Page (/onboarding/welcome)
  ├─ Shows dedicated URL
  ├─ Shows embed code generator
  └─ Quick action buttons
  ↓
Select Plan (/onboarding/select-plan)
  ├─ Starter: $19/month
  ├─ Professional: $49/month ⭐
  └─ Enterprise: $149/month
  ↓
Stripe Checkout (if selecting paid plan)
  ↓
Success Page (/onboarding/success)
  ↓
Dashboard (/admin/crowd-requests)
```

---

## Embed Code Examples

### Standard
```html
<iframe 
  src="https://yourplatform.com/m10dj/embed/requests"
  width="100%" 
  height="800" 
  frameborder="0"
></iframe>
```

### Responsive (Recommended)
```html
<div style="position: relative; padding-bottom: 100%; height: 0; overflow: hidden;">
  <iframe 
    src="https://yourplatform.com/m10dj/embed/requests"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
  ></iframe>
</div>
```

---

## URL Structure

| URL | Purpose | Who Sees It |
|-----|---------|-------------|
| `/{slug}/requests` | Public request page | Event attendees |
| `/{slug}/embed/requests` | Embed version | Embedded in DJ's website |
| `/{slug}/admin` | Admin dashboard | DJ only |
| `/{slug}/event/{code}` | Event-specific page | Event attendees |

---

## Key Features

✅ **No coding required** - Just copy/paste  
✅ **Works on any website** - WordPress, Wix, Squarespace, custom  
✅ **Mobile responsive** - Works on all devices  
✅ **Customizable** - Theme, height, styling  
✅ **Professional** - Looks like part of their site  

---

## Support Resources

- **Embed Code Generator**: Available in admin dashboard
- **URLs**: Shown on welcome page and in admin
- **QR Codes**: Generated in admin dashboard
- **Documentation**: Coming soon

---

This onboarding experience gives DJs everything they need to start accepting requests immediately! 🚀

