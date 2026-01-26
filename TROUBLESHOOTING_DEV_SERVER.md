# Troubleshooting: Dev Server Connection Refused

## Issue
`localhost:3000` - ERR_CONNECTION_REFUSED

## Quick Fix

### 1. Start the Development Server

**Option A: Using npm**
```bash
npm run dev
```

**Option B: Using the background process**
The server should already be starting in the background. Wait 10-15 seconds for it to initialize.

### 2. Check if Server is Running

**Windows PowerShell:**
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

**Or check in browser:**
- Wait 15-20 seconds after running `npm run dev`
- Try accessing: http://localhost:3000

### 3. Common Issues & Solutions

#### Issue: Port 3000 Already in Use

**Check what's using port 3000:**
```powershell
netstat -ano | findstr :3000
```

**Kill the process:**
```powershell
# Find the PID from above command, then:
taskkill /PID <PID> /F
```

**Or use a different port:**
```bash
npm run dev -- -p 3001
```
Then access: http://localhost:3001

#### Issue: Prisma Client Not Generated

**Solution:**
```bash
npx prisma generate
npm run dev
```

#### Issue: Database Connection Error

**Check your `.env` file:**
```env
DATABASE_URL="your-database-url"
```

**Test connection:**
```bash
npx prisma db push
```

#### Issue: Missing Dependencies

**Solution:**
```bash
npm install
npm run dev
```

### 4. Verify Server Started Successfully

Look for this output in the terminal:
```
▲ Next.js 16.1.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

### 5. Check for Build Errors

If the server fails to start, check for:
- TypeScript errors
- Missing environment variables
- Database connection issues
- Port conflicts

**View full error:**
```bash
npm run dev 2>&1 | tee dev-server.log
```

### 6. Alternative: Use Different Port

If port 3000 is blocked:
```bash
# Edit package.json dev script:
"dev": "next dev -p 3001 --webpack"

# Or run directly:
npx next dev -p 3001
```

## Quick Start Checklist

- [ ] Run `npm install` (if dependencies changed)
- [ ] Run `npx prisma generate` (if schema changed)
- [ ] Check `.env` file exists and has `DATABASE_URL`
- [ ] Run `npm run dev`
- [ ] Wait 10-15 seconds for server to start
- [ ] Open http://localhost:3000 in browser

## Still Having Issues?

1. **Check terminal output** for specific error messages
2. **Check Windows Firewall** - may be blocking port 3000
3. **Try different browser** - clear cache if needed
4. **Restart terminal** and try again
5. **Check Node.js version**: `node --version` (should be 18+)

## Phase 1 Note

After Phase 1 implementation, make sure:
- Database migrations are complete
- Environment variables are set (JWT_SECRET, etc.)
- Prisma client is generated

If you see Prisma-related errors, run:
```bash
npx prisma generate
npx prisma db push
```
