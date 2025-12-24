# Fix Migration Timeout Issue

**Problem:** Migration timeout with Supabase pooler  
**Solution:** Use `db:push` instead of `db:migrate` for Supabase

---

## ✅ **Good News**

Your database connection works! ✅
- Connection successful
- Database is PostgreSQL 17.6
- Only Prisma migrations table exists (need to create app tables)

---

## 🔧 **Solution: Use `db:push` Instead**

Supabase pooler has timeout issues with `db:migrate` (advisory locks). Use `db:push` instead:

```bash
# This pushes schema directly without migrations (works with pooler)
npm run db:push
```

Then seed:
```bash
npm run db:seed
```

---

## 📋 **Complete Fix Steps**

```bash
# 1. Push schema to database (creates all tables)
npm run db:push

# 2. Seed database (creates admin user)
npm run db:seed

# 3. Verify admin user exists
npx tsx scripts/check-admin-user.ts

# 4. Test login
# Go to: http://localhost:3000/login
# Email: admin@demo.com
# Password: Test@1234
```

---

## 🔍 **Difference: `db:push` vs `db:migrate`**

### **`db:migrate`** (Traditional)
- Creates migration files
- Requires advisory locks
- ❌ Times out with Supabase pooler
- ✅ Good for production with direct connection

### **`db:push`** (Direct)
- Pushes schema directly
- No advisory locks needed
- ✅ Works with Supabase pooler
- ✅ Perfect for development

---

## 💡 **For Production**

When deploying to production:
1. Use direct connection (not pooler) for migrations
2. Or use `db:push` if migrations aren't critical
3. Or run migrations manually via Supabase SQL editor

---

## ✅ **Try Now**

Run:
```bash
npm run db:push
npm run db:seed
```

This should work without timeout issues!

