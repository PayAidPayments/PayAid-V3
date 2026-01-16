# PayAid V3 - Deployment Guide

**Version:** Phase 2 (Decoupled Architecture)  
**Last Updated:** January 2026

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Domain Configuration](#domain-configuration)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- **PostgreSQL Database** (v14+)
- **Redis** (v6+) - For API Gateway events
- **Node.js** (v18+)
- **npm** or **yarn**

### Optional Services
- **Supabase** - For future auth migration
- **AWS S3** - For file storage
- **SMTP Server** - For email notifications

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd payaid-v3
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and fill in all required values:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Your application URL
- `API_GATEWAY_KEY` - Secret key for API Gateway
- `REDIS_URL` - Redis connection string

See `.env.example` for all available options.

---

## Database Setup

### 1. Run Migrations
```bash
npx prisma migrate deploy
# or
npm run db:migrate
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Seed Database (Optional)
```bash
npx prisma db seed
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

#### Steps:
1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your Git repository

2. **Configure Environment Variables**
   - Add all variables from `.env.example`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel domain

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Deploy**
   - Vercel will auto-deploy on push to main branch
   - Or manually trigger deployment

#### Vercel Configuration File
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["bom1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "REDIS_URL": "@redis-url"
  }
}
```

---

### Option 2: Docker

#### Dockerfile
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
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=payaid_v3
      - POSTGRES_USER=payaid
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Deploy
```bash
docker-compose up -d
```

---

### Option 3: Traditional Server (VPS/Cloud)

#### Steps:
1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start with PM2**
   ```bash
   pm2 start npm --name "payaid-v3" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** (Reverse Proxy)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Domain Configuration

### When Domain is Available

1. **Update Module URLs**
   Edit `lib/modules.config.ts`:
   ```typescript
   {
     id: "crm",
     url: "https://crm.payaid.in", // Update from /dashboard/contacts
     // ...
   }
   ```

2. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_APP_URL=https://app.payaid.in
   ```

3. **Configure DNS**
   - Main app: `app.payaid.in` → Your server IP
   - CRM module: `crm.payaid.in` → Your server IP
   - Finance module: `finance.payaid.in` → Your server IP
   - Sales module: `sales.payaid.in` → Your server IP

4. **SSL Certificates**
   - Use Let's Encrypt (free)
   - Or configure with your hosting provider

---

## Post-Deployment

### 1. Verify Deployment
- [ ] Landing page loads at `/home`
- [ ] All 34 modules display correctly
- [ ] CRM APIs work (`/api/crm/*`)
- [ ] Finance APIs work (`/api/finance/*`)
- [ ] Sales APIs work (`/api/sales/*`)
- [ ] API Gateway events work (`/api/events`)

### 2. Test Authentication
- [ ] User registration works
- [ ] User login works
- [ ] SSO works across modules
- [ ] JWT tokens are valid

### 3. Test Module Integration
- [ ] Create order in CRM → Invoice auto-created in Finance
- [ ] Events are published to API Gateway
- [ ] Module access control works

### 4. Monitor Performance
- [ ] Check response times (< 200ms for APIs)
- [ ] Monitor error rates
- [ ] Check database connection pool
- [ ] Monitor Redis connection

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
**Error:** `Can't reach database server`
**Solution:**
- Check `DATABASE_URL` in `.env`
- Verify database is running
- Check firewall rules

#### 2. Redis Connection Error
**Error:** `Redis connection failed`
**Solution:**
- Check `REDIS_URL` in `.env`
- Verify Redis is running
- Check network connectivity

#### 3. API Gateway Events Not Working
**Error:** Events not being published
**Solution:**
- Verify `API_GATEWAY_KEY` is set
- Check Redis connection
- Verify event handlers are registered

#### 4. Module Access Denied
**Error:** `Module not licensed`
**Solution:**
- Check module license in database
- Verify `ModuleGate` component is working
- Check user permissions

#### 5. Build Errors
**Error:** `Module not found` or `Type errors`
**Solution:**
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Run `npm run build` again

---

## Support

For deployment issues:
1. Check logs: `pm2 logs` or Vercel logs
2. Check database migrations: `npx prisma migrate status`
3. Verify environment variables are set correctly
4. Check network connectivity to external services

---

## Next Steps

After successful deployment:
1. Set up monitoring (Sentry, LogRocket, etc.)
2. Configure backups (database, files)
3. Set up CI/CD pipeline
4. Configure staging environment
5. Set up automated testing

---

**Last Updated:** January 2026  
**Maintained by:** PayAid Development Team

