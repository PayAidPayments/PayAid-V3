# 🚀 Production Deployment Steps - PayAid V3

## ✅ Pre-Deployment Checklist

- [x] Build successful locally
- [x] All TypeScript errors fixed
- [x] Vercel CLI installed

## 📋 Deployment Steps

### Step 1: Deploy to Vercel

Run the following command to deploy:

```bash
vercel --prod
```

### Step 2: Configure Environment Variables

After deployment, add these **REQUIRED** environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**

#### 🔴 Critical Variables (Required)

```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
JWT_SECRET=<generate-64-char-hex>
JWT_EXPIRES_IN=24h
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-64-char-hex>
NODE_ENV=production
APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
ENCRYPTION_KEY=<generate-64-char-hex>
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Update URLs After First Deployment

After first deployment, update:
- `NEXTAUTH_URL` to your actual Vercel URL
- `APP_URL` to your actual Vercel URL  
- `NEXT_PUBLIC_APP_URL` to your actual Vercel URL

### Step 4: Redeploy

After adding environment variables, Vercel will auto-redeploy, or you can manually redeploy.

## 📝 Notes

- First deployment may take 5-10 minutes
- Subsequent deployments are faster (2-5 minutes)
- All environment variables must be set for Production environment
- Database must be accessible from Vercel's servers (not localhost)

