# Supabase Setup Guide for PayAid V3

## ✅ Your Supabase Credentials

- **Project URL:** https://zjcutguakjavahdrytxc.supabase.co
- **API Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY3V0Z3Vha2phdmFoZHJ5dHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTY5NjAsImV4cCI6MjA4MTAzMjk2MH0.2b9fWEG9ssewbdwyMsSHCNuxr4lQkNvPo2BxRa_U30o

## 🔑 Important: Two Types of Credentials

### 1. **Supabase API Key** (for Supabase Client)
- Used for: Authentication, Storage, Realtime features
- Already provided above
- Add to `.env` as `SUPABASE_KEY`

### 2. **PostgreSQL Connection String** (for Prisma)
- Used for: Database queries via Prisma ORM
- **You need to get this from Supabase Dashboard**

## 📋 Steps to Get PostgreSQL Connection String

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `zjcutguakjavahdrytxc`

2. **Navigate to Database Settings:**
   - Click on **Settings** (gear icon) in the left sidebar
   - Click on **Database** in the settings menu

3. **Get Connection String:**
   - Scroll down to **Connection string** section
   - Select **URI** tab
   - Copy the connection string (it looks like):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres
     ```
   - **Note:** Replace `[YOUR-PASSWORD]` with your actual database password
   - If you don't know your password, click **Reset database password** to set a new one

4. **Update `.env` file:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public"
   ```

## 🔐 Alternative: Connection Pooling (Recommended for Production)

Supabase also provides a connection pooling URL that's better for serverless/edge functions:

1. In Database settings, look for **Connection pooling**
2. Use the **Transaction** mode connection string
3. It will look like:
   ```
   postgresql://postgres.zjcutguakjavahdrytxc:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

**For development, use the direct connection string. For production, use the pooling URL.**

## ✅ Quick Setup Checklist

- [ ] Get PostgreSQL connection string from Supabase Dashboard
- [ ] Update `DATABASE_URL` in `.env` file
- [ ] Add `SUPABASE_URL` to `.env` (optional, for Supabase client)
- [ ] Add `SUPABASE_KEY` to `.env` (optional, for Supabase client)
- [ ] Run `npx prisma db push` to create tables
- [ ] Verify connection works

## 🚀 After Configuration

Once you have the PostgreSQL connection string:

```bash
# Update .env with DATABASE_URL
# Then push schema:
npx prisma db push

# Verify connection:
npx prisma db studio
```

## 📝 Example .env Configuration

```env
# Supabase PostgreSQL Connection (for Prisma)
DATABASE_URL="postgresql://postgres:your_password@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public"

# Supabase Client (optional - if using Supabase client library)
SUPABASE_URL="https://zjcutguakjavahdrytxc.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY3V0Z3Vha2phdmFoZHJ5dHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTY5NjAsImV4cCI6MjA4MTAzMjk2MH0.2b9fWEG9ssewbdwyMsSHCNuxr4lQkNvPo2BxRa_U30o"
```

## ⚠️ Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Database password** - Keep it secure, don't share publicly
3. **API Key** - The anon key is safe for client-side use, but keep it private in server code
4. **Connection String** - Contains password, treat as highly sensitive

## 🆘 Troubleshooting

### "Can't reach database server"
- Verify the connection string is correct
- Check if your IP is allowed in Supabase (Settings > Database > Connection Pooling)
- Supabase allows connections from anywhere by default, but check firewall rules

### "Password authentication failed"
- Reset your database password in Supabase Dashboard
- Update `DATABASE_URL` with the new password

### "Schema 'public' does not exist"
- Add `?schema=public` to the end of your connection string
- Or create the schema manually in Supabase SQL Editor

---

**Next Step:** Get your PostgreSQL connection string from Supabase Dashboard and update `.env` file!
