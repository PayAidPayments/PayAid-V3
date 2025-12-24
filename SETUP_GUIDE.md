# PayAid V3 - Setup Guide

**Status:** ✅ Code Complete | ⚠️ Database Setup Required

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Set Up Database**

#### **Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Or manually:
docker run --name payaid-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=payaid \
  -p 5432:5432 \
  -d postgres:15
```

#### **Option B: Local PostgreSQL**
- Install PostgreSQL locally
- Create database: `payaid`
- Update `.env` with connection string

### **3. Configure Environment Variables**

Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/payaid"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# PayAid Payment Gateway
PAYAID_API_KEY="your-api-key"
PAYAID_SALT="your-salt"
PAYAID_BASE_URL="https://pg-api-url"

# JWT
JWT_SECRET="your-jwt-secret"

# Email (optional)
EMAIL_SERVICE_API_KEY="your-email-api-key"
```

### **4. Run Database Migrations**
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema (development)
npm run db:push
```

### **5. Seed Database**
```bash
# Seed basic data (admin user, modules, etc.)
npm run db:seed
```

### **6. Start Development Server**
```bash
npm run dev
```

### **7. Access Application**
- Frontend: http://localhost:3000
- App Store: http://localhost:3000/app-store
- Admin: http://localhost:3000/dashboard/admin/revenue
- Login: Use credentials from seed data (usually `admin@demo.com`)

---

## ✅ **Verification**

### **Run Tests**
```bash
# Test App Store flow
npx tsx scripts/test-app-store-flow.ts

# Test Payment flow
npx tsx scripts/test-payment-flow.ts
```

### **Check Database**
```bash
# Open Prisma Studio
npm run db:studio
```

---

## 📋 **Pre-Launch Checklist**

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] PayAid webhook URL configured
- [ ] Email service configured
- [ ] SSL certificate installed
- [ ] Monitoring tools set up
- [ ] Backup strategy in place

See `LAUNCH_CHECKLIST.md` for detailed steps.

---

## 🔧 **Troubleshooting**

### **Database Connection Issues**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists
- Check firewall/port access

### **Migration Issues**
- Run `npm run db:generate` first
- Check Prisma schema syntax
- Verify database permissions

### **API Errors**
- Check server logs
- Verify environment variables
- Ensure database is initialized
- Check authentication tokens

---

## 📚 **Additional Resources**

- **Security:** See `SECURITY_CHECKLIST.md`
- **Performance:** See `PERFORMANCE_OPTIMIZATION.md`
- **Launch:** See `LAUNCH_CHECKLIST.md`
- **Testing:** See test scripts in `scripts/`

---

**Status:** ✅ Code Complete | ⚠️ Setup Required
