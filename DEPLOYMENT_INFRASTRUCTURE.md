# Deployment Infrastructure

**Date:** December 2025  
**Status:** ⏳ **READY FOR SETUP**  
**Purpose:** Separate deployments for each module

---

## 🏗️ **Architecture**

### **Module Deployment Structure**

```
┌─────────────────────────────────────────┐
│         Core Module (payaid.io)         │
│  - OAuth2 Provider                      │
│  - License Management                   │
│  - App Store                            │
│  - Main Dashboard                       │
└─────────────────────────────────────────┘
              │
              ├─── OAuth2 SSO ───┐
              │                  │
              ▼                  ▼
┌─────────────────────┐  ┌─────────────────────┐
│  CRM Module         │  │  Finance Module     │
│  (crm.payaid.io)    │  │  (finance.payaid.io)│
└─────────────────────┘  └─────────────────────┘
              │                  │
              └──────────────────┘
              │
              ▼
    [Other Modules...]
```

---

## 📦 **Module Repositories**

### **1. Core Module**
- **Repository:** `payaid-core`
- **Domain:** `payaid.io`
- **Port:** 3000
- **Services:**
  - OAuth2 Provider
  - License Management
  - App Store
  - Main Dashboard
  - Settings
  - Admin Panel

### **2. CRM Module**
- **Repository:** `payaid-crm`
- **Domain:** `crm.payaid.io`
- **Port:** 3001
- **Services:**
  - Contacts
  - Deals
  - Products
  - Orders
  - Tasks

### **3. Finance Module**
- **Repository:** `payaid-finance`
- **Domain:** `finance.payaid.io`
- **Port:** 3002
- **Services:**
  - Invoices
  - Accounting
  - GST Reports

### **4. HR Module**
- **Repository:** `payaid-hr`
- **Domain:** `hr.payaid.io`
- **Port:** 3003
- **Services:**
  - Employees
  - Hiring
  - Payroll
  - Leave Management

### **5. Marketing Module**
- **Repository:** `payaid-marketing`
- **Domain:** `marketing.payaid.io`
- **Port:** 3004
- **Services:**
  - Campaigns
  - Social Media
  - Email Templates
  - Events

### **6. WhatsApp Module**
- **Repository:** `payaid-whatsapp`
- **Domain:** `whatsapp.payaid.io`
- **Port:** 3005
- **Services:**
  - WhatsApp Accounts
  - Inbox
  - Sessions

### **7. Analytics Module**
- **Repository:** `payaid-analytics`
- **Domain:** `analytics.payaid.io`
- **Port:** 3006
- **Services:**
  - Analytics Dashboard
  - Custom Reports
  - Custom Dashboards

### **8. AI Studio Module**
- **Repository:** `payaid-ai-studio`
- **Domain:** `ai.payaid.io`
- **Port:** 3007
- **Services:**
  - AI Chat
  - AI Calling Bot
  - Websites
  - Logo Generator

### **9. Communication Module**
- **Repository:** `payaid-communication`
- **Domain:** `communication.payaid.io`
- **Port:** 3008
- **Services:**
  - Email Accounts
  - Webmail
  - Team Chat

---

## 🚀 **CI/CD Pipeline**

### **GitHub Actions Workflow**

```yaml
# .github/workflows/deploy-module.yml
name: Deploy Module

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🐳 **Docker Configuration**

### **Dockerfile (Module Template)**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### **docker-compose.yml**

```yaml
version: '3.8'

services:
  core:
    build: ./core-module
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    networks:
      - payaid-network

  crm:
    build: ./crm-module
    ports:
      - "3001:3000"
    environment:
      - CORE_AUTH_URL=http://core:3000
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - payaid-network

  finance:
    build: ./finance-module
    ports:
      - "3002:3000"
    environment:
      - CORE_AUTH_URL=http://core:3000
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - payaid-network

networks:
  payaid-network:
    driver: bridge
```

---

## ☸️ **Kubernetes Configuration**

### **Deployment Template**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payaid-crm
spec:
  replicas: 2
  selector:
    matchLabels:
      app: payaid-crm
  template:
    metadata:
      labels:
        app: payaid-crm
    spec:
      containers:
      - name: crm
        image: payaid/crm:latest
        ports:
        - containerPort: 3000
        env:
        - name: CORE_AUTH_URL
          value: "https://payaid.io"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: payaid-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: payaid-crm
spec:
  selector:
    app: payaid-crm
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payaid-crm
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - crm.payaid.io
    secretName: crm-tls
  rules:
  - host: crm.payaid.io
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: payaid-crm
            port:
              number: 80
```

---

## 🌐 **DNS Configuration**

### **Subdomain Setup**

```
A Record: payaid.io → Core Server IP
CNAME: crm.payaid.io → payaid.io
CNAME: finance.payaid.io → payaid.io
CNAME: hr.payaid.io → payaid.io
CNAME: marketing.payaid.io → payaid.io
CNAME: whatsapp.payaid.io → payaid.io
CNAME: analytics.payaid.io → payaid.io
CNAME: ai.payaid.io → payaid.io
CNAME: communication.payaid.io → payaid.io
```

---

## 🔐 **Environment Variables**

### **Core Module**

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://payaid.io
```

### **Module (CRM Example)**

```env
CORE_AUTH_URL=https://payaid.io
OAUTH_CLIENT_ID=crm
OAUTH_CLIENT_SECRET=...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://crm.payaid.io
NEXT_PUBLIC_USE_SUBDOMAINS=true
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Create separate repositories for each module
- [ ] Set up CI/CD pipelines
- [ ] Configure environment variables
- [ ] Set up DNS records
- [ ] Configure SSL certificates
- [ ] Set up monitoring & logging

### **Deployment**
- [ ] Deploy core module
- [ ] Deploy CRM module
- [ ] Deploy Finance module
- [ ] Deploy HR module
- [ ] Deploy Marketing module
- [ ] Deploy WhatsApp module
- [ ] Deploy Analytics module
- [ ] Deploy AI Studio module
- [ ] Deploy Communication module

### **Post-Deployment**
- [ ] Test OAuth2 SSO
- [ ] Test cross-module navigation
- [ ] Test license checking
- [ ] Monitor performance
- [ ] Set up alerts

---

## 🎯 **Next Steps**

1. ✅ Create deployment infrastructure documentation
2. ⏳ Set up separate repositories
3. ⏳ Configure CI/CD pipelines
4. ⏳ Deploy to staging
5. ⏳ Test end-to-end
6. ⏳ Deploy to production

---

**Status:** ⏳ **READY FOR SETUP**  
**Next:** Create separate repositories and configure CI/CD

