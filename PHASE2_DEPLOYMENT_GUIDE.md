# 🚀 Phase 2: Deployment Guide

**Date:** December 2025  
**Status:** ⏳ **PENDING**  
**Purpose:** Guide for deploying modules to subdomains

---

## 🌐 **Subdomain Architecture**

### **Subdomain Mapping:**

```
payaid.io              → Core module (auth, billing, admin)
crm.payaid.io          → CRM module
invoicing.payaid.io    → Invoicing module
accounting.payaid.io   → Accounting module
hr.payaid.io           → HR module
whatsapp.payaid.io     → WhatsApp module
analytics.payaid.io    → Analytics module
```

---

## 🔧 **DNS Configuration**

### **DNS Records:**

```
Type    Name              Value
A       payaid.io         → Load Balancer IP
CNAME   *.payaid.io       → payaid.io
```

Or use individual A records:
```
A       crm.payaid.io     → Module Server IP
A       invoicing.payaid.io → Module Server IP
...
```

---

## 🖥️ **Server Configuration**

### **Option 1: Single Server (All Modules)**

**Nginx Configuration:**

```nginx
# Core module
server {
    server_name payaid.io;
    location / {
        proxy_pass http://localhost:3000;
    }
}

# CRM module
server {
    server_name crm.payaid.io;
    location / {
        proxy_pass http://localhost:3001;
    }
}

# Invoicing module
server {
    server_name invoicing.payaid.io;
    location / {
        proxy_pass http://localhost:3002;
    }
}

# ... repeat for other modules
```

---

### **Option 2: Separate Servers (Recommended)**

Each module on its own server/container:

```
Server 1: payaid.io (Core) - Port 3000
Server 2: crm.payaid.io - Port 3000
Server 3: invoicing.payaid.io - Port 3000
...
```

---

## 🐳 **Docker Configuration**

### **Docker Compose Template:**

```yaml
version: '3.8'

services:
  core:
    build: ./payaid-core
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=${REDIS_URL}
    networks:
      - payaid-network

  crm:
    build: ./payaid-crm
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CORE_AUTH_URL=http://core:3000
      - OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
    networks:
      - payaid-network
    depends_on:
      - core

  invoicing:
    build: ./payaid-invoicing
    ports:
      - "3002:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CORE_AUTH_URL=http://core:3000
      - OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
    networks:
      - payaid-network
    depends_on:
      - core

  # ... other modules

networks:
  payaid-network:
    driver: bridge
```

---

## ☁️ **Vercel Deployment**

### **Core Module:**

1. Connect GitHub repository
2. Set environment variables
3. Deploy to `payaid.io`

### **Module Deployment:**

1. Connect module repository
2. Set environment variables:
   - `CORE_AUTH_URL=https://payaid.io`
   - `OAUTH_CLIENT_ID=...`
   - `OAUTH_CLIENT_SECRET=...`
   - `DATABASE_URL=...`
3. Deploy to subdomain (e.g., `crm.payaid.io`)

---

## 🔐 **Environment Variables**

### **Core Module:**

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://...
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
ENCRYPTION_KEY=...
```

### **Module (Example: CRM):**

```env
DATABASE_URL=postgresql://... (same as core)
CORE_AUTH_URL=https://payaid.io
OAUTH_CLIENT_ID=... (same as core)
OAUTH_CLIENT_SECRET=... (same as core)
JWT_SECRET=... (same as core)
NEXT_PUBLIC_MODULE_URL=https://crm.payaid.io
MODULE_ID=crm
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment** ⏳
- [ ] All shared packages published (or configured for local use)
- [ ] All modules tested locally
- [ ] OAuth2 SSO tested
- [ ] Database migrations ready
- [ ] Environment variables documented

### **Staging Deployment** ⏳
- [ ] Deploy core to staging.payaid.io
- [ ] Deploy modules to staging subdomains
- [ ] Configure DNS
- [ ] Test authentication flow
- [ ] Test cross-module navigation
- [ ] Test license checking
- [ ] Performance testing

### **Production Deployment** ⏳
- [ ] Deploy core to payaid.io
- [ ] Deploy modules to production subdomains
- [ ] Configure DNS
- [ ] SSL certificates configured
- [ ] Monitoring set up
- [ ] Backup procedures in place
- [ ] Rollback plan ready

---

## 🔄 **Rollback Plan**

If issues occur:

1. **Immediate:** Route traffic back to monolith
2. **DNS:** Update DNS to point to monolith
3. **Database:** No changes needed (shared database)
4. **Code:** Keep module code for debugging

---

**Status:** ⏳ **PENDING - Ready for Implementation**
