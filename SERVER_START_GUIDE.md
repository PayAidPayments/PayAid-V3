# Server Start Guide

## Issue: ERR_CONNECTION_REFUSED

This means the Next.js dev server is not running or not accessible.

## Solution

### Option 1: Check the PowerShell Window

A new PowerShell window should have opened with the dev server. Look for:
```
✓ Ready in X.Xs
- Local:        http://localhost:3000
```

**Note:** If port 3000 is busy, it might use 3001, 3002, etc.

### Option 2: Start Server Manually

1. **Open a new terminal/PowerShell**
2. **Navigate to project:**
   ```powershell
   cd "d:\Cursor Projects\PayAid V3"
   ```
3. **Start the server:**
   ```powershell
   npm run dev
   ```
4. **Wait for it to start** (you'll see "Ready in X.Xs")
5. **Note the port** (usually 3000, but could be 3001, 3002, etc.)

### Option 3: Check What Port is Being Used

```powershell
# Check all common ports
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
netstat -ano | findstr ":3002"
```

### Option 4: Kill All Node Processes and Restart

```powershell
# Stop all Node.js processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Start fresh
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

---

## Once Server is Running

1. **Note the port** from the terminal output
2. **Access the test page:**
   - If port 3000: `http://localhost:3000/dashboard/ai/test`
   - If port 3001: `http://localhost:3001/dashboard/ai/test`
   - etc.

3. **Test Ollama:**
   - Click "Run Test Again"
   - Should see both Groq and Ollama results

---

## Troubleshooting

### Port Already in Use
If you see "Port 3000 is in use", Next.js will automatically try 3001, 3002, etc.

**Solution:** Use the port shown in the terminal output.

### Server Won't Start
1. **Check for errors** in the terminal
2. **Check Node.js is installed:**
   ```powershell
   node --version
   npm --version
   ```
3. **Try clearing cache:**
   ```powershell
   npm run build
   # Then
   npm run dev
   ```

### Still Getting ERR_CONNECTION_REFUSED
1. **Check firewall** - Windows Firewall might be blocking
2. **Check if server actually started** - Look at terminal output
3. **Try a different browser** or incognito mode
4. **Check if another app is using the port**

---

## Quick Check Commands

```powershell
# Check if server is running
netstat -ano | findstr ":3000"

# Check Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Kill all Node processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Start server
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

---

## Expected Output

When server starts successfully, you should see:
```
> payaid-v3@0.1.0 dev
> next dev

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in 3.6s
```

Then you can access: `http://localhost:3000/dashboard/ai/test`
