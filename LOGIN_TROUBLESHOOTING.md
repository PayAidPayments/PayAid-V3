# Login Troubleshooting Guide

**Issue:** Unable to login with `admin@demo.com`

---

## 🔍 **Quick Diagnosis**

Run the diagnostic script:
```bash
npx tsx scripts/check-admin-user.ts
```

This will check:
- ✅ If user exists
- ✅ If password is set
- ✅ If password matches
- ✅ Database connection

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: User Doesn't Exist**

**Symptoms:**
- Error: "Invalid email or password"
- Diagnostic shows: "User NOT FOUND"

**Solution:**
```bash
# Seed the database
npm run db:seed
```

This creates the admin user with:
- Email: `admin@demo.com`
- Password: `Test@1234`

---

### **Issue 2: Database Not Initialized**

**Symptoms:**
- Error: "Table does not exist"
- Database connection errors

**Solution:**
```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Generate Prisma client
npm run db:generate

# 3. Run migrations
npm run db:migrate

# 4. Seed database
npm run db:seed
```

---

### **Issue 3: Wrong Password**

**Symptoms:**
- Error: "Invalid email or password"
- User exists but password doesn't match

**Solution:**
The default password is: `Test@1234`

**To reset password:**
```bash
# Re-seed database (this will reset password)
npm run db:seed
```

---

### **Issue 4: Database Connection Issue**

**Symptoms:**
- Connection errors
- Timeout errors

**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   docker ps | findstr postgres
   ```

2. Check `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/payaid"
   ```

3. Test connection:
   ```bash
   npm run db:studio
   ```

---

## 📋 **Step-by-Step Fix**

### **Complete Reset (Recommended)**

```bash
# 1. Ensure PostgreSQL is running
docker-compose up -d postgres

# 2. Generate Prisma client
npm run db:generate

# 3. Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# 4. Seed database
npm run db:seed

# 5. Verify user exists
npx tsx scripts/check-admin-user.ts
```

### **Login Credentials**

After seeding:
- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

---

## 🧪 **Test Login**

### **Using Browser**
1. Go to: `http://localhost:3000/login`
2. Enter email: `admin@demo.com`
3. Enter password: `Test@1234`
4. Click Login

### **Using API**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Test@1234"}'
```

---

## 🔍 **Debug Steps**

1. **Check Server Logs**
   - Look for login errors in console
   - Check for "User not found" or "Invalid password"

2. **Check Database**
   ```bash
   npm run db:studio
   ```
   - Navigate to User table
   - Search for `admin@demo.com`
   - Verify password field is not null

3. **Run Diagnostic**
   ```bash
   npx tsx scripts/check-admin-user.ts
   ```

---

## ✅ **Expected Behavior**

After successful setup:
- ✅ User exists in database
- ✅ Password is hashed and stored
- ✅ Login API returns JWT token
- ✅ User can access dashboard

---

## 📞 **Still Having Issues?**

1. Check server console for errors
2. Verify database is running
3. Check `.env` file configuration
4. Run diagnostic script
5. Try complete reset (see above)

---

**Last Updated:** December 2025

