# 🔧 SMS AI System Troubleshooting Guide

## Issues Fixed

### ✅ **AI Preview in Admin Notifications**
**NEW**: Admin notifications now include the AI's suggested response for easy copy/paste.

**What You'll See:**
```
📱 NEW TEXT MESSAGE

👤 From: (901) 555-1234
⏰ Time: Wed, Aug 14, 2:45 PM

💬 Message:
"Hi, I need a DJ for my wedding"

🤖 AI Suggests:
"Congratulations on your upcoming wedding! 🎵 I'd love to help make it unforgettable. What date are you planning?"

💡 Reply within 60s to override AI
📋 Or copy/paste AI response above
```

### ✅ **60-Second Delay Issues Fixed**
**Problem**: AI wasn't responding after 60 seconds due to serverless timeout issues.

**Solutions Implemented:**
1. **Multiple fallback mechanisms** for AI triggering
2. **Database tracking** of pending AI responses  
3. **Simple URL-based triggers** that work in serverless
4. **Admin override detection** before AI responds

## 🔍 **Troubleshooting Steps**

### **1. Check Environment Variables**
Ensure these are set in Vercel:
```env
OPENAI_API_KEY=sk-your-key-here
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
ADMIN_PHONE_NUMBER=your-admin-number
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
```

### **2. Test the Flow**
1. **Text your business number** from a different phone
2. **Check admin notification** - should include AI preview
3. **Wait 60 seconds** - AI should respond to customer
4. **Check completion notification** - admin gets notified when AI responds

### **3. Debug AI Response Issues**

#### **Check Vercel Function Logs:**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the failing function
3. Check logs for errors

#### **Common Issues & Fixes:**

**❌ "OpenAI API error: 401"**
- **Fix**: Check OPENAI_API_KEY is set correctly
- **Test**: `curl -H "Authorization: Bearer YOUR_KEY" https://api.openai.com/v1/models`

**❌ "Twilio not configured"**
- **Fix**: Verify all Twilio environment variables
- **Check**: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

**❌ "No admin phone configured"**
- **Fix**: Set ADMIN_PHONE_NUMBER environment variable
- **Format**: +19015551234 (E.164 format)

**❌ "Customer context not found"**
- **Check**: Database migration applied successfully
- **Fix**: Run both SQL migrations in Supabase

### **4. Manual AI Trigger (If Automatic Fails)**

If the 60-second delay isn't working, you can manually trigger AI responses:

#### **Method 1: Direct URL**
```
https://m10djcompany.com/api/sms/simple-delayed-ai?phone=%2B19015551234&message=Hello&messageId=SM123
```

#### **Method 2: Admin Dashboard**
1. Go to `/admin/ai-conversations`
2. View pending AI responses
3. Manually trigger delayed responses

#### **Method 3: Database Query**
Check pending AI responses:
```sql
SELECT * FROM pending_ai_responses 
WHERE status = 'pending' 
ORDER BY scheduled_for DESC;
```

## 🎯 **Expected Behavior**

### **Customer Experience:**
1. **Instant (0s)**: Auto-reply received
2. **60s later**: AI response with personalized content
3. **Ongoing**: Natural conversation with context

### **Admin Experience:**
1. **Instant**: Notification with AI preview
2. **60s window**: Can reply to override AI
3. **After AI**: Completion notification with conversation summary

## 🔧 **Advanced Troubleshooting**

### **Check AI Response Quality**
If AI responses are poor quality:

1. **Review system prompt** in `utils/chatgpt-sms-assistant.js`
2. **Check customer context** - is data loading correctly?
3. **Verify conversation history** - are previous messages included?

### **Check Serverless Function Timeouts**
Vercel functions timeout after 10 seconds by default:

1. **Monitor function duration** in Vercel dashboard
2. **Check for hanging API calls** (OpenAI, Twilio, Supabase)
3. **Implement proper error handling** with timeouts

### **Database Connection Issues**
If Supabase queries fail:

1. **Check RLS policies** - ensure service role has access
2. **Verify connection strings** in environment variables
3. **Test database connectivity** with simple queries

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track:**
- **AI Response Rate**: % of messages that get AI responses
- **Admin Override Rate**: % of times admin replies within 60s
- **Customer Satisfaction**: Response quality and engagement
- **Error Rate**: Failed AI generations or SMS sends

### **Log Analysis:**
Look for these patterns in Vercel logs:
```
✅ AI preview generated
✅ Enhanced admin SMS sent
✅ AI response scheduled
✅ Delayed AI triggered
✅ AI response sent successfully
```

## 🚨 **Emergency Fallbacks**

### **If AI System Completely Fails:**
1. **Auto-reply still works** - customers get immediate response
2. **Admin notifications work** - you still get notified
3. **Manual responses** - reply normally to take over

### **Disable AI for Specific Customer:**
```sql
UPDATE contacts 
SET custom_fields = '{"ai_disabled": true}'::jsonb
WHERE phone ILIKE '%5551234%';
```

### **Disable AI Globally:**
Set environment variable:
```env
AI_GLOBALLY_DISABLED=true
```

## 📞 **Support Checklist**

When reporting issues, provide:
- [ ] Customer phone number (last 4 digits)
- [ ] Timestamp of the message
- [ ] Expected vs actual behavior
- [ ] Vercel function logs
- [ ] Error messages from console

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ Admin gets instant notification with AI preview
- ✅ Customer gets AI response after 60 seconds
- ✅ AI responses are contextual and personalized
- ✅ Admin can override by replying within 60 seconds
- ✅ Conversation history is maintained across messages

The system is designed to be robust with multiple fallbacks, so even if one component fails, the core SMS functionality continues to work!
