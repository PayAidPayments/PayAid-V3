# Production Deployment Checklist

**Date:** January 2026  
**Status:** ✅ **Complete Checklist**

---

## 🎯 **Pre-Deployment Checklist**

### **1. Database Setup** ✅

- [ ] All indexes created and verified
  ```bash
  npx tsx scripts/verify-performance-indexes.ts
  ```

- [ ] Database migrations applied
  ```bash
  npx prisma migrate deploy
  ```

- [ ] Read replica configured (if using)
  - [ ] `DATABASE_READ_URL` set in production
  - [ ] Read replica connection tested

- [ ] Connection pooler verified
  - [ ] Supabase pooler active
  - [ ] Connection limits configured

---

### **2. Redis Setup** ✅

- [ ] Redis instance running
  ```bash
  # Test connection
  node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(() => console.log('✅ Redis OK')).catch(console.error)"
  ```

- [ ] `REDIS_URL` configured in production
- [ ] Redis cluster configured (if using)

---

### **3. Environment Variables** ✅

- [ ] All required variables set:
  ```env
  DATABASE_URL=...
  DATABASE_READ_URL=... (optional)
  DATABASE_DIRECT_URL=... (optional)
  REDIS_URL=...
  JWT_SECRET=...
  NODE_ENV=production
  ```

- [ ] Optional monitoring variables:
  ```env
  STATSD_HOST=... (optional)
  STATSD_PORT=... (optional)
  APM_SERVER_URL=... (optional)
  ```

---

### **4. Code Verification** ✅

- [ ] All tests passing
- [ ] No linter errors
- [ ] Type checking passes
  ```bash
  npm run type-check
  ```

- [ ] Build succeeds
  ```bash
  npm run build
  ```

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy to Vercel**

1. Push code to repository
2. Vercel will automatically deploy
3. Verify deployment succeeded

### **Step 2: Configure Environment Variables**

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required variables for **Production** environment
3. Redeploy if needed

### **Step 3: Verify Deployment**

```bash
# Check health endpoint
curl https://your-domain.com/api/system/health

# Check metrics endpoint
curl https://your-domain.com/api/system/metrics
```

---

## ✅ **Post-Deployment Verification**

### **1. System Health**

```bash
# Run health check
npm run test:health

# Or via API
curl https://your-domain.com/api/system/health
```

**Expected:** All components healthy

---

### **2. API Endpoints**

Test key endpoints:

```bash
# Contacts
curl https://your-domain.com/api/contacts

# Deals
curl https://your-domain.com/api/deals

# Tasks
curl https://your-domain.com/api/tasks
```

**Expected:** All return 200 status

---

### **3. Caching**

Verify cache is working:

```bash
# First request (cache miss)
curl -I https://your-domain.com/api/contacts

# Second request (should be faster, cache hit)
curl -I https://your-domain.com/api/contacts
```

**Expected:** Second request faster, X-Cache header present

---

### **4. Background Jobs**

Verify job processors are running:

```bash
# Check logs for initialization message
# Should see: "✅ Background job processors initialized"
```

---

### **5. Monitoring**

Verify metrics are being tracked:

```bash
# Check metrics endpoint
curl https://your-domain.com/api/system/metrics

# Check alerts
curl https://your-domain.com/api/system/alerts
```

---

## 📊 **Performance Verification**

### **1. Response Times**

- ✅ p50 < 200ms
- ✅ p95 < 500ms
- ✅ p99 < 1000ms

### **2. Error Rates**

- ✅ Total error rate < 0.1%
- ✅ 5xx errors < 0.01%

### **3. Cache Performance**

- ✅ Cache hit rate > 70%
- ✅ Cache response time < 50ms

### **4. Database Performance**

- ✅ Query response time < 200ms (p95)
- ✅ Connection pool not exhausted
- ✅ Read replica handling 70-80% of reads

---

## 🔍 **Monitoring Setup**

### **1. StatsD (Optional)**

If using StatsD:

1. Set `STATSD_HOST` and `STATSD_PORT`
2. Verify metrics are being sent
3. Set up Grafana dashboard

### **2. APM (Optional)**

If using APM:

1. Set `APM_SERVER_URL`
2. Verify APM agent is connected
3. Set up alerts in APM dashboard

### **3. Custom Monitoring**

Use the built-in endpoints:

- `/api/system/health` - Health status
- `/api/system/metrics` - Detailed metrics
- `/api/system/alerts` - Active alerts

---

## 🚨 **Alert Configuration**

### **Critical Alerts:**

- Error rate > 1%
- Response time p95 > 1000ms
- Database connection exhaustion
- Redis unavailable

### **Warning Alerts:**

- Error rate > 0.5%
- Response time p95 > 500ms
- Cache hit rate < 50%
- Slow queries detected

---

## 📝 **Load Testing**

After deployment, run load tests:

```bash
# Set up load tests
npm run setup:load-tests

# Run load test (1,000 users)
cd load-tests
k6 run k6-load-test.js
```

**Success Criteria:**
- ✅ p95 < 500ms
- ✅ Error rate < 0.1%
- ✅ Cache hit rate > 70%

---

## ✅ **Final Checklist**

Before going live:

- [ ] All health checks passing
- [ ] All API endpoints responding
- [ ] Caching working correctly
- [ ] Background jobs processing
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Load testing passed
- [ ] Documentation complete
- [ ] Team trained on monitoring

---

## 🎉 **Deployment Complete!**

Once all items are checked:

✅ **Platform is production-ready!**

**Next Steps:**
1. Monitor metrics for first 24 hours
2. Review alerts and optimize
3. Scale resources as needed
4. Continue monitoring and optimization

---

**Your platform is ready for 10,000+ concurrent users!**
