# PayAid V3 - Quick Start Guide

**Get up and running in 5 minutes!**

---

## ⚡ **Quick Start**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start Database**
```bash
# Using Docker (recommended)
docker-compose up -d postgres

# Or use existing PostgreSQL
# Make sure PostgreSQL is running on port 5432
```

### **3. Configure Environment**
Create `.env` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payaid"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
JWT_SECRET="your-secret-key-change-in-production"
PAYAID_API_KEY="your-payaid-api-key"
PAYAID_SALT="your-payaid-salt"
```

### **4. Initialize Database**
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (creates admin user and sample data)
npm run db:seed
```

### **5. Start Server**
```bash
npm run dev
```

### **6. Access Application**
- **Frontend:** http://localhost:3000
- **App Store:** http://localhost:3000/app-store
- **Admin:** http://localhost:3000/dashboard/admin/revenue
- **Login:** `admin@demo.com` / `admin123` (from seed)

---

## ✅ **Verify Installation**

### **Check Database**
```bash
npm run db:studio
```
Opens Prisma Studio - verify tables exist.

### **Run Tests**
```bash
npx tsx scripts/test-app-store-flow.ts
```

---

## 🎯 **What's Next?**

1. **Explore App Store**
   - Visit `/app-store`
   - Browse modules
   - Add to cart

2. **Test Payment Flow**
   - Go through checkout
   - Test payment (use test mode)
   - Verify license activation

3. **Check Admin Panel**
   - View revenue dashboard
   - Manage tenants
   - View usage statistics

---

## 🐛 **Troubleshooting**

### **Database Connection Error**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists

### **Migration Errors**
- Run `npm run db:generate` first
- Check Prisma schema syntax
- Verify database permissions

### **Port Already in Use**
- Change port: `npm run dev -- -p 3001`
- Or kill process using port 3000

---

## 📚 **Need More Help?**

- **Detailed Setup:** See `SETUP_GUIDE.md`
- **Launch Guide:** See `LAUNCH_CHECKLIST.md`
- **Security:** See `SECURITY_CHECKLIST.md`

---

**Happy Coding! 🚀**
