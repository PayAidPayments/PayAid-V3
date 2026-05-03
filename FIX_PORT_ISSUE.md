# Fix: Server Port Changing Issue

## Problem
The dev server keeps changing ports (3000 → 3001 → 3002 → 3003) because old Node processes are still running.

## Solution

### Option 1: Kill All Node Processes (Recommended)
```powershell
# Kill all Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a few seconds
Start-Sleep -Seconds 2

# Start server
npm run dev
```

### Option 2: Use a Specific Port
You can force Next.js to use a specific port:

```powershell
# Set PORT environment variable
$env:PORT="3000"; npm run dev
```

Or add to `.env`:
```env
PORT=3000
```

### Option 3: Kill Specific Port Process
```powershell
# Find process on port 3000
netstat -ano | findstr ":3000"

# Kill by PID (replace XXXX with actual PID)
Stop-Process -Id XXXX -Force
```

## Current Status
I've killed the old processes and restarted the server. It should now be running on port 3000.

**Check:** `http://localhost:3000/dashboard/ai`

If it's still on a different port, check the terminal output for the actual port number.
