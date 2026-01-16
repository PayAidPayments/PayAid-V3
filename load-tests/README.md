# Load Testing Guide

**Date:** January 2026  
**Status:** ✅ **Load Testing Setup Complete**

---

## 🎯 **Overview**

This directory contains load testing configurations for PayAid V3 to verify the platform can handle 10,000+ concurrent users.

---

## 📋 **Prerequisites**

### **1. Install Load Testing Tools**

**Option A: k6 (Recommended)**
```bash
# Windows (using Chocolatey)
choco install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

**Option B: Artillery**
```bash
npm install -g artillery
```

### **2. Set Environment Variables**

```bash
# Set your API base URL
export BASE_URL="https://your-domain.com"

# Set your JWT token (get from login)
export API_TOKEN="your-jwt-token-here"
```

**Windows PowerShell:**
```powershell
$env:BASE_URL="https://your-domain.com"
$env:API_TOKEN="your-jwt-token-here"
```

---

## 🚀 **Running Load Tests**

### **Scenario 1: 1,000 Concurrent Users (k6)**

```bash
cd load-tests
k6 run --vus 1000 --duration 10m k6-load-test.js
```

### **Scenario 2: 5,000 Concurrent Users (k6)**

```bash
k6 run --vus 5000 --duration 20m k6-load-test.js
```

### **Scenario 3: 10,000 Concurrent Users (k6)**

```bash
k6 run --vus 10000 --duration 30m k6-load-test.js
```

### **Using Artillery**

```bash
cd load-tests
artillery run artillery-config.yml
```

---

## 📊 **Test Scenarios**

### **Scenario 1: 1,000 Users**
- **Duration:** 10 minutes
- **Ramp up:** 2 minutes (0 → 100 → 500 → 1000)
- **Sustained:** 5 minutes at 1000 users
- **Ramp down:** 2 minutes

### **Scenario 2: 5,000 Users**
- **Duration:** 20 minutes
- **Ramp up:** 5 minutes (0 → 500 → 2000 → 5000)
- **Sustained:** 10 minutes at 5000 users
- **Ramp down:** 3 minutes

### **Scenario 3: 10,000 Users**
- **Duration:** 30 minutes
- **Ramp up:** 10 minutes (0 → 1000 → 5000 → 10000)
- **Sustained:** 15 minutes at 10000 users
- **Ramp down:** 5 minutes

---

## 📈 **Metrics to Monitor**

### **1. Response Times**
- **p50 (median):** Should be < 200ms
- **p95 (95th percentile):** Should be < 500ms
- **p99 (99th percentile):** Should be < 1000ms

### **2. Error Rates**
- **4xx errors:** Should be < 0.1%
- **5xx errors:** Should be < 0.01%
- **Total error rate:** Should be < 0.1%

### **3. Throughput**
- **Requests per second:** Monitor peak RPS
- **Successful requests:** Should match total requests

### **4. System Metrics**
- **Database connection pool:** Should not be exhausted
- **Redis connection:** Should remain stable
- **Cache hit rate:** Should be > 70%
- **CPU usage:** Should be < 80%
- **Memory usage:** Should be stable

---

## ✅ **Success Criteria**

Before considering load testing successful:

- ✅ **p95 response time < 500ms**
- ✅ **p99 response time < 1000ms**
- ✅ **Error rate < 0.1%**
- ✅ **Cache hit rate > 70%**
- ✅ **No database connection exhaustion**
- ✅ **No Redis connection issues**
- ✅ **No memory leaks**
- ✅ **CPU usage < 80%**

---

## 🔍 **Monitoring During Tests**

### **1. System Health Endpoint**

```bash
# Monitor health during load test
watch -n 5 'curl -s http://localhost:3000/api/system/health | jq'
```

### **2. Database Metrics**

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### **3. Redis Metrics**

```bash
# Check Redis stats
redis-cli INFO stats

# Check cache hit rate
redis-cli INFO stats | grep keyspace
```

---

## 📝 **Test Results Analysis**

### **What to Look For:**

1. **Response Time Degradation:**
   - If p95 > 500ms, investigate bottlenecks
   - Check database query performance
   - Verify cache is working

2. **Error Rate Spikes:**
   - If errors > 0.1%, check logs
   - Verify rate limiting is working
   - Check database connection limits

3. **Cache Hit Rate:**
   - If < 70%, verify cache is enabled
   - Check cache warming is working
   - Verify cache keys are correct

4. **Resource Exhaustion:**
   - Database connections maxed out
   - Redis connections maxed out
   - Memory leaks

---

## 🛠️ **Troubleshooting**

### **High Response Times:**
1. Check database query performance
2. Verify indexes are being used
3. Check cache hit rates
4. Monitor database CPU usage

### **High Error Rates:**
1. Check application logs
2. Verify rate limiting settings
3. Check database connection limits
4. Verify Redis is accessible

### **Cache Not Working:**
1. Verify REDIS_URL is set
2. Check Redis connection
3. Verify cache keys are correct
4. Check cache TTL settings

---

## 📊 **Example k6 Output**

```
✓ contacts status is 200
✓ contacts response time < 500ms
✓ deals status is 200
✓ deals response time < 500ms
...

checks.........................: 100.00% ✓ 50000  ✗ 0
data_received..................: 12 MB   200 kB/s
data_sent......................: 2.5 MB  42 kB/s
http_req_duration..............: avg=150ms min=50ms med=120ms max=800ms p(95)=400ms p(99)=750ms
http_req_failed................: 0.00%   ✓ 0      ✗ 50000
http_reqs......................: 50000   833.33/s
iteration_duration.............: avg=1.2s min=1.0s med=1.1s max=2.5s
iterations.....................: 10000   166.67/s
vus............................: 1000    min=1000 max=1000
```

---

## 🎯 **Next Steps After Load Testing**

1. **Analyze Results:**
   - Identify bottlenecks
   - Check slow queries
   - Review error logs

2. **Optimize:**
   - Add missing indexes
   - Optimize slow queries
   - Adjust cache TTL
   - Scale resources if needed

3. **Re-test:**
   - Run tests again after optimizations
   - Verify improvements
   - Document results

---

## 📚 **Additional Resources**

- **k6 Documentation:** https://k6.io/docs/
- **Artillery Documentation:** https://www.artillery.io/docs
- **Load Testing Best Practices:** https://k6.io/docs/test-types/load-testing/

---

## ✅ **Quick Start**

```bash
# 1. Set environment variables
export BASE_URL="https://your-domain.com"
export API_TOKEN="your-token"

# 2. Run load test
cd load-tests
k6 run k6-load-test.js

# 3. Monitor results
# Watch the output for metrics and thresholds
```

---

**Ready to test your platform's scalability!**
