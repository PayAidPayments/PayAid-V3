# Cron Job Setup Guide
## Lead Score Recalculation - Hourly Schedule

This guide explains how to set up the automatic lead score recalculation cron job.

---

## Option 1: Vercel Cron (Recommended for Vercel Deployments)

### Setup Steps:

1. **Create `vercel.json` in project root:**
```json
{
  "crons": [
    {
      "path": "/api/cron/recalculate-scores",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. **Deploy to Vercel:**
```bash
vercel deploy
```

3. **Verify in Vercel Dashboard:**
- Go to Settings → Cron Jobs
- Verify the cron job is scheduled

**Schedule:** Runs every hour at minute 0 (e.g., 1:00 PM, 2:00 PM, etc.)

---

## Option 2: GitHub Actions (Free Alternative)

### Setup Steps:

1. **Create `.github/workflows/cron-recalculate-scores.yml`:**
```yaml
name: Recalculate Lead Scores

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  recalculate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Recalculate API
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/recalculate-scores \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

2. **Add Secrets in GitHub:**
- `APP_URL`: Your production app URL (e.g., https://app.payaid.com)
- `CRON_SECRET`: Secret token for authentication

3. **Enable Workflow:**
- Go to Actions tab in GitHub
- Enable the workflow

**Schedule:** Runs every hour

---

## Option 3: Server Cron (Linux/Mac)

### Setup Steps:

1. **Create cron script:**
```bash
#!/bin/bash
# File: scripts/cron-recalculate-scores.sh

APP_URL="https://your-app-url.com"
CRON_SECRET="your-secret-token"

curl -X POST "${APP_URL}/api/cron/recalculate-scores" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json"
```

2. **Make executable:**
```bash
chmod +x scripts/cron-recalculate-scores.sh
```

3. **Add to crontab:**
```bash
crontab -e
```

4. **Add line:**
```
0 * * * * /path/to/scripts/cron-recalculate-scores.sh >> /var/log/lead-scores-cron.log 2>&1
```

**Schedule:** Runs every hour

---

## Option 4: Windows Task Scheduler

### Setup Steps:

1. **Create PowerShell script:**
```powershell
# File: scripts/cron-recalculate-scores.ps1

$appUrl = "https://your-app-url.com"
$cronSecret = "your-secret-token"

Invoke-WebRequest -Uri "${appUrl}/api/cron/recalculate-scores" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer ${cronSecret}"
    "Content-Type" = "application/json"
  }
```

2. **Create Scheduled Task:**
- Open Task Scheduler
- Create Basic Task
- Name: "Recalculate Lead Scores"
- Trigger: Daily, Repeat every 1 hour
- Action: Start a program
- Program: `powershell.exe`
- Arguments: `-File "C:\path\to\scripts\cron-recalculate-scores.ps1"`

**Schedule:** Runs every hour

---

## Security Configuration

### Update `.env` file:
```env
CRON_SECRET=your-random-secret-token-here-min-32-chars
```

### Update cron endpoint security:
The endpoint at `app/api/cron/recalculate-scores/route.ts` includes commented security code. Uncomment and use:

```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## Testing the Cron Job

### Manual Test:
```bash
# Using curl
curl -X POST http://localhost:3000/api/cron/recalculate-scores \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json"

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/recalculate-scores" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer your-secret-token"
    "Content-Type" = "application/json"
  }
```

### Expected Response:
```json
{
  "success": true,
  "message": "Lead scores recalculated",
  "total": 150,
  "success": 148,
  "errors": 2
}
```

---

## Monitoring

### Check Logs:
- **Vercel:** Dashboard → Logs
- **GitHub Actions:** Actions tab → Workflow runs
- **Server:** `/var/log/lead-scores-cron.log` (Linux) or Task Scheduler History (Windows)

### Health Check:
Monitor the endpoint response to ensure:
- `success: true`
- `errors: 0` (or minimal)
- Response time < 30 seconds

---

## Troubleshooting

### Issue: Cron job not running
- **Check schedule syntax:** Use [crontab.guru](https://crontab.guru) to verify
- **Check authentication:** Ensure CRON_SECRET matches
- **Check logs:** Review error messages

### Issue: Scores not updating
- **Check database connection:** Verify DATABASE_URL is correct
- **Check permissions:** Ensure database user has UPDATE permissions
- **Check tenant isolation:** Verify tenantId filtering works

### Issue: Timeout errors
- **Increase timeout:** For large datasets, consider batching
- **Optimize query:** Add indexes on frequently queried fields
- **Reduce frequency:** Run every 2 hours instead of hourly

---

## Recommended Schedule

- **Development:** Every 6 hours (or manual trigger)
- **Production:** Every hour (0 * * * *)
- **High Volume:** Every 30 minutes (0,30 * * * *)

---

**Last Updated:** December 19, 2025
