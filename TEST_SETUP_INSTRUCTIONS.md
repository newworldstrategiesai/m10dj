# AI Assistant Testing - Setup Instructions

## 🔑 Add OpenAI API Key to .env.local

Since `.env.local` is protected by `.cursorignore`, you need to add this manually:

1. Open `.env.local` in your editor
2. Add this line:

```env
OPENAI_API_KEY=your_api_key_here
```

3. Save the file

## 🗄️ Set Up Supabase Database

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Copy the content from: `supabase/migrations/20250115000000_create_sms_conversations.sql`
4. Paste into SQL editor
5. Click "Run"

You should see success message: "Query returned successfully"

## ✅ Verify Environment

Run the test suite to verify everything is set up:

```bash
cd /Users/benmurray/m10dj
npm run dev  # Start dev server in another terminal first
node scripts/test-ai-assistant.js
```

## 📋 Test Suite Checklist

The test suite checks:

- ✅ Web Chat API endpoints
- ✅ SMS API endpoints  
- ✅ Error handling
- ✅ Component imports
- ✅ CSS animations
- ✅ Database schema
- ✅ Configuration files
- ✅ Response quality

## 🎯 Next Steps

1. Add OpenAI key to `.env.local`
2. Run the migration in Supabase
3. Start dev server: `npm run dev`
4. Run tests: `node scripts/test-ai-assistant.js`
5. Check `test-results.json` for detailed results

