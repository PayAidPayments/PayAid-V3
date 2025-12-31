# Upstash Redis Setup Guide

## Overview

Upstash Redis is a serverless Redis database that works perfectly in Edge Runtime environments (like Next.js middleware). This guide will help you set up Upstash Redis for production rate limiting.

## Step 1: Create Upstash Redis Database

1. **Sign up/Login to Upstash:**
   - Go to [https://upstash.com](https://upstash.com)
   - Sign up for a free account (or login if you already have one)

2. **Create a Redis Database:**
   - Click "Create Database"
   - Choose "Global" or "Regional" (Global recommended for better performance)
   - Select a region closest to your Vercel deployment
   - Choose "Free" tier (10,000 commands/day) or upgrade if needed
   - Click "Create"

3. **Get Your Credentials:**
   - After creation, you'll see your database details
   - Copy the following:
     - **UPSTASH_REDIS_REST_URL** (e.g., `https://your-db.upstash.io`)
     - **UPSTASH_REDIS_REST_TOKEN** (a long token string)

## Step 2: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard:**
   - Navigate to your project: [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your PayAid V3 project

2. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Add the following variables:

   ```
   Name: UPSTASH_REDIS_REST_URL
   Value: https://your-db.upstash.io
   Environment: Production, Preview, Development (select all)
   ```

   ```
   Name: UPSTASH_REDIS_REST_TOKEN
   Value: your-token-here
   Environment: Production, Preview, Development (select all)
   ```

3. **Save and Redeploy:**
   - Click **Save**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy** to apply the new environment variables

## Step 3: Verify Setup

After deployment, rate limiting will automatically work. You can verify by:

1. **Check Vercel Logs:**
   - Go to your deployment → **Logs**
   - Look for any Upstash Redis connection errors (should be none)

2. **Test Rate Limiting:**
   - Make multiple rapid requests to your API
   - After 1000 requests/hour (global limit) or 5 login attempts/15min (auth limit), you should receive a 429 error

## Rate Limiting Configuration

The current configuration:

- **Global Rate Limit:** 1,000 requests per hour per IP
- **Auth Rate Limit:** 5 attempts per 15 minutes per IP

These limits can be adjusted in `lib/middleware/upstash-rate-limit.ts`:

```typescript
// Global limiter
globalLimiter = new Ratelimit({
  redis: client,
  limiter: Ratelimit.slidingWindow(1000, '1 h'), // Change these values
  analytics: true,
})

// Auth limiter
authLimiter = new Ratelimit({
  redis: client,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // Change these values
  analytics: true,
})
```

## Free Tier Limits

Upstash Free Tier includes:
- **10,000 commands/day** (plenty for rate limiting)
- **256 MB storage**
- **Global replication**

For production with high traffic, consider upgrading to a paid plan.

## Troubleshooting

### Rate Limiting Not Working

1. **Check Environment Variables:**
   - Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel
   - Ensure they're added to all environments (Production, Preview, Development)

2. **Check Upstash Dashboard:**
   - Go to your Upstash dashboard
   - Check if commands are being executed (should see activity)

3. **Check Vercel Logs:**
   - Look for "Failed to initialize Upstash Redis" warnings
   - If you see errors, verify your credentials are correct

### Still Getting Middleware Errors

If you're still seeing middleware errors:
- The code now falls back gracefully if Upstash is not configured
- Rate limiting will be disabled but the app will work
- Once Upstash is configured, rate limiting will automatically activate

## Next Steps

1. ✅ Set up Upstash Redis database
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy your application
4. ✅ Verify rate limiting is working

Rate limiting is now production-ready and works in Edge Runtime! 🎉

