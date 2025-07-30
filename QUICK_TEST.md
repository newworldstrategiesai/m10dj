# Quick Test Guide - Admin System

## 🧪 **Testing Your Admin Backend System**

Let's get everything working step by step:

---

## **Step 1: Create Your First Admin User**

### Option A: Create Admin User via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Users**
3. **Click "Add User"**
4. **Fill in the form:**
   - Email: `your-email@domain.com` (use your real email)
   - Password: Create a temporary password
   - ✅ **Check "Auto Confirm User"** (important!)

5. **After creating the user, note down the User ID**

6. **Go to SQL Editor and run this to add them to admin_users:**
   ```sql
   INSERT INTO admin_users (user_id, email, full_name, role, is_active)
   VALUES (
     'USER_ID_FROM_STEP_5',  -- Replace with actual user ID
     'your-email@domain.com', -- Same email as above
     'Your Full Name',        -- Your name
     'admin',                 -- Role
     true                     -- Active
   );
   ```

### Option B: Quick SQL Creation (Alternative)

Run this in your Supabase SQL Editor (replace with your details):

```sql
-- First create the auth user
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'your-email@domain.com',  -- Replace with your email
  crypt('your-password', gen_salt('bf')),  -- Replace with your password
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Your Name"}'::jsonb  -- Replace with your name
) RETURNING id;

-- Then add to admin_users (use the ID from above)
INSERT INTO admin_users (user_id, email, full_name, role, is_active)
VALUES (
  'USER_ID_FROM_ABOVE',    -- Use the ID returned above
  'your-email@domain.com', -- Same email
  'Your Full Name',        -- Your name
  'admin',
  true
);
```

---

## **Step 2: Update Admin Email List**

Edit `utils/auth-helpers/admin.ts` and add your email:

```typescript
const adminEmails = [
  'your-email@domain.com',  // Add your actual email here
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
];
```

---

## **Step 3: Test the Contact Form**

1. **Start your dev server:** `npm run dev`
2. **Go to:** `http://localhost:3000` (or the port shown)
3. **Scroll down to the contact form**
4. **Fill out and submit the form**
5. **You should see a success message**

**If it fails:** Check browser console for errors and verify your environment variables are set.

---

## **Step 4: Test Admin Login**

1. **Go to:** `http://localhost:3000/admin/dashboard`
2. **It should redirect you to sign in**
3. **Sign in with the admin email/password you created**
4. **You should see the admin dashboard**
5. **Check if your contact form submission appears in the table**

---

## **Step 5: Test Status Updates**

1. **In the admin dashboard, find your test submission**
2. **Use the dropdown to change status from "new" to "contacted"**
3. **The status should update immediately**

---

## **🚨 Troubleshooting**

### **Contact Form Issues:**
- Check browser console for JavaScript errors
- Verify `/api/contact` endpoint is working
- Check environment variables (Supabase URL, keys)

### **Admin Access Issues:**
- Make sure your email is in the `adminEmails` array
- Verify the user exists in both `auth.users` AND `admin_users` tables
- Check that you're signed in with the correct email

### **Database Connection Issues:**
- Verify Supabase environment variables
- Check if tables were created properly
- Verify Row Level Security policies

### **Quick Fixes:**

```bash
# Clear Next.js cache
rm -rf .next && npm run dev

# Check if tables exist
# Run in Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contact_submissions', 'admin_users');
```

---

## **✅ Success Checklist**

- [ ] Admin user created in both `auth.users` and `admin_users`
- [ ] Email added to `adminEmails` array
- [ ] Contact form submits successfully
- [ ] Admin dashboard accessible
- [ ] Submissions visible in admin dashboard
- [ ] Status updates work
- [ ] No console errors

---

## **🎯 What You Should See**

### **Working Contact Form:**
- Form submits without errors
- Success message displays
- Data saved to database

### **Working Admin Dashboard:**
- Clean, modern interface
- Analytics cards showing data
- Submissions table with your test data
- Status dropdown working
- No authentication errors

---

## **Next Steps After Testing:**

1. **Customize admin emails** in `utils/auth-helpers/admin.ts`
2. **Set up email notifications** (Resend API key)
3. **Add more test data** for testimonials, FAQs
4. **Deploy to production** with proper environment variables

Your admin system is now fully operational! 🎉 