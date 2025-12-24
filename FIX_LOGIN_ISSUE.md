# Fix Login Issue - Database Not Initialized

**Problem:** Unable to login with `admin@demo.com`  
**Root Cause:** Database tables don't exist yet

---

## 🔧 **Quick Fix**

Run these commands in order:

```bash
# 1. Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# 2. Generate Prisma client
npm run db:generate

# 3. Run database migrations (creates tables)
npm run db:migrate

# 4. Seed database (creates admin user)
npm run db:seed
```

After running these commands, you can login with:
- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

---

## 📋 **Step-by-Step Explanation**

### **Step 1: Start Database**
```bash
docker-compose up -d postgres
```
This starts PostgreSQL in Docker. If you're using a local PostgreSQL, make sure it's running.

### **Step 2: Generate Prisma Client**
```bash
npm run db:generate
```
This generates the Prisma client based on your schema.

### **Step 3: Create Tables**
```bash
npm run db:migrate
```
This creates all the database tables (User, Tenant, etc.)

### **Step 4: Create Admin User**
```bash
npm run db:seed
```
This creates the admin user with email `admin@demo.com` and password `Test@1234`

---

## ✅ **Verify It Works**

After running the commands above:

1. **Check user exists:**
   ```bash
   npx tsx scripts/check-admin-user.ts
   ```

2. **Try logging in:**
   - Go to: `http://localhost:3000/login`
   - Email: `admin@demo.com`
   - Password: `Test@1234`

---

## 🐛 **If Still Not Working**

### **Check Database Connection**

Verify your `.env` file has:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payaid"
```

### **Check PostgreSQL is Running**

```bash
# Check Docker containers
docker ps

# Or check PostgreSQL service
# (Windows) Check Services app
# (Mac/Linux) sudo systemctl status postgresql
```

### **Reset Everything**

If you want to start fresh:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then seed again
npm run db:seed
```

---

## 📝 **What Happened?**

The error `The table public.User does not exist` means:
- Database is connected ✅
- But tables haven't been created yet ❌

Running `npm run db:migrate` creates all the tables, and `npm run db:seed` creates the admin user.

---

**Run the commands above and you should be able to login!**

