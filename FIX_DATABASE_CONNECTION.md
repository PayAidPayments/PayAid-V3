# Fix Database Connection Issue

**Problem:** Database connection timeout to Supabase  
**Error:** `Timed out trying to acquire a postgres advisory lock`

---

## 🔍 **Issue Analysis**

Your database connection is pointing to:
- **Host:** `aws-1-ap-northeast-2.pooler.supabase.com:5432`
- **Type:** Supabase Connection Pooler
- **Status:** Connection timeout

---

## 🔧 **Solutions**

### **Solution 1: Use Direct Connection (Recommended)**

Supabase pooler can have timeout issues. Use direct connection instead:

1. **Get Direct Connection String from Supabase:**
   - Go to Supabase Dashboard
   - Project Settings → Database
   - Find "Connection string" → "Direct connection" (not Pooler)
   - Copy the connection string

2. **Update `.env` file:**
   ```env
   # Change from pooler to direct connection
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-northeast-2.compute.amazonaws.com:5432/postgres"
   ```

3. **Retry migration:**
   ```bash
   npm run db:migrate
   ```

---

### **Solution 2: Use Local PostgreSQL**

If Supabase continues to have issues, use local PostgreSQL:

1. **Start Local PostgreSQL:**
   ```bash
   # Using Docker
   docker-compose up -d postgres
   
   # Or install PostgreSQL locally
   ```

2. **Update `.env` file:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payaid"
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

---

### **Solution 3: Fix Supabase Pooler Connection**

If you want to keep using Supabase pooler:

1. **Check Supabase Status:**
   - Verify Supabase project is active
   - Check if project is paused (free tier auto-pauses)

2. **Use Transaction Mode (for migrations):**
   ```env
   # Add ?pgbouncer=true for pooler
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true"
   ```

3. **Or use Session Mode:**
   ```env
   # Use port 6543 for session mode (better for migrations)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
   ```

---

## 📋 **Quick Fix Steps**

### **Option A: Switch to Direct Connection**

1. Get direct connection string from Supabase dashboard
2. Update `.env` file
3. Run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### **Option B: Use Local PostgreSQL**

1. Start PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payaid"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

---

## 🔍 **Check Current Connection**

Check your `.env` file:
```bash
# View current DATABASE_URL (don't show password)
cat .env | findstr DATABASE_URL
```

---

## ✅ **After Fixing Connection**

Once connection works:

1. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

2. **Seed database:**
   ```bash
   npm run db:seed
   ```

3. **Verify admin user:**
   ```bash
   npx tsx scripts/check-admin-user.ts
   ```

4. **Test login:**
   - Go to: `http://localhost:3000/login`
   - Email: `admin@demo.com`
   - Password: `Test@1234`

---

## 💡 **Recommended Approach**

**For Development:** Use local PostgreSQL (easier, faster, no connection issues)  
**For Production:** Use Supabase direct connection (not pooler)

---

**Which solution would you like to try?**

