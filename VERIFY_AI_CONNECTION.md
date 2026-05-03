# Verify AI Connection - Quick Guide

## ✅ You've Updated:
- ✅ GROQ_API_KEY in `.env.local` (for local development)
- ✅ GROQ_API_KEY in Vercel environment variables (for production)

## 🔍 How to Verify It's Working

### Option 1: Check Console Logs (Easiest)

1. **For Local Development:**
   - Restart your dev server: `npm run dev`
   - Open browser console (F12)
   - Navigate to CRM Dashboard
   - Look for these logs:
     ```
     🔧 GroqClient initialized: {
       hasApiKey: true,
       apiKeyLength: 56,
       apiKeyPrefix: "gsk_abc...",
       model: "llama-3.1-8b-instant"
     }
     ```
   - If `hasApiKey: true`, the key is loaded correctly!

2. **For Production:**
   - Check Vercel logs after redeploy
   - Look for the same `🔧 GroqClient initialized` log
   - Verify `hasApiKey: true`

### Option 2: Test API Endpoint

**Local:**
```bash
# Make sure you're logged in and have a token
curl http://localhost:3000/api/ai/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Production:**
```bash
curl https://your-domain.vercel.app/api/ai/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "groq": {
    "configured": true,
    "apiKeyLength": 56,
    "apiKeyPrefix": "gsk_abc...",
    "model": "llama-3.1-8b-instant",
    "testResult": "success",
    "response": "test"
  },
  ...
}
```

### Option 3: Check Smart Insights

1. Navigate to CRM Dashboard
2. Look for Smart Insights card
3. If AI is working, you should see AI-generated insights
4. Check browser console for:
   ```
   [AI Insights] Environment check: {
     hasGroqKey: true,
     groqKeyLength: 56,
     ...
   }
   ```

## 🐛 Troubleshooting

### If `hasApiKey: false`:

**Local:**
- ✅ Check `.env.local` file exists in project root
- ✅ Verify format: `GROQ_API_KEY=gsk_your_key_here` (no spaces, no quotes)
- ✅ Restart dev server after changes
- ✅ Check file isn't in `.gitignore` (it should be)

**Production:**
- ✅ Go to Vercel → Project → Settings → Environment Variables
- ✅ Verify `GROQ_API_KEY` is set for "Production" environment
- ✅ Check value doesn't have extra spaces or quotes
- ✅ **Redeploy** after adding/changing variables

### If `hasApiKey: true` but getting 401:

- ✅ Verify key starts with `gsk_` (Groq format)
- ✅ Check key is valid at https://console.groq.com
- ✅ Key might be expired - generate a new one
- ✅ Check for whitespace: key should be trimmed (we do this automatically now)

### If Still Not Working:

1. **Check the exact error in logs:**
   - Look for `❌ Groq API error response:` in console
   - This will show the exact error from Groq API

2. **Verify key format:**
   - Groq keys should be ~56 characters
   - Start with `gsk_`
   - No spaces or special characters at start/end

3. **Test key directly:**
   ```bash
   curl https://api.groq.com/openai/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_GROQ_API_KEY" \
     -d '{
       "model": "llama-3.1-8b-instant",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

## ✅ Success Indicators

You'll know it's working when:
- ✅ Console shows `hasApiKey: true`
- ✅ Smart Insights show AI-generated content (not just rule-based)
- ✅ No `401 Unauthorized` errors in logs
- ✅ Test endpoint returns `testResult: "success"`

## 📝 Next Steps

Once verified:
1. Smart Insights should now use AI instead of just rule-based
2. AI chat features will work
3. Other AI-powered features will be enabled

The system will automatically fall back to rule-based insights if AI fails, so your app will always work!
