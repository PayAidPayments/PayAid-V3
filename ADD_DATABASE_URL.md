# Add DATABASE_URL to Vercel

## Quick Steps

1. **Get your Supabase connection string:**
   - Go to: https://supabase.com/dashboard/project/zjcutguakjavahdrytxc
   - Settings → Database → Connection Pooling
   - Copy **Transaction** mode connection string
   - Replace `[PASSWORD]` with your actual password
   - Add `?schema=public` at the end

2. **Add via CLI:**
   ```powershell
   echo "your-connection-string-here" | vercel env add DATABASE_URL production
   ```

3. **Or add via Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select project: payaid-v3
   - Settings → Environment Variables
   - Add `DATABASE_URL` with your connection string

## Connection String Format

**Pooler (Recommended for Vercel):**
```
postgresql://postgres.zjcutguakjavahdrytxc:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public
```

**Direct Connection (Alternative):**
```
postgresql://postgres:YOUR_PASSWORD@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public
```

**Important:**
- URL-encode special characters in password (e.g., `@` becomes `%40`)
- Must include `?schema=public` at the end
- Use pooler URL (port 6543) for better performance on Vercel

