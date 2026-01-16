# 🚀 Quick Start - Development Servers

## **Start Both Servers**

### **Option 1: Using PowerShell (Recommended)**

Open **2 separate PowerShell windows** and run:

**Terminal 1 - Next.js Server:**
```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev
```

**Terminal 2 - WebSocket Server:**
```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev:websocket
```

### **Option 2: Using npm run dev:all (Single Command)**

```powershell
cd "d:\Cursor Projects\PayAid V3"
npm run dev:all
```

This starts both servers in one terminal using `concurrently`.

---

## ✅ **Verify Servers Are Running**

After starting, check:

```powershell
# Check if ports are listening
netstat -ano | Select-String -Pattern ":(3000|3001)"
```

**Expected Output:**
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING
```

---

## 🌐 **Access the Application**

- **Next.js App:** http://localhost:3000
- **WebSocket Server:** ws://localhost:3001

---

## ⚠️ **If Servers Don't Start**

1. **Check for errors** in the terminal output
2. **Verify Node.js is installed:** `node --version`
3. **Verify dependencies:** `npm install`
4. **Check port availability:** Make sure ports 3000 and 3001 aren't in use

---

## 🛑 **Stop Servers**

Press `Ctrl+C` in each terminal window, or:

```powershell
# Stop all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

**Note:** I've attempted to start the servers automatically, but if they're not running, please start them manually using the commands above.
