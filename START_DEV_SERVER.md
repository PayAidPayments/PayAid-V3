# Starting PayAid V3 Development Server

## 🚀 Quick Start

The dev server is now starting in the background. Wait 10-20 seconds for it to compile, then:

**Access the app at:**
```
http://localhost:3000
```

---

## ✅ Verify Server is Running

### Check in Browser:
1. Open: `http://localhost:3000`
2. Should see: PayAid login page or dashboard

### Check in Terminal:
Look for output like:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

---

## 🧪 Test WhatsApp One-Click Setup

Once server is running:

1. **Login:**
   - URL: `http://localhost:3000/login`
   - Email: `admin@demo.com`
   - Password: `Test@1234`

2. **Navigate to WhatsApp Setup:**
   - Click "Setup WhatsApp" in sidebar
   - Or go to: `http://localhost:3000/dashboard/whatsapp/setup`

3. **Test the Flow:**
   - Enter Business Name: "Test Business"
   - Enter Phone: "+919876543210"
   - Click "Connect WhatsApp"
   - Wait for QR code
   - Scan with WhatsApp

---

## 🔧 Troubleshooting

### Issue: Still getting ERR_CONNECTION_REFUSED

**Check if server started:**
```bash
# Check if port 3000 is listening
netstat -ano | Select-String ":3000"
```

**If not running, start manually:**
```bash
npm run dev
```

**Check for errors:**
- Look at terminal output
- Check for TypeScript errors
- Check for missing dependencies

### Issue: Port 3000 Already in Use

**Find what's using port 3000:**
```bash
netstat -ano | Select-String ":3000"
```

**Kill the process:**
```bash
# Get PID from netstat output, then:
taskkill /PID <pid> /F
```

**Or use different port:**
```bash
npm run dev -- -p 3001
```

---

## 📋 Server Status

**Expected Output:**
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
- Ready in Xms
```

**If you see errors:**
- Check Prisma client (may need regeneration)
- Check database connection
- Check environment variables

---

**Server should be starting now!** Wait 10-20 seconds, then refresh `http://localhost:3000`
