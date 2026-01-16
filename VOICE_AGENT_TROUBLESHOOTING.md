# Voice Agent - Troubleshooting Guide

## 🔧 Quick Fix Checklist

### Step 1: Regenerate Prisma Client
**This is the most common issue!**

1. **Stop your dev server** (Press `Ctrl+C` in the terminal)
2. **Run Prisma generate:**
   ```bash
   npx prisma generate
   ```
3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Step 2: Verify Database Connection
Check if your `.env` file has `DATABASE_URL`:
```bash
DATABASE_URL="postgresql://..."
```

### Step 3: Check Prisma Schema
Verify the `VoiceAgent` model exists in `prisma/schema.prisma`:
```prisma
model VoiceAgent {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  // ... other fields
}
```

### Step 4: Test the API Directly

**Option A: Using Browser Console**
1. Open browser console (F12)
2. Go to Network tab
3. Try creating an agent
4. Check the API request/response

**Option B: Using curl (if you have token)**
```bash
curl -X POST http://localhost:3000/api/v1/voice-agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Agent",
    "language": "en",
    "systemPrompt": "You are a helpful assistant"
  }'
```

## 🐛 Common Errors & Solutions

### Error: "Cannot read properties of undefined (reading 'create')"
**Solution:** Run `npx prisma generate` (see Step 1)

### Error: "Unauthorized"
**Solution:** 
- Make sure you're logged in
- Check if token is in localStorage: `localStorage.getItem('token')`
- Try logging out and back in

### Error: "Validation error"
**Solution:**
- Check all required fields are filled:
  - Agent Name (required)
  - Language (required - must select from dropdown)
  - System Prompt (required)

### Error: "Database client not ready"
**Solution:**
- Stop dev server
- Run `npx prisma generate`
- Restart dev server

## ✅ Verification Steps

1. **Check Prisma Client:**
   - Open browser console
   - The error message should show available models if Prisma isn't ready

2. **Check Authentication:**
   - Make sure you're logged in
   - Check Network tab for 401 errors

3. **Check Form Data:**
   - Fill all required fields
   - Language dropdown should work (native HTML select)

## 🚀 Quick Test

After fixing Prisma:
1. Go to: `http://localhost:3000/voice-agents/[your-tenant-id]/New`
2. Fill in:
   - **Agent Name:** "Test Agent"
   - **Language:** Select "English" from dropdown
   - **System Prompt:** "You are a helpful assistant"
3. Click "Create Agent"
4. Should redirect to home page with success message

## 📞 Still Having Issues?

Check:
- Browser console (F12) for errors
- Server console for API errors
- Network tab for failed requests
- Make sure database is running and accessible

