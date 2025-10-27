# 🎨 Client Logo Carousel Setup Guide

## 📍 **WHERE THE CAROUSELS APPEAR**

Your site now has **3 different logo carousels** tailored to each page's content:

### **1. Homepage** - "General" Logo Set
- **Location:** Between services and contact form
- **Logos Shown:** Mix of wedding venues, corporate clients, and organizations
- **Title:** "Trusted by Memphis's Premier Organizations"
- **Purpose:** Show breadth of services to all visitors

### **2. Wedding DJ Page** - "Wedding" Logo Set
- **Location:** Before contact section
- **Logos Shown:** Wedding venues only (Peabody, Botanic Garden, Dixon Gallery, etc.)
- **Title:** "Trusted at Memphis's Premier Wedding Venues"
- **Purpose:** Build trust with wedding couples

### **3. Corporate Events Page** - "Corporate" Logo Set
- **Location:** After venues section
- **Logos Shown:** Corporate clients (FedEx, AutoZone, St. Jude, etc.)
- **Title:** "Trusted by Memphis's Leading Businesses"
- **Purpose:** Build credibility with business decision-makers

---

## 🖼️ **LOGO SETS DEFINED**

### **Wedding Logos (10 venues):**
1. The Peabody Hotel
2. Memphis Botanic Garden
3. Dixon Gallery & Gardens
4. The Columns
5. Graceland Chapel
6. Annesdale Mansion
7. Memphis Hunt & Country Club
8. Lichterman Nature Center
9. Historic Elmwood Cemetery
10. AutoZone Park

### **Corporate Logos (10 organizations):**
1. FedEx
2. International Paper
3. AutoZone
4. Memphis Cook Convention Center
5. The Peabody Hotel
6. Crosstown Concourse
7. FedExForum
8. Memphis Grizzlies
9. St. Jude
10. University of Memphis

### **General Logos (10 mixed):**
1. The Peabody Hotel
2. FedEx
3. Memphis Botanic Garden
4. AutoZone
5. Dixon Gallery & Gardens
6. Memphis Cook Convention Center
7. Graceland
8. Memphis Grizzlies
9. St. Jude
10. University of Memphis

---

## 📂 **HOW TO ADD YOUR REAL LOGOS**

### **Step 1: Prepare Your Logo Files**

**Recommended Format:**
- **Size:** 200px wide × 100px tall (or maintain 2:1 aspect ratio)
- **Format:** PNG with transparent background
- **Color:** Grayscale or monochrome (component will apply grayscale filter)
- **Quality:** High resolution (2x for retina displays)

**Example File Names:**
```
peabody-hotel.png
botanic-garden.png
dixon-gallery.png
fedex.png
autozone.png
st-jude.png
```

### **Step 2: Upload Logos to Your Project**

Create a folder and upload your logo files:

```bash
mkdir -p /Users/benmurray/m10dj/public/assets/client-logos
# Then add your logo PNG files to this folder
```

**Folder Structure:**
```
/public/assets/client-logos/
  ├── peabody-hotel.png
  ├── botanic-garden.png
  ├── dixon-gallery.png
  ├── fedex.png
  ├── autozone.png
  ├── st-jude.png
  └── ...
```

### **Step 3: Update the Component to Use Real Logos**

Once you upload your logo files, the component is **already configured** to use them! The logos will automatically load from `/assets/client-logos/[filename]`.

**Current Code (Placeholder):**
```javascript
<div className="w-full h-full bg-white rounded-lg shadow-sm border">
  <span className="text-xs text-gray-500">{logo.name}</span>
</div>
```

**Uncomment the Real Logo Code:**

In `components/company/ClientLogoCarousel.js` around line 100-110, **replace the placeholder div** with:

```javascript
<img
  src={`/assets/client-logos/${logo.file}`}
  alt={`${logo.name} logo`}
  className="max-w-full max-h-full object-contain"
/>
```

---

## 🎨 **LOGO DESIGN TIPS**

### **Best Practices:**

1. **Grayscale or Monochrome**
   - Component applies grayscale filter by default
   - Color appears on hover for interactivity
   - Ensures consistent look across all brands

2. **Transparent Background**
   - PNG format with transparency
   - Looks clean against any background color
   - Professional appearance

3. **Proper Sizing**
   - 200×100px recommended
   - Maintains 2:1 aspect ratio
   - Scales well on mobile and desktop

4. **High Quality**
   - Use vector logos converted to PNG when possible
   - 2x resolution for retina displays (400×200px actual)
   - Sharp, crisp edges

### **Where to Get Logos:**

1. **Client Websites:** Download from their media/press kit pages
2. **Brands of the World:** https://brandsoftheworld.com
3. **Client Contacts:** Request official logo files
4. **Venue Websites:** Most have downloadable logos

---

## 🔧 **CUSTOMIZATION OPTIONS**

### **Add More Logos to a Set:**

Edit `components/company/ClientLogoCarousel.js`:

```javascript
wedding: [
  { name: 'Your New Venue', file: 'new-venue.png', category: 'venue' },
  // ... existing logos
],
```

### **Change Animation Speed:**

In `ClientLogoCarousel.js`, modify the CSS animation:

```javascript
// Current: 40 seconds
animation: scroll-left 40s linear infinite;

// Faster (30 seconds):
animation: scroll-left 30s linear infinite;

// Slower (60 seconds):
animation: scroll-left 60s linear infinite;
```

### **Change Number of Visible Logos:**

Adjust the logo width in the carousel div:

```javascript
// Current: w-40 (160px)
className="flex-shrink-0 w-40 h-20"

// Larger logos: w-48 (192px)
className="flex-shrink-0 w-48 h-24"

// Smaller logos: w-32 (128px)
className="flex-shrink-0 w-32 h-16"
```

### **Add a New Logo Set:**

In `components/company/ClientLogoCarousel.js`:

```javascript
const logoSets = {
  wedding: [...],
  corporate: [...],
  general: [...],
  // Add new set:
  privateParties: [
    { name: 'Client 1', file: 'client1.png', category: 'venue' },
    { name: 'Client 2', file: 'client2.png', category: 'venue' },
  ]
};
```

Then use it on a page:

```javascript
<ClientLogoCarousel 
  logoSet="privateParties"
  title="Private Party Clients"
  subtitle="Your subtitle here"
/>
```

---

## ✅ **VERIFICATION CHECKLIST**

Once you've added your logos:

- [ ] Create `/public/assets/client-logos/` folder
- [ ] Upload all logo PNG files
- [ ] Verify file names match the `file` values in `logoSets`
- [ ] Uncomment the `<img>` tag in `ClientLogoCarousel.js`
- [ ] Test on local development server
- [ ] Verify logos appear on homepage
- [ ] Verify wedding venues on `/memphis-wedding-dj`
- [ ] Verify corporate clients on `/corporate-events`
- [ ] Check mobile responsiveness
- [ ] Deploy to production

---

## 🎬 **ANIMATION FEATURES**

### **Current Features:**

✅ **Infinite Seamless Scroll** - Logos duplicate for endless loop  
✅ **Left-to-Right Animation** - Smooth 40-second cycle  
✅ **Pause on Hover** - Users can view specific logos  
✅ **Grayscale to Color Hover** - Interactive logo reveal  
✅ **Fade Edges** - Gradient overlays for polished look  
✅ **Responsive Speed** - Adjusts for mobile (30s) and large screens (50s)  

---

## 📱 **RESPONSIVE BEHAVIOR**

### **Mobile (< 768px):**
- Faster animation (30 seconds)
- Smaller gap between logos
- 2-3 logos visible at once

### **Tablet (768px - 1536px):**
- Standard animation (40 seconds)
- Medium gap between logos
- 3-4 logos visible at once

### **Desktop (> 1536px):**
- Slower animation (50 seconds)
- Larger gap between logos
- 5-6 logos visible at once

---

## 🆘 **TROUBLESHOOTING**

### **Logos Not Appearing:**
1. Check folder path: `/public/assets/client-logos/`
2. Verify file names match exactly (case-sensitive)
3. Ensure PNG format with correct extension
4. Check browser console for 404 errors

### **Animation Not Smooth:**
1. Ensure duplicate logo array is working
2. Check CSS animation in browser DevTools
3. Try refreshing browser cache (Cmd+Shift+R)

### **Logos Too Large/Small:**
1. Adjust container width class (`w-40`, `w-48`, etc.)
2. Check logo file dimensions (should be ~200×100px)
3. Modify `max-w-full max-h-full` classes

### **Wrong Logos on Wrong Pages:**
1. Verify `logoSet` prop on each page component
2. Check `logoSets` object in `ClientLogoCarousel.js`
3. Ensure logo file names in set match actual files

---

## 🚀 **DEPLOYMENT**

After adding your logos:

```bash
cd /Users/benmurray/m10dj
git add public/assets/client-logos/
git add components/company/ClientLogoCarousel.js
git commit -m "Add real client logos to carousel"
git push origin main
```

Vercel will auto-deploy in ~2-3 minutes.

---

## 📊 **CURRENT STATUS**

✅ Component created and deployed  
✅ 3 contextual logo sets configured  
✅ Strategic placement on 3 key pages  
✅ Infinite scroll animation working  
✅ Responsive design implemented  
⏳ **Next:** Add your real client logo files  

**Last Updated:** January 27, 2025  
**Component:** `/components/company/ClientLogoCarousel.js`  
**Pages Using:** Homepage, Wedding DJ, Corporate Events

