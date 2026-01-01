# 🚀 PayAid V3 - Localhost Quick Start

**Get running on localhost in 5 minutes!**

---

## ⚡ Quick Setup (5 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Database (Docker)
```powershell
# PostgreSQL
docker run -d --name payaid-postgres -e POSTGRES_PASSWORD=payaid123 -e POSTGRES_DB=payaid_v3 -p 5432:5432 postgres:14

# Redis (optional)
docker run -d --name payaid-redis -p 6379:6379 redis:6-alpine
```

### 3. Configure .env
Make sure your `.env` has:
```env
DATABASE_URL="postgresql://postgres:payaid123@localhost:5432/payaid_v3?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Initialize Database
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start Dev Server
```bash
npm run dev
```

**Access:** http://localhost:3000  
**Login:** `admin@demo.com` / `Test@1234`

---

## ✅ Verify It Works

1. Open http://localhost:3000
2. Click "Login"
3. Enter credentials above
4. You should see the dashboard!

---

## 📚 Full Guide

For detailed setup instructions, see: **`LOCALHOST_SETUP_GUIDE.md`**

---

## 🚀 When Ready for Vercel

Once you've tested everything locally:
1. Review `DEPLOYMENT_GUIDE.md`
2. Set environment variables in Vercel dashboard
3. Deploy!

---

**Happy Coding! 🎉**



