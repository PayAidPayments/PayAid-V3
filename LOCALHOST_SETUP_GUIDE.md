# PayAid V3 - Localhost Development Setup Guide

This guide will help you set up and run PayAid V3 on your local machine for development and testing. Once you're satisfied with all features, you can deploy to Vercel.

---

## 🎯 Overview

**Development Strategy:**
- ✅ Run on **localhost** for development and testing
- ✅ Test all modules and features locally
- ✅ Deploy to **Vercel** only when ready for production

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Docker Desktop** installed and running (for PostgreSQL and Redis)
   - Download: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is **running** before proceeding

3. **Git** (optional, for version control)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd "d:\Cursor Projects\PayAid V3"
npm install
```

**Note:** If you encounter peer dependency warnings, you can use:
```bash
npm install --legacy-peer-deps
```

---

### Step 2: Set Up Local Database (PostgreSQL)

You have two options:

#### Option A: Using Docker (Recommended - Easy & Isolated)

```powershell
# Start PostgreSQL container
docker run -d `
  --name payaid-postgres `
  -e POSTGRES_PASSWORD=payaid123 `
  -e POSTGRES_DB=payaid_v3 `
  -p 5432:5432 `
  postgres:14

# Verify it's running
docker ps --filter "name=payaid-postgres"
```

**Connection Details:**
- Host: `localhost`
- Port: `5432`
- Database: `payaid_v3`
- User: `postgres`
- Password: `payaid123`

#### Option B: Using Local PostgreSQL Installation

If you have PostgreSQL installed locally:
- Make sure it's running on port 5432
- Create a database named `payaid_v3`
- Update the `DATABASE_URL` in your `.env` file accordingly

---

### Step 3: Set Up Redis (Optional but Recommended)

Redis is used for caching and queues. For local development:

```powershell
# Start Redis container
docker run -d `
  --name payaid-redis `
  -p 6379:6379 `
  redis:6-alpine

# Verify it's running
docker ps --filter "name=payaid-redis"
```

**Connection Details:**
- Host: `localhost`
- Port: `6379`

---

### Step 4: Configure Environment Variables

Your `.env` file should already exist. Verify it has the following **minimum required** variables for localhost:

```env
# Database - Local PostgreSQL
DATABASE_URL="postgresql://postgres:payaid123@localhost:5432/payaid_v3?schema=public"

# Redis - Local Redis
REDIS_URL="redis://localhost:6379"

# JWT & Auth
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"

# App URLs (Localhost)
NODE_ENV="development"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Encryption Key (Generate a new one for localhost)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-64-character-hex-string-here"
```

**Generate Secrets:**
```powershell
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Optional Variables (for full functionality):**
- `GROQ_API_KEY` - For AI chat features
- `HUGGINGFACE_API_KEY` - For image generation
- `SENDGRID_API_KEY` - For email sending
- `PAYAID_PAYMENTS_API_KEY` - For payment processing
- And others (see `env.example` for complete list)

---

### Step 5: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema (creates all tables)
npm run db:push

# Seed database (creates admin user and sample data)
npm run db:seed
```

**Expected Output:**
- ✅ Prisma client generated
- ✅ All tables created in database
- ✅ Admin user created: `admin@demo.com` / `Test@1234`

---

### Step 6: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

**Access the Application:**
- **Main App:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard

**Default Login Credentials:**
- Email: `admin@demo.com`
- Password: `Test@1234`

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Dependencies installed (`npm install` completed)
- [ ] PostgreSQL running (`docker ps` shows `payaid-postgres`)
- [ ] Redis running (`docker ps` shows `payaid-redis`)
- [ ] `.env` file configured with localhost URLs
- [ ] Database schema pushed (`npm run db:push` successful)
- [ ] Database seeded (`npm run db:seed` successful)
- [ ] Dev server starts (`npm run dev` shows "Ready")
- [ ] Can access http://localhost:3000
- [ ] Can login with `admin@demo.com` / `Test@1234`

---

## 🧪 Testing Your Setup

### 1. Test Database Connection

```bash
npm run db:studio
```

This opens Prisma Studio where you can browse your database tables.

### 2. Test Login

1. Go to: http://localhost:3000/login
2. Enter:
   - Email: `admin@demo.com`
   - Password: `Test@1234`
3. Click "Sign In"
4. You should be redirected to the dashboard

### 3. Test Modules

Navigate through different modules:
- CRM: http://localhost:3000/dashboard/crm
- HR: http://localhost:3000/dashboard/hr
- Finance: http://localhost:3000/dashboard/finance
- And others...

---

## 🔧 Troubleshooting

### Database Connection Error

**Problem:** `Can't reach database server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```powershell
   docker ps --filter "name=payaid-postgres"
   ```
2. If not running, start it:
   ```powershell
   docker start payaid-postgres
   ```
3. Check `DATABASE_URL` in `.env` matches your setup

### Port Already in Use

**Problem:** `Port 3000 is already in use`

**Solutions:**
1. Find and kill the process:
   ```powershell
   netstat -ano | findstr :3000
   # Note the PID, then:
   taskkill /PID <PID> /F
   ```
2. Or use a different port:
   ```bash
   npm run dev -- -p 3001
   ```

### Prisma Client Not Generated

**Problem:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npm run db:generate
```

### Migration Errors

**Problem:** `Migration failed`

**Solutions:**
1. Reset database (⚠️ **WARNING:** This deletes all data):
   ```bash
   npx prisma migrate reset
   ```
2. Or push schema directly:
   ```bash
   npm run db:push
   ```

---

## 📝 Development Workflow

### Daily Development

1. **Start Docker containers** (if not already running):
   ```powershell
   docker start payaid-postgres
   docker start payaid-redis
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Make changes** to your code

4. **Test locally** at http://localhost:3000

### Database Changes

When you modify the Prisma schema:

```bash
# 1. Update schema in prisma/schema.prisma

# 2. Generate Prisma client
npm run db:generate

# 3. Push changes to database
npm run db:push

# Or create a migration (for production)
npm run db:migrate
```

---

## 🚀 When Ready for Vercel Deployment

Once you've tested everything locally and are satisfied:

1. **Review Vercel Configuration:**
   - Check `vercel.json` is properly configured
   - Verify build commands are correct

2. **Set Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from your `.env` file
   - **Important:** Update URLs from `localhost` to your production domain

3. **Deploy:**
   - Connect your GitHub repository to Vercel
   - Push to main branch (auto-deploys)
   - Or manually deploy from Vercel dashboard

4. **Post-Deployment:**
   - Run database migrations on production database
   - Seed production database (if needed)
   - Test all features on production URL

**See:** `DEPLOYMENT_GUIDE.md` for detailed deployment instructions

---

## 📚 Additional Resources

- **Quick Start:** `QUICK_START.md`
- **Environment Variables:** `ENVIRONMENT_VARIABLES_SETUP.md`
- **Database Setup:** `DOCKER_SETUP.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** Check individual module documentation

---

## 🎉 You're All Set!

Your PayAid V3 application is now running on localhost. You can:

- ✅ Develop and test all features locally
- ✅ Make changes without affecting production
- ✅ Test modules independently
- ✅ Debug issues easily
- ✅ Deploy to Vercel when ready

**Happy Coding! 🚀**

---

**Last Updated:** December 31, 2025

