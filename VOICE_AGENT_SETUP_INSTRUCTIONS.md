# Voice Agent Setup Instructions

## ✅ Database Migration Required

The new features (Squads and A/B Testing) require database schema updates. Follow these steps:

### Step 1: Stop Running Servers

**Important:** Stop all Node.js processes before running Prisma commands to avoid file lock errors.

**Windows PowerShell:**
```powershell
# Stop all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Or manually:**
- Stop the Next.js dev server (Ctrl+C in terminal)
- Stop the WebSocket server (Ctrl+C in terminal)
- Close any other Node processes

### Step 2: Generate Prisma Client

```bash
cd "d:\Cursor Projects\PayAid V3"
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (v5.x.x) to .\node_modules\@prisma\client
```

### Step 3: Push Schema to Database

```bash
npx prisma db push
```

**Expected Output:**
```
✔ The database is already in sync with the Prisma schema.
```

Or if changes are detected:
```
✔ Database synchronized successfully.
```

### Step 4: Verify New Models

You can verify the new models were created:

```bash
npx prisma studio
```

Then check for:
- `VoiceAgentSquad` table
- `VoiceAgentSquadMember` table
- `VoiceAgentExperiment` table
- `VoiceAgentExperimentAssignment` table

### Step 5: Restart Servers

After migration is complete, restart your servers:

```bash
# Terminal 1 - Next.js
npm run dev

# Terminal 2 - WebSocket
npm run dev:websocket

# Or both together
npm run dev:all
```

---

## 🔧 Troubleshooting

### Error: "EPERM: operation not permitted"

**Cause:** Node.js process is using the Prisma client file.

**Solution:**
1. Stop all Node.js processes (see Step 1)
2. Wait 2-3 seconds
3. Retry `npx prisma generate`

### Error: "Database connection failed"

**Solution:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Ensure your database server is running
3. Verify network connectivity

### Error: "Model not found"

**Solution:**
1. Ensure `npx prisma generate` completed successfully
2. Restart your development server
3. Check that `prisma/schema.prisma` includes the new models

---

## 📋 New Database Models

### VoiceAgentSquad
- Multi-agent orchestration groups
- Stores squad configuration and routing rules

### VoiceAgentSquadMember
- Links agents to squads
- Stores priority and routing conditions

### VoiceAgentExperiment
- A/B testing experiments
- Stores variants and traffic split configuration

### VoiceAgentExperimentAssignment
- Tracks which variant was assigned to each call
- Stores call-specific metrics

---

## ✅ Verification Checklist

After completing the migration:

- [ ] `npx prisma generate` completed without errors
- [ ] `npx prisma db push` completed successfully
- [ ] New tables visible in database (via Prisma Studio or database client)
- [ ] No TypeScript errors in IDE
- [ ] Development server starts without errors
- [ ] Can import new modules: `import { getSquadRouter } from '@/lib/voice-agent/squad-router'`

---

## 🚀 Next Steps After Migration

1. **Test Squad Routing:**
   ```typescript
   import { getSquadRouter } from '@/lib/voice-agent/squad-router'
   const router = getSquadRouter()
   const agentId = await router.routeCall(squadId, { phone: '+1234567890' })
   ```

2. **Test A/B Testing:**
   ```typescript
   import { getABTestingFramework } from '@/lib/voice-agent/ab-testing'
   const abTesting = getABTestingFramework()
   const variantId = await abTesting.assignVariant(experimentId, callId)
   ```

3. **Create API Endpoints** (optional):
   - Squad management endpoints
   - Experiment management endpoints
   - Results endpoints

---

**Status:** Ready for migration once Node processes are stopped.
