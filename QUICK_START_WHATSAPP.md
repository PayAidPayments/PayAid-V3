# WhatsApp One-Click Setup - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Add Environment Variables

Open `.env` file and add:
```bash
INTERNAL_WAHA_BASE_URL=http://127.0.0.1
PAYAID_PUBLIC_URL=http://localhost:3000
```

### Step 2: Regenerate Prisma Client

```bash
# Close Cursor first, then:
npx prisma generate
```

### Step 3: Start Docker

- **Windows:** Open Docker Desktop
- **Linux/Mac:** `sudo systemctl start docker`

### Step 4: Start Dev Server

```bash
npm run dev
```

### Step 5: Test

1. Go to: `http://localhost:3000/dashboard/whatsapp/setup`
2. Enter: Business Name + Phone
3. Click: "Connect WhatsApp"
4. Scan: QR code with WhatsApp
5. Done! ✅

---

## 🎯 What You Get

- ✅ Auto-deployed WAHA containers
- ✅ No technical setup required
- ✅ 2-minute user experience
- ✅ Real-time status updates
- ✅ Zero cost (self-hosted)

---

**That's it!** The implementation is complete and ready to test.
