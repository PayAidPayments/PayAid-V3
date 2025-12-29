# ✅ PayAid V3 Deployment Checklist

## 🎯 Pre-Deployment

### Environment Variables in Vercel
- [ ] `DATABASE_URL` - Direct connection (port 5432, not pooler)
- [ ] `JWT_SECRET` - Random 32-byte hex string
- [ ] `NEXTAUTH_SECRET` - Random 32-byte hex string
- [ ] `ENCRYPTION_KEY` - Random 32-byte hex string
- [ ] `GROQ_API_KEY` - (Optional, for AI)
- [ ] `OLLAMA_API_URL` - (Optional, for AI fallback)
- [ ] `HUGGINGFACE_API_KEY` - (Optional, for AI fallback)

### Database Setup
- [ ] Database schema pushed (`npx prisma db push`)
- [ ] All tables exist in `public` schema
- [ ] Connection string uses direct connection (not pooler)
- [ ] Connection string includes `?schema=public`

### Code Verification
- [ ] All files committed to Git
- [ ] No TypeScript errors (`npm run build`)
- [ ] All imports resolved
- [ ] Environment variables referenced correctly

---

## 🚀 Deployment Steps

### Step 1: Update DATABASE_URL (CRITICAL)
1. Go to: https://vercel.com/dashboard → **payaid-v3** → **Settings** → **Environment Variables**
2. Edit `DATABASE_URL` (Production & Preview)
3. Replace with direct connection:
   ```
   postgresql://postgres.ssbzexbhyifpafnvdaxn:x7RV7sVVfFvxApQ%408@db.ssbzexbhyifpafnvdaxn.supabase.co:5432/postgres?schema=public
   ```
4. Save and wait for auto-redeploy (2-3 minutes)

### Step 2: Verify Deployment
```powershell
# Run verification script
powershell -ExecutionPolicy Bypass -File scripts/verify-deployment.ps1
```

### Step 3: Create Admin User
```powershell
$body = @{ email = "admin@demo.com"; password = "Test@1234" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://payaid-v3.vercel.app/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

### Step 4: Test Login
1. Go to: https://payaid-v3.vercel.app/login
2. Email: `admin@demo.com`
3. Password: `Test@1234`
4. Should login successfully ✅

### Step 5: Test AI Co-Founder
1. Navigate to: `/dashboard/cofounder`
2. Select an agent (e.g., "CFO")
3. Ask: "Show me unpaid invoices"
4. Should get AI response ✅

---

## ✅ Post-Deployment Verification

### Critical Endpoints
- [ ] `/api/health` - Returns 200 OK
- [ ] `/api/admin/reset-password` - Creates/updates admin user
- [ ] `/api/auth/login` - Returns JWT token
- [ ] `/api/ai/cofounder` (GET) - Returns list of agents
- [ ] `/api/ai/cofounder` (POST) - Returns AI response

### UI Pages
- [ ] `/login` - Login page loads
- [ ] `/dashboard` - Dashboard loads after login
- [ ] `/dashboard/cofounder` - Co-Founder UI loads
- [ ] Agent selector works
- [ ] Chat interface functional

### Database
- [ ] Tables accessible (no "table doesn't exist" errors)
- [ ] User creation works
- [ ] Tenant creation works
- [ ] Data queries return results

---

## 🐛 Troubleshooting

### "Table doesn't exist" Error
**Solution:** Update `DATABASE_URL` to use direct connection (see Step 1)

### "Invalid or expired token" Error
**Solution:** 
- Ensure `JWT_SECRET` is set in Vercel
- User needs to log out and log back in

### "Module not licensed" Error
**Solution:**
- Check user has access to required modules
- Verify tenant has correct `licensedModules`

### AI Co-Founder Not Responding
**Solution:**
- Check AI service API keys (Groq, Ollama, HuggingFace)
- Verify business context builder is working
- Check Vercel logs for errors

---

## 📊 Success Criteria

All items below should be ✅:

- [ ] Admin user can be created
- [ ] Login works
- [ ] Dashboard loads
- [ ] AI Co-Founder accessible
- [ ] All 9 agents available
- [ ] Chat interface functional
- [ ] Business context loads
- [ ] No database errors
- [ ] No authentication errors

---

## 🔄 Rollback Plan

If deployment fails:

1. **Check Vercel Logs:**
   ```powershell
   vercel logs payaid-v3.vercel.app --follow
   ```

2. **Revert Environment Variables:**
   - Restore previous `DATABASE_URL` if needed
   - Verify all required env vars are set

3. **Redeploy Previous Version:**
   - Go to Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

---

## 📝 Notes

- **Database Connection:** Always use direct connection (port 5432) for Vercel
- **Password Encoding:** URL-encode special characters in connection string (`@` → `%40`)
- **Auto-Redeploy:** Vercel automatically redeploys when env vars change
- **Deployment Time:** Usually 2-3 minutes for full deployment

---

**Last Updated:** January 2025
**Status:** Ready for Deployment

