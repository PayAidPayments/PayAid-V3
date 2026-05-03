# Reset Admin Password Guide

## Problem
Unable to login with `admin@demo.com` and password `Test@1234`.

## Solutions

### Option 1: Run Database Seed (Recommended)
This will reset the password and ensure all demo data is correct:

```bash
npx tsx prisma/seed.ts
```

Or if you have a seed script in package.json:
```bash
npm run db:seed
```

### Option 2: Use API Endpoint
I've created an API endpoint to reset the password. Make sure your server is running, then:

**Using Browser:**
1. Open: http://localhost:3000/api/admin/reset-password
2. Use a tool like Postman or browser console:
```javascript
fetch('/api/admin/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@demo.com',
    password: 'Test@1234'
  })
})
.then(r => r.json())
.then(console.log)
```

**Using PowerShell:**
```powershell
$body = @{
    email = "admin@demo.com"
    password = "Test@1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/reset-password" -Method POST -ContentType "application/json" -Body $body
```

### Option 3: Direct Database Update
If you have direct database access:

```sql
-- Connect to your database and run:
UPDATE "User" 
SET password = '$2a$10$...' -- bcrypt hash of 'Test@1234'
WHERE email = 'admin@demo.com';
```

To generate the hash, you can use:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Test@1234', 10).then(console.log)"
```

## Updated Seed File
I've updated `prisma/seed.ts` to always update the password when running the seed, so future seed runs will reset it correctly.

## After Resetting
1. Try logging in with:
   - Email: `admin@demo.com`
   - Password: `Test@1234`

2. If it still doesn't work:
   - Check database connection
   - Verify the user exists in the database
   - Check server logs for errors

## Troubleshooting

### Database Not Running
If you see "Can't reach database server", start your database:
- **Docker**: `docker start payaid-postgres` or check your docker-compose
- **Supabase**: Check your DATABASE_URL in .env
- **Local PostgreSQL**: Start the service

### Check Database Connection
Verify your `.env` file has the correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/payaid_v3?schema=public"
```
