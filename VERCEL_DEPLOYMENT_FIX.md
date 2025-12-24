# Vercel Deployment Fixes

## Issues Fixed

### 1. **Incorrect Prisma Import Path** ✅
**Problem:** New API routes were using `@payaid/db` alias which may not resolve correctly in Vercel's build environment.

**Fixed Files:**
- `app/api/gst/gstr-1/export/route.ts`
- `app/api/gst/gstr-3b/export/route.ts`
- `app/api/billing/orders/route.ts`
- `app/api/admin/coupons/route.ts`

**Change:** Changed from `import { prisma } from '@payaid/db'` to `import { prisma } from '@/lib/db/prisma'`

### 2. **Build Script Issues** ✅
**Problem:** 
- `--webpack` flag in build script may cause compatibility issues with Next.js 16
- Prisma client not generated before build

**Fixed:**
- Removed `--webpack` flag from build script
- Added `prisma generate` to build script
- Added `postinstall` script to generate Prisma client after npm install

**Updated `package.json`:**
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 3. **Vercel Configuration** ✅
**Updated `vercel.json`:**
- Added environment variable to disable Prisma Data Proxy (not needed for direct connections)

## Next Steps

1. **Commit and Push Changes:**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment: correct Prisma imports and build config"
   git push
   ```

2. **Vercel will automatically redeploy** after you push

3. **If build still fails:**
   - Check Vercel build logs for specific error messages
   - Ensure `DATABASE_URL` environment variable is set in Vercel dashboard
   - Verify all required environment variables are configured

## Required Environment Variables in Vercel

Make sure these are set in your Vercel project settings:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PAYAID_API_KEY` - PayAid API key (if used)
- `PAYAID_SALT` - PayAid salt (if used)
- Any other variables from `.env.example`

## Testing Locally

Before deploying, test the build locally:
```bash
npm run build
```

If the local build succeeds, Vercel should also succeed.

