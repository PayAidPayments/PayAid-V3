# PayAid V3 - Deployment Configuration

**Date:** January 2026  
**Status:** 📋 **DEPLOYMENT CONFIGURATION FILES**  
**Purpose:** Configuration files for deploying decoupled modules

---

## 🐳 Docker Configuration

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  # Redis for Event Bus
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - crm
      - finance
      - sales
      - projects
      - inventory

  # CRM Module
  crm:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.crm
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_APP_URL=https://crm.payaid.in
    depends_on:
      - redis

  # Finance Module
  finance:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.finance
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_APP_URL=https://finance.payaid.in
    depends_on:
      - redis

  # Sales Module
  sales:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.sales
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_APP_URL=https://sales.payaid.in
    depends_on:
      - redis

  # Projects Module
  projects:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.projects
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_APP_URL=https://projects.payaid.in
    depends_on:
      - redis

  # Inventory Module
  inventory:
    build:
      context: .
      dockerfile: infrastructure/docker/Dockerfile.inventory
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_APP_URL=https://inventory.payaid.in
    depends_on:
      - redis

volumes:
  redis-data:
```

---

## 🌐 Nginx Configuration

### `infrastructure/nginx/nginx.conf`
```nginx
upstream crm_backend {
    server crm:3000;
}

upstream finance_backend {
    server finance:3000;
}

upstream sales_backend {
    server sales:3000;
}

upstream projects_backend {
    server projects:3000;
}

upstream inventory_backend {
    server inventory:3000;
}

# CRM Module
server {
    listen 80;
    server_name crm.payaid.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.payaid.in;

    ssl_certificate /etc/nginx/ssl/crm.payaid.in.crt;
    ssl_certificate_key /etc/nginx/ssl/crm.payaid.in.key;

    location / {
        proxy_pass http://crm_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Finance Module
server {
    listen 80;
    server_name finance.payaid.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name finance.payaid.in;

    ssl_certificate /etc/nginx/ssl/finance.payaid.in.crt;
    ssl_certificate_key /etc/nginx/ssl/finance.payaid.in.key;

    location / {
        proxy_pass http://finance_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Sales Module
server {
    listen 80;
    server_name sales.payaid.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sales.payaid.in;

    ssl_certificate /etc/nginx/ssl/sales.payaid.in.crt;
    ssl_certificate_key /etc/nginx/ssl/sales.payaid.in.key;

    location / {
        proxy_pass http://sales_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Projects Module
server {
    listen 80;
    server_name projects.payaid.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name projects.payaid.in;

    ssl_certificate /etc/nginx/ssl/projects.payaid.in.crt;
    ssl_certificate_key /etc/nginx/ssl/projects.payaid.in.key;

    location / {
        proxy_pass http://projects_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Inventory Module
server {
    listen 80;
    server_name inventory.payaid.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inventory.payaid.in;

    ssl_certificate /etc/nginx/ssl/inventory.payaid.in.crt;
    ssl_certificate_key /etc/nginx/ssl/inventory.payaid.in.key;

    location / {
        proxy_pass http://inventory_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🚀 CI/CD Configuration

### `.github/workflows/crm-deploy.yml`
```yaml
name: Deploy CRM Module

on:
  push:
    branches: [main]
    paths:
      - 'apps/crm/**'
      - 'packages/shared-auth/**'
      - 'packages/shared-db/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build CRM module
        run: pnpm --filter @payaid/crm build
      
      - name: Deploy to production
        run: |
          # Add deployment commands here
          echo "Deploying CRM module..."
```

---

## 📝 Environment Variables

### `.env.production.example`
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://redis:6379

# OAuth
OAUTH_CLIENT_SECRET=your-secret-key

# API Gateway
API_GATEWAY_KEY=your-gateway-key

# Module URLs
NEXT_PUBLIC_APP_URL=https://app.payaid.in
NEXT_PUBLIC_CRM_URL=https://crm.payaid.in
NEXT_PUBLIC_FINANCE_URL=https://finance.payaid.in
NEXT_PUBLIC_SALES_URL=https://sales.payaid.in
NEXT_PUBLIC_PROJECTS_URL=https://projects.payaid.in
NEXT_PUBLIC_INVENTORY_URL=https://inventory.payaid.in
```

---

## ✅ Deployment Checklist

- [ ] DNS records configured for all subdomains
- [ ] SSL certificates generated/installed
- [ ] Nginx reverse proxy configured
- [ ] Docker containers built and tested
- [ ] Environment variables set
- [ ] Redis connection verified
- [ ] Database migrations run
- [ ] OAuth endpoints tested
- [ ] API Gateway routes verified
- [ ] Cross-module SSO tested

---

**Status:** 📋 **CONFIGURATION FILES READY**

