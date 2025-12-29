# Environment Variables & Vercel Logs Verification

This guide explains how to verify environment variables and check Vercel deployment logs.

## Quick Start

### Combined Verification (Recommended)

Run the comprehensive PowerShell script that checks both environment variables and Vercel logs:

```powershell
# Basic usage
npm run verify-env-and-logs

# Or directly
.\scripts\verify-env-and-logs.ps1

# With options
.\scripts\verify-env-and-logs.ps1 -ProjectName "payaid-v3" -CheckVercelEnv -LogLines 100
```

### Options

- `-ProjectName <name>` - Vercel project name (default: `payaid-v3`)
- `-CheckVercelEnv` - Attempt to check Vercel environment variables via CLI
- `-FollowLogs` - Follow logs in real-time (default: false)
- `-LogLines <number>` - Number of log lines to show (default: 50)

### Examples

```powershell
# Check everything with Vercel env vars
.\scripts\verify-env-and-logs.ps1 -CheckVercelEnv

# Follow logs in real-time
.\scripts\verify-env-and-logs.ps1 -FollowLogs

# Check different project
.\scripts\verify-env-and-logs.ps1 -ProjectName "my-project" -CheckVercelEnv -LogLines 100
```

---

## Individual Scripts

### 1. Verify Environment Variables (TypeScript)

Check local environment variables from `.env` file:

```powershell
npm run verify-env
```

Or with Vercel info:

```powershell
npx tsx scripts/verify-env.ts --vercel
```

**What it checks:**
- ✅ Critical variables (DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN)
- ⚠️ Important variables (NEXTAUTH_URL, NEXTAUTH_SECRET, etc.)
- ℹ️ Optional variables (API keys, service URLs)

**Output:**
- Lists all variables with their status
- Validates values (e.g., checks for localhost in production)
- Shows security warnings for weak secrets
- Provides summary statistics

---

### 2. Check Vercel Logs (PowerShell)

Check Vercel deployment logs:

```powershell
npm run check-vercel-logs
```

Or directly:

```powershell
.\scripts\check-vercel-logs.ps1 [deployment-url]
```

**What it does:**
- Lists recent deployments
- Shows latest deployment details
- Filters logs for errors/warnings
- Provides manual access instructions

---

## Required Environment Variables

### 🔴 Critical (Application won't work without these)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Secret for JWT tokens (64+ chars) | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |

### 🟡 Important (Core features may not work)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | NextAuth base URL | `https://payaid-v3.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth secret (64+ chars) | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | Node environment | `production` |
| `APP_URL` | Application base URL | `https://payaid-v3.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://payaid-v3.vercel.app` |

### 🟢 Optional (Features may be limited)

| Variable | Description |
|----------|-------------|
| `ENCRYPTION_KEY` | For API keys at rest (64-char hex) |
| `REDIS_URL` | Redis connection string |
| `GROQ_API_KEY` | Groq AI API key |
| `HUGGINGFACE_API_KEY` | Hugging Face API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SENDGRID_API_KEY` | SendGrid email API key |
| `PAYAID_ADMIN_API_KEY` | PayAid Payments admin API key |
| `PAYAID_ADMIN_SALT` | PayAid Payments admin salt |

---

## Verification Checklist

### Before Deployment

- [ ] All critical variables are set
- [ ] No security warnings (weak secrets)
- [ ] No localhost URLs in production
- [ ] DATABASE_URL uses correct connection string format
- [ ] All secrets are 64+ characters

### After Deployment

- [ ] Check Vercel logs for errors
- [ ] Verify environment variables in Vercel dashboard
- [ ] Test critical endpoints (login, API calls)
- [ ] Monitor logs for warnings

---

## Troubleshooting

### Script won't run

**PowerShell execution policy error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Vercel CLI not found:**
```powershell
npm i -g vercel
vercel login
```

### Environment variables not found

1. **Check `.env` file exists** in project root
2. **Verify variable names** match exactly (case-sensitive)
3. **Check for typos** in variable names
4. **Ensure no extra spaces** around `=` sign

### Vercel logs not accessible

1. **Login to Vercel:**
   ```powershell
   vercel login
   ```

2. **Link project:**
   ```powershell
   vercel link
   ```

3. **Or check manually:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click on deployment → Functions tab

### Database connection issues

1. **Verify DATABASE_URL format:**
   - Should start with `postgresql://`
   - Should include `?schema=public`
   - Should NOT use localhost for production

2. **Check connection string:**
   - For Supabase: Use Session Pooler (port 5432)
   - Format: `postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres?schema=public`

---

## Manual Verification

### Check Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select project: **PayAid V3**
3. Go to **Settings** → **Environment Variables**
4. Verify all required variables are set for:
   - ✅ Production
   - ✅ Preview
   - ⚠️ Development (optional)

### Check Vercel Logs Manually

1. Go to: https://vercel.com/dashboard
2. Select project: **PayAid V3**
3. Click on the **latest deployment**
4. Go to **Functions** tab
5. Click on specific function (e.g., `/api/auth/login`)
6. Check **Logs** section

### Check Local Environment Variables

1. Open `.env` file in project root
2. Compare with `env.example`
3. Ensure all critical variables are set
4. Verify no placeholder values remain

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Verify Environment Variables
  run: npm run verify-env
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    # ... other variables
```

### Pre-deployment Check

Add to your deployment workflow:

```powershell
# Before deploying
npm run verify-env-and-logs -CheckVercelEnv

# If verification passes, deploy
vercel --prod
```

---

## Script Output Examples

### Successful Verification

```
✅ All critical environment variables are set!
📊 SUMMARY:
  Critical Variables:   3/3 set
  Important Variables:  5/5 set
  Optional Variables:   8/15 set
  Critical Issues:      0 found
```

### Failed Verification

```
❌ ACTION REQUIRED: Fix critical issues before deployment!
📊 SUMMARY:
  Critical Variables:   2/3 set
  Important Variables:  4/5 set
  Optional Variables:   8/15 set
  Critical Issues:      1 found
```

---

## Additional Resources

- **Environment Variables Guide:** See `env.example` for all available variables
- **Vercel Documentation:** https://vercel.com/docs/environment-variables
- **Database Setup:** See `COMPLETE_DATABASE_FIX.md`
- **Deployment Guide:** See `VERCEL_DEPLOYMENT_GUIDE.md`

---

## Support

If you encounter issues:

1. Run verification scripts with verbose output
2. Check Vercel dashboard for deployment status
3. Review logs for specific error messages
4. Verify environment variables are correctly set in Vercel

