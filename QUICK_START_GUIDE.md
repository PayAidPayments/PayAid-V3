# 🚀 PayAid V3 AI Co-Founder - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Fix Database Connection (2 minutes)

1. Go to: https://vercel.com/dashboard
2. Select project: **payaid-v3**
3. Click: **Settings** → **Environment Variables**
4. Find `DATABASE_URL` (Production & Preview)
5. Click **Edit** and replace with:
   ```
   postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
   ```
6. Click **Save**
7. Wait 2-3 minutes for auto-redeploy

### Step 2: Create Admin User (1 minute)

```powershell
$body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User admin@demo.com created successfully",
  "email": "admin@demo.com"
}
```

### Step 3: Login (1 minute)

1. Go to: https://payaid-v3.vercel.app/login
2. Email: `admin@demo.com`
3. Password: `Test@1234`
4. Click **Login**

### Step 4: Access AI Co-Founder (1 minute)

1. After login, navigate to: `/dashboard/cofounder`
2. Or click **"AI Co-Founder"** in the sidebar
3. Select an agent (e.g., "CFO")
4. Ask: "Show me unpaid invoices"
5. Get AI-powered response! 🎉

---

## 🎯 Try These Examples

### CFO Agent
- "Show me unpaid invoices"
- "What's my revenue this month?"
- "Create an invoice for ABC Company"

### Sales Agent
- "What leads need follow-up?"
- "Show me deals closing this week"
- "Who are my top prospects?"

### Marketing Agent
- "Create a LinkedIn post about our new product"
- "Suggest a marketing campaign for Q1"
- "What's our email open rate?"

### Co-Founder Agent
- "What should I focus on this week?"
- "Analyze my business performance"
- "What are the biggest opportunities?"

---

## ✅ Verification

Run the automated verification script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-deployment.ps1
```

This will test:
- ✅ Health check
- ✅ Admin password reset
- ✅ Login
- ✅ AI Co-Founder endpoint
- ✅ Agents list

---

## 🐛 Troubleshooting

### "Table doesn't exist" Error
**Fix:** Update `DATABASE_URL` to use direct connection (see Step 1)

### "Invalid or expired token" Error
**Fix:** Log out and log back in

### "Module not licensed" Error
**Fix:** Ensure user has access to 'ai-studio' module

### AI Not Responding
**Fix:** Check AI service API keys in Vercel environment variables

---

## 📚 Next Steps

After setup is complete:

1. **Explore All Agents:** Try each of the 9 specialized agents
2. **Add Business Data:** Create contacts, invoices, deals to get better AI responses
3. **Customize:** Review agent prompts in `lib/ai/agents.ts`
4. **Build Features:** Follow roadmap in `PAYAID_V3_FEATURE_ROADMAP.md`

---

## 📖 Documentation

- **Full Guide:** `README_AI_COFOUNDER.md`
- **Implementation:** `COFOUNDER_IMPLEMENTATION_SUMMARY.md`
- **Deployment:** `DEPLOYMENT_CHECKLIST.md`
- **Database Fix:** `COMPLETE_DATABASE_FIX.md`

---

**Status:** ✅ Ready to Use  
**Time to Setup:** 5 minutes  
**Cost:** ₹0/month

