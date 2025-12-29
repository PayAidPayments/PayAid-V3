# Database Connection Error - Troubleshooting Guide

**Date:** December 29, 2025  
**Status:** 🔧 **Enhanced Error Handling**

---

## 🔍 **Error Detection**

The dashboard now detects database connection errors and provides specific troubleshooting steps based on the error type.

---

## 🚨 **Common Database Connection Errors**

### 1. **P1001 - Connection Timeout**
**Error:** `Database connection timeout`

**Possible Causes:**
- Database server is down
- Database server is paused (Supabase free tier)
- Network connectivity issues
- Firewall blocking connection
- Wrong connection string

**Solutions:**
1. **If using Supabase:**
   - Check if project is paused: https://supabase.com/dashboard
   - Resume the project if paused
   - Wait 1-2 minutes for project to activate

2. **Check DATABASE_URL:**
   - Verify `DATABASE_URL` is set in environment variables
   - Check if connection string is correct
   - Try using direct connection instead of pooler

3. **Network/Firewall:**
   - Check if database server is accessible
   - Verify firewall rules allow connections
   - Try from a different network

---

### 2. **P1000 - Authentication Failed**
**Error:** `Database authentication failed`

**Possible Causes:**
- Incorrect database password
- Wrong username
- Database credentials changed
- Connection string format incorrect

**Solutions:**
1. Verify `DATABASE_URL` format:
   ```
   postgresql://username:password@host:port/database?schema=public
   ```

2. Check credentials in Supabase/Vercel:
   - Go to Supabase Dashboard → Settings → Database
   - Copy the connection string
   - Update `DATABASE_URL` in Vercel environment variables

---

### 3. **P1002 - Connection Timeout (Pooler)**
**Error:** `Database connection timeout (pooler)`

**Possible Causes:**
- Using connection pooler that's not responding
- Pooler URL incorrect
- Pooler service down

**Solutions:**
1. Try direct connection URL:
   - Remove `?pgbouncer=true` from connection string
   - Use direct connection port (usually 5432)

2. Check Supabase connection strings:
   - Session mode (direct): Use for migrations
   - Transaction mode (pooler): Use for application

---

### 4. **ENOTFOUND - Hostname Not Found**
**Error:** `Database hostname not found`

**Possible Causes:**
- Database server paused (Supabase free tier)
- Incorrect hostname in connection string
- DNS resolution failure

**Solutions:**
1. **If using Supabase:**
   - Check project status in dashboard
   - Resume if paused
   - Verify hostname matches project reference

2. **Verify connection string:**
   - Check hostname is correct
   - Ensure no typos in URL

---

### 5. **ECONNREFUSED - Connection Refused**
**Error:** `Database connection refused`

**Possible Causes:**
- Database server not running
- Wrong port number
- Firewall blocking connection
- Database service stopped

**Solutions:**
1. Check database server status
2. Verify port number (usually 5432 for PostgreSQL)
3. Check firewall rules
4. Restart database service if needed

---

## 🔧 **Enhanced Error Handling**

The dashboard stats API now:
- ✅ Detects all Prisma error codes (P1000-P1017)
- ✅ Provides specific error messages based on error type
- ✅ Includes troubleshooting hints in error response
- ✅ Logs detailed error information for debugging

**Files Enhanced:**
- `app/api/dashboard/stats/route.ts` - Better error detection and messages
- `app/dashboard/page.tsx` - Enhanced error display with troubleshooting steps

---

## 🧪 **Testing Database Connection**

### Option 1: Health Check Endpoint
Visit: `/api/health/db`

This endpoint will:
- Test database connection
- Show connection status
- Display error details if connection fails

### Option 2: Test Script
```bash
npx tsx scripts/test-db-connection.ts
```

---

## 📋 **Quick Checklist**

When you see a database connection error:

- [ ] Check if `DATABASE_URL` is set in environment variables
- [ ] Verify database server is running
- [ ] If using Supabase, check if project is paused
- [ ] Try using direct connection URL instead of pooler
- [ ] Check firewall/network settings
- [ ] Verify database credentials are correct
- [ ] Check Vercel environment variables (if deployed)
- [ ] Test connection using health check endpoint

---

## 🚀 **For Production (Vercel)**

### Check Environment Variables:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set
3. Ensure it's set for Production environment
4. Check if connection string is correct

### Common Vercel Issues:
- Environment variable not set for production
- Connection string using wrong environment
- Supabase project paused (free tier)
- Connection pooler issues

---

## ✅ **Enhanced Features**

1. **Better Error Messages:**
   - Specific messages based on error code
   - Actionable troubleshooting steps
   - Clear indication of what's wrong

2. **Health Check Button:**
   - Added "Check Database Health" button in error display
   - Opens health check endpoint in new tab
   - Provides detailed connection status

3. **Comprehensive Error Detection:**
   - Detects all Prisma error codes
   - Catches connection-related errors
   - Provides context-specific solutions

---

*Last Updated: December 29, 2025*

