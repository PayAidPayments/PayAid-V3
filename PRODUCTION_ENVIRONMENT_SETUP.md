# Production Environment Setup Guide

**Date:** January 2026  
**Status:** ✅ **Configuration Guide Complete**

---

## 🎯 **Required Environment Variables**

### **1. Database Configuration**

```env
# Primary database connection (with pooler - for queries)
DATABASE_URL="postgresql://postgres.zjcutguakjavahdrytxc:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"

# Direct connection (for migrations - optional, falls back to DATABASE_URL)
DATABASE_DIRECT_URL="postgresql://postgres:[PASSWORD]@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public"

# Read replica (optional - for scaling read operations)
DATABASE_READ_URL="postgresql://postgres.zjcutguakjavahdrytxc:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"
```

**Notes:**
- `DATABASE_URL`: Primary connection with Supabase pooler (port 6543)
- `DATABASE_DIRECT_URL`: Direct connection bypassing pooler (for migrations)
- `DATABASE_READ_URL`: Read replica connection (if using read replicas)

---

### **2. Redis Configuration**

```env
# Redis URL (for caching and job queues)
REDIS_URL="redis://localhost:6379"

# For Redis with password
REDIS_URL="redis://:password@localhost:6379"

# For Redis cluster (comma-separated)
REDIS_CLUSTER_NODES="redis://node1:6379,redis://node2:6379,redis://node3:6379"
```

**Production Options:**
- **Upstash Redis** (serverless): `redis://default:[PASSWORD]@[HOST]:[PORT]`
- **Redis Cloud**: `redis://:[PASSWORD]@[HOST]:[PORT]`
- **Self-hosted**: `redis://[HOST]:[PORT]`

---

### **3. Monitoring Configuration (Optional)**

```env
# StatsD for metrics
STATSD_HOST="statsd.example.com"
STATSD_PORT="8125"
STATSD_PREFIX="payaid"

# APM (Application Performance Monitoring)
APM_SERVER_URL="https://apm.example.com"
APM_SERVICE_NAME="payaid-api"
```

**StatsD Options:**

**Option A: Self-Hosted StatsD**
1. Install StatsD: `npm install -g statsd`
2. Run: `statsd config.js`
3. Set `STATSD_HOST` and `STATSD_PORT`

**Option B: Managed StatsD Services**
- **Datadog**: Automatically collects StatsD metrics (set `DD_API_KEY`)
- **New Relic**: Use StatsD plugin (set `NEW_RELIC_LICENSE_KEY`)
- **Grafana Cloud**: Provides StatsD endpoint
- **AWS CloudWatch**: Use StatsD plugin

**APM Options:**
- **New Relic**: Set `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_NAME`
- **Datadog**: Set `DD_API_KEY` and `DD_SITE`
- **Elastic APM**: Set `APM_SERVER_URL`

---

### **4. Application Configuration**

```env
# JWT Secret (must be strong in production)
JWT_SECRET="your-strong-secret-key-minimum-256-characters"

# Node Environment
NODE_ENV="production"

# Application URL
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

---

## 🚀 **Vercel Deployment Configuration**

### **Step 1: Add Environment Variables**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables for **Production** environment
3. Optionally add for **Preview** and **Development** environments

### **Step 2: Configure Redis**

**Option A: Upstash Redis (Recommended for Vercel)**
1. Create account at https://upstash.com
2. Create Redis database
3. Copy connection string to `REDIS_URL`

**Option B: Redis Cloud**
1. Create account at https://redis.com/cloud
2. Create database
3. Copy connection string to `REDIS_URL`

### **Step 3: Configure Database Read Replica**

1. In Supabase Dashboard → Database → Replicas
2. Create read replica (if available in your plan)
3. Copy connection string to `DATABASE_READ_URL`

---

## 📊 **CDN Configuration**

### **Vercel (Automatic)**
- ✅ Vercel automatically provides CDN for static assets
- ✅ No additional configuration needed

### **Cloudflare (Optional)**
1. Add your domain to Cloudflare
2. Update DNS nameservers
3. Enable Cloudflare CDN
4. Configure caching rules

---

## ✅ **Verification Checklist**

After deployment, verify:

- [ ] `DATABASE_URL` is set and accessible
- [ ] `DATABASE_READ_URL` is set (if using read replicas)
- [ ] `REDIS_URL` is set and accessible
- [ ] All API endpoints respond correctly
- [ ] Cache is working (check response headers)
- [ ] Background jobs are processing
- [ ] Monitoring is sending metrics (if configured)

---

## 🔧 **Testing Commands**

```bash
# Test database connection
node -e "const { prisma } = require('./lib/db/prisma'); prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ DB OK')).catch(console.error)"

# Test read replica
node -e "const { prismaRead } = require('./lib/db/prisma-read'); prismaRead.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ Read Replica OK')).catch(console.error)"

# Test Redis connection
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(() => console.log('✅ Redis OK')).catch(console.error)"
```

---

## 📝 **Complete .env.production Template**

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://..."
DATABASE_DIRECT_URL="postgresql://..."
DATABASE_READ_URL="postgresql://..."

# ============================================
# REDIS
# ============================================
REDIS_URL="redis://..."

# ============================================
# MONITORING (Optional)
# ============================================
STATSD_HOST="statsd.example.com"
STATSD_PORT="8125"
STATSD_PREFIX="payaid"
APM_SERVER_URL="https://apm.example.com"

# ============================================
# APPLICATION
# ============================================
NODE_ENV="production"
JWT_SECRET="your-strong-secret-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# ============================================
# OTHER SERVICES
# ============================================
SENDGRID_API_KEY="..."
TWILIO_ACCOUNT_SID="..."
# ... other service keys
```

---

## 🎉 **Summary**

✅ **Database:** Configured with pooler and read replicas  
✅ **Redis:** Configured for caching and job queues  
✅ **Monitoring:** Optional StatsD/APM integration  
✅ **CDN:** Automatic with Vercel  

**Your production environment is ready!**
