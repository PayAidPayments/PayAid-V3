# Configure Supabase for PayAid V3

## 🎯 Quick Configuration Steps

### Step 1: Get PostgreSQL Connection String

**You need the PostgreSQL connection string (NOT the API key) for Prisma to work.**

1. Go to: https://supabase.com/dashboard/project/zjcutguakjavahdrytxc
2. Click **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **URI** tab
5. Copy the connection string
6. **Important:** Replace `[YOUR-PASSWORD]` with your actual database password
   - If you don't know it, click **Reset database password** first

**Example format:**
```
postgresql://postgres:YOUR_PASSWORD@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres
```

### Step 2: Update .env File

Open your `.env` file and update:

```env
# Replace with your Supabase PostgreSQL connection string
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public"

# Optional: If you want to use Supabase client library
SUPABASE_URL="https://zjcutguakjavahdrytxc.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY3V0Z3Vha2phdmFoZHJ5dHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTY5NjAsImV4cCI6MjA4MTAzMjk2MH0.2b9fWEG9ssewbdwyMsSHCNuxr4lQkNvPo2BxRa_U30o"
```

### Step 3: Push Database Schema

After updating `.env`, run:

```bash
npx prisma db push
```

This will create all the tables in your Supabase database.

### Step 4: Verify Connection

```bash
npx prisma db studio
```

This opens Prisma Studio where you can view your database tables.

---

## 🔍 Finding Your Database Password

If you don't know your database password:

1. Go to Supabase Dashboard → Settings → Database
2. Click **Reset database password**
3. Enter a new password (save it securely!)
4. Use this password in your `DATABASE_URL`

---

## 📝 Complete .env Example

Here's what your `.env` should look like with Supabase:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:your_password_here@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public"

# Supabase Client (optional)
SUPABASE_URL="https://zjcutguakjavahdrytxc.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY3V0Z3Vha2phdmFoZHJ5dHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTY5NjAsImV4cCI6MjA4MTAzMjk2MH0.2b9fWEG9ssewbdwyMsSHCNuxr4lQkNvPo2BxRa_U30o"

# Redis (still needed)
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate new ones)
JWT_SECRET="generate-random-string"
NEXTAUTH_SECRET="generate-random-string"

# ... rest of your config
```

---

## ✅ Verification Checklist

- [ ] Got PostgreSQL connection string from Supabase Dashboard
- [ ] Updated `DATABASE_URL` in `.env` with correct password
- [ ] Added `SUPABASE_URL` and `SUPABASE_KEY` to `.env` (optional)
- [ ] Ran `npx prisma db push` successfully
- [ ] Verified tables created in Supabase Dashboard or Prisma Studio

---

## 🆘 Common Issues

### "Can't reach database server"
- Double-check the connection string format
- Verify password is correct (no extra spaces)
- Check Supabase project is active

### "Password authentication failed"
- Reset database password in Supabase Dashboard
- Update `.env` with new password

### "Schema 'public' does not exist"
- Make sure `?schema=public` is at the end of `DATABASE_URL`
- Or run: `CREATE SCHEMA IF NOT EXISTS public;` in Supabase SQL Editor

---

**Once configured, you can proceed with development!**
