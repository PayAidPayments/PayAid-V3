# Quick Verification Guide

## 🚀 Quick Start

Run this single command to verify environment variables and check Vercel logs:

```powershell
npm run verify-env-and-logs
```

This will:
- ✅ Check all local environment variables from `.env` file
- ✅ Validate variable values and security
- ✅ List recent Vercel deployments
- ✅ Show latest deployment logs with error highlighting
- ✅ Provide a comprehensive summary

---

## 📋 Available Commands

### Combined Verification (Recommended)
```powershell
npm run verify-env-and-logs
```

### Individual Checks
```powershell
# Check environment variables only
npm run verify-env

# Check Vercel logs only
npm run check-vercel-logs

# Run both separately
npm run verify-all
```

---

## 🔧 Advanced Usage

### With Options

```powershell
# Check Vercel environment variables via CLI
.\scripts\verify-env-and-logs.ps1 -CheckVercelEnv

# Follow logs in real-time
.\scripts\verify-env-and-logs.ps1 -FollowLogs

# Show more log lines
.\scripts\verify-env-and-logs.ps1 -LogLines 100

# Check different project
.\scripts\verify-env-and-logs.ps1 -ProjectName "my-project"
```

---

## ✅ What Gets Checked

### Environment Variables

**Critical (Required):**
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT authentication secret
- `JWT_EXPIRES_IN` - JWT expiration time

**Important (Core Features):**
- `NEXTAUTH_URL` - NextAuth base URL
- `NEXTAUTH_SECRET` - NextAuth secret
- `NODE_ENV` - Node environment
- `APP_URL` - Application URL
- `NEXT_PUBLIC_APP_URL` - Public app URL

**Optional (Feature-Specific):**
- `ENCRYPTION_KEY` - For API key encryption
- `GROQ_API_KEY` - AI chat service
- `HUGGINGFACE_API_KEY` - AI image generation
- `SENDGRID_API_KEY` - Email service
- And more...

### Vercel Deployment

- Recent deployments list
- Latest deployment URL
- Deployment logs with error highlighting
- Manual access instructions

---

## 🎯 Expected Output

### Success
```
✅ All critical environment variables are set!
📊 SUMMARY:
  Critical Variables:   3/3 set
  Important Variables:  5/5 set
  Optional Variables:   8/15 set
  Critical Issues:      0 found
```

### Issues Found
```
❌ ACTION REQUIRED: Fix critical issues before deployment!
📊 SUMMARY:
  Critical Variables:   2/3 set
  Important Variables:  4/5 set
  Critical Issues:      1 found
```

---

## 🔍 Troubleshooting

### Script Won't Run

**PowerShell Execution Policy:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Vercel CLI Not Found:**
```powershell
npm i -g vercel
vercel login
```

### Environment Variables Not Found

1. Ensure `.env` file exists in project root
2. Check variable names match exactly (case-sensitive)
3. Verify no extra spaces around `=` sign

### Vercel Logs Not Accessible

1. Login to Vercel: `vercel login`
2. Link project: `vercel link`
3. Or check manually at: https://vercel.com/dashboard

---

## 📚 More Information

- **Detailed Guide:** See `scripts/VERIFY_ENV_AND_LOGS_README.md`
- **Environment Variables:** See `env.example`
- **Database Setup:** See `COMPLETE_DATABASE_FIX.md`

---

## 💡 Tips

1. **Run before deployment** to catch issues early
2. **Use `-CheckVercelEnv`** to verify Vercel environment variables
3. **Use `-FollowLogs`** to monitor logs in real-time
4. **Check logs after deployment** to verify everything works

