# Database Commands - Quick Reference

**Common mistake:** `npm run db:g` ❌  
**Correct command:** `npm run db:generate` ✅

---

## 📋 **All Database Commands**

### **Setup Commands**
```bash
# Generate Prisma client (required before migrations)
npm run db:generate

# Create database tables (run migrations)
npm run db:migrate

# Seed database with sample data (creates admin user)
npm run db:seed
```

### **Development Commands**
```bash
# Push schema changes without migrations (dev only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### **Complete Setup Sequence**
```bash
# Step 1: Generate Prisma client
npm run db:generate

# Step 2: Create tables
npm run db:migrate

# Step 3: Create admin user and sample data
npm run db:seed
```

---

## 🔧 **Common Issues**

### **Issue: "Missing script: db:g"**
**Problem:** Typo in command  
**Solution:** Use `npm run db:generate` (full command)

### **Issue: "Table does not exist"**
**Problem:** Migrations not run  
**Solution:** Run `npm run db:migrate`

### **Issue: "Cannot find module @prisma/client"**
**Problem:** Prisma client not generated  
**Solution:** Run `npm run db:generate`

---

## ✅ **Quick Setup Checklist**

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Run migrations
npm run db:migrate

# 4. Seed database
npm run db:seed

# 5. Verify admin user exists
npx tsx scripts/check-admin-user.ts

# 6. Start server
npm run dev
```

---

## 📝 **Command Reference**

| Command | What It Does |
|---------|-------------|
| `npm run db:generate` | Generates Prisma client from schema |
| `npm run db:migrate` | Creates/updates database tables |
| `npm run db:push` | Pushes schema changes (dev only) |
| `npm run db:seed` | Seeds database with sample data |
| `npm run db:studio` | Opens database GUI |

---

## 🎯 **For Your Current Issue**

Run these commands in order:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Then verify:
```bash
npx tsx scripts/check-admin-user.ts
```

---

**Note:** Always use the full command names, not abbreviations!

