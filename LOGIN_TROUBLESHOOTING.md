# Login Timeout Troubleshooting Guide

**Issue:** Login request timing out  
**Last Updated:** January 2026

---

## 🔍 **DIAGNOSTIC STEPS**

### **1. Check Vercel Logs**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to "Deployments" → Latest deployment → "Functions" tab
4. Look for `/api/auth/login` function logs
5. Check for:
   - Database connection errors
   - Timeout errors
   - Function execution time

### **2. Check Database Connection**
```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1"
```

**Common Issues:**
- `DATABASE_URL` not set in Vercel
- Database firewall blocking Vercel IPs
- Connection pool exhausted
- Database server down

### **3. Check Vercel Plan Limits**
- **Hobby Plan:** 10 second function timeout
- **Pro Plan:** 60 second function timeout

**If on Hobby Plan:**
- Login might be hitting 10s limit
- **Solution:** Upgrade to Pro OR optimize to complete in < 10s

---

## ✅ **FIXES APPLIED**

### **1. Client-Side Timeout: 30 seconds** ✅
- File: `lib/stores/auth.ts`
- Prevents client from waiting forever

### **2. Server-Side Timeout: 25 seconds** ✅
- File: `app/api/auth/login/route.ts`
- Prevents server from hanging
- Returns 504 Gateway Timeout

### **3. Database Connection Test: 5 seconds** ✅
- Tests connection before querying
- Fails fast if database is unreachable

### **4. User Query Timeout: 5 seconds** ✅
- Prevents user query from hanging
- Fails fast if query is slow

### **5. RBAC Optimization** ✅
- RBAC check: 0.2 seconds
- RBAC fetch: 0.5 seconds
- Falls back to legacy role

---

## 🚀 **QUICK FIXES**

### **Option 1: Disable RBAC (Fastest)**
In Vercel Environment Variables:
```
ENABLE_RBAC=false
```

This skips all RBAC queries, making login faster.

### **Option 2: Check Database URL**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly
3. Test connection: `npx prisma db execute --stdin <<< "SELECT 1"`

### **Option 3: Upgrade Vercel Plan**
- Hobby: 10s timeout (might be too short)
- Pro: 60s timeout (recommended)

---

## 📊 **EXPECTED TIMELINE**

### **Normal Login (4-10 seconds):**
1. Cold start: 2-5 seconds
2. Database connection: 0.5-1 second
3. User query: 0.5-1 second
4. RBAC (if enabled): 0.2-0.5 seconds
5. Token generation: < 0.1 seconds
6. **Total: 4-10 seconds** ✅

### **If Timing Out:**
- Check Vercel logs for where it's hanging
- Check database connection
- Check Vercel plan limits
- Consider disabling RBAC

---

## 🐛 **COMMON ERRORS**

### **Error: "Database connection timeout"**
**Cause:** Database is unreachable or slow  
**Fix:**
1. Check `DATABASE_URL` in Vercel
2. Check database firewall rules
3. Check database server status

### **Error: "Server timeout: Request took too long"**
**Cause:** Function exceeded 25 seconds  
**Fix:**
1. Check Vercel logs for slow operations
2. Optimize database queries
3. Disable RBAC if not needed
4. Upgrade Vercel plan

### **Error: "User query timeout"**
**Cause:** User query taking > 5 seconds  
**Fix:**
1. Check database indexes
2. Check database load
3. Optimize query

---

## 📝 **NEXT STEPS**

1. **Check Vercel Logs** - See where it's hanging
2. **Test Database Connection** - Verify it's reachable
3. **Check Vercel Plan** - Ensure timeout is sufficient
4. **Disable RBAC** - If not needed, set `ENABLE_RBAC=false`

---

**Status:** ✅ **Fixes Applied - Check Vercel Logs for Details**
