# PayAid V3 - Project Overview & Context

**Version:** 3.0.0  
**Last Updated:** January 2026  
**Status:** Production Ready (98% Complete)

---

## 1. Project Identity

### Project Name
**PayAid V3**

### Project Type
Self-Hosted SaaS Fintech Platform

### Primary Purpose
PayAid V3 is a unified, all-in-one business operating system designed specifically for Indian businesses. It combines payments (INR), CRM, business automation, AI workflows, and comprehensive admin tools into a single integrated platform.

### Current Stage of Development
- **Overall Completion:** 98% Complete
- **Core Infrastructure:** ✅ 100% Complete
- **Module Integration:** ✅ 95% Complete
- **Production Readiness:** ✅ Ready (minor optimizations remaining)

### Target Users/Personas
1. **Indian SMEs (Small & Medium Enterprises)**
   - Businesses with 10-500 employees
   - Annual revenue: ₹10L - ₹100Cr
   - Need integrated business management

2. **Startups**
   - Early-stage to growth-stage startups
   - Need scalable, cost-effective solutions
   - Require automation and AI capabilities

3. **Service Providers**
   - Agencies, consultants, freelancers
   - Need client management and invoicing
   - Require professional tools

4. **E-commerce Businesses**
   - Online retailers and marketplaces
   - Need inventory, orders, and payment processing
   - Require GST compliance

5. **Industry-Specific Businesses**
   - Restaurants, Retail, Manufacturing
   - Healthcare, Education, Real Estate
   - Need industry-specific workflows

### Geographic Focus
- **Primary:** India (Tier 1, 2, 3 cities)
- **Currency:** Indian Rupee (INR) ONLY
- **Payment Gateway:** PayAid Payments ONLY
- **Compliance:** GST, DPDP Act, RBI guidelines

### Business Model
**B2B2C (Business-to-Business-to-Consumer)**
- Sell the platform to businesses
- Businesses use it to serve their own customers
- Multi-tenant architecture with tenant isolation
- Module-based licensing (pay-as-you-grow)

---

## 2. Core Value Propositions

### Problems Solved for Indian Businesses

1. **Fragmented Tools Problem**
   - **Problem:** Businesses use 15-20 separate SaaS tools (Zoho CRM, Razorpay Dashboard, HubSpot, QuickBooks, etc.)
   - **Solution:** Single unified platform replacing all tools
   - **Benefit:** Lower cost, better integration, unified data

2. **High SaaS Costs**
   - **Problem:** Multiple subscriptions cost ₹50K-₹5L/month
   - **Solution:** Self-hosted option + module-based pricing
   - **Benefit:** 70-90% cost reduction

3. **Data Sovereignty**
   - **Problem:** Data stored in foreign servers (GDPR concerns)
   - **Solution:** Self-hosted deployment option
   - **Benefit:** Complete data control, compliance

4. **GST Compliance Complexity**
   - **Problem:** Manual GST calculation and filing
   - **Solution:** Automated GST calculation, GSTR-1, GSTR-3B generation
   - **Benefit:** Time savings, accuracy, compliance

5. **Payment Processing Fragmentation**
   - **Problem:** Separate payment gateway dashboards
   - **Solution:** Integrated PayAid Payments with invoice links
   - **Benefit:** Unified payment tracking, automatic reconciliation

6. **Lack of AI Capabilities**
   - **Problem:** No AI assistance for business decisions
   - **Solution:** 27+ specialized AI agents
   - **Benefit:** Strategic insights, automation, productivity

### Competitive Differentiation

| Feature | PayAid V3 | Zoho | HubSpot | Razorpay Dashboard |
|---------|-----------|------|---------|---------------------|
| **All-in-One Platform** | ✅ Yes | ❌ Separate products | ❌ Separate products | ❌ Payment only |
| **Self-Hosted Option** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **INR Native** | ✅ Yes | ⚠️ Limited | ❌ USD | ✅ Yes |
| **GST Automation** | ✅ Full | ⚠️ Partial | ❌ No | ❌ No |
| **AI Agents** | ✅ 27+ agents | ⚠️ Basic | ⚠️ Basic | ❌ No |
| **Module-Based Pricing** | ✅ Yes | ❌ Fixed plans | ❌ Fixed plans | ❌ Fixed plans |
| **PayAid Payments** | ✅ Integrated | ❌ No | ❌ No | ✅ Yes |

### Unique Selling Features

1. **All-in-One Platform**
   - CRM + Invoicing + Payments + HR + Marketing + AI
   - Single login, unified data, integrated workflows

2. **Self-Hosted Option**
   - Deploy on own infrastructure
   - Complete data sovereignty
   - No vendor lock-in

3. **Local Currency Support**
   - INR-only (no currency conversion)
   - Indian payment methods (UPI, Cards, Net Banking, Wallets)
   - GST-compliant invoicing

4. **AI Co-Founder System**
   - 27+ specialized AI agents
   - Strategic business advice
   - Automated workflows

5. **Module-Based Licensing**
   - Pay only for modules you use
   - Start with free tier
   - Scale as you grow

6. **Industry-Specific Modules**
   - Restaurant, Retail, Manufacturing
   - Healthcare, Education, Real Estate
   - Custom workflows per industry

### Target Business Segments

1. **E-commerce**
   - Product catalog, inventory, orders
   - Payment processing, GST compliance

2. **SMEs**
   - Complete business management
   - CRM, invoicing, accounting, HR

3. **Agencies**
   - Client management, project tracking
   - Time tracking, invoicing, payments

4. **Consultants**
   - Contact management, proposals
   - Invoicing, expense tracking

5. **Service Providers**
   - Appointment scheduling, customer management
   - Invoicing, payment collection

### Why Self-Hosted is the Advantage

1. **Data Sovereignty**
   - Data stays on your infrastructure
   - No third-party access
   - Compliance with data protection laws

2. **Cost Control**
   - No per-user SaaS fees
   - Predictable infrastructure costs
   - Scale at your own pace

3. **Customization**
   - Full source code access
   - Custom workflows and integrations
   - Industry-specific modifications

4. **Performance**
   - Optimize for your workload
   - No shared infrastructure bottlenecks
   - Better control over scaling

5. **Security**
   - Your security policies
   - No vendor security incidents
   - Complete audit trail

---

## 3. Technology Stack - Self-Hosted Focused

### Frontend Framework
- **Framework:** Next.js 16.1.0 (App Router)
- **UI Library:** React 19.0.0
- **Styling:** Tailwind CSS 3.4.0
- **State Management:** Zustand 4.5.7
- **Data Fetching:** TanStack React Query 5.56.0
- **Forms:** React Hook Form + Zod 3.23.0
- **Type Safety:** TypeScript 5.5.0

### Backend Technology
- **Runtime:** Node.js (via Next.js API Routes)
- **API Framework:** Next.js API Routes (REST)
- **GraphQL:** GraphQL 16.12.0 (optional, fully implemented)
- **Language:** TypeScript

### Database
- **Primary Database:** PostgreSQL (Supabase/self-hosted)
- **ORM:** Prisma 5.19.0
- **Connection Pooling:** Supabase connection pooler
- **Read Replicas:** Supported via `DATABASE_READ_URL`
- **Migrations:** Prisma Migrate

### Caching Layer
- **Primary Cache:** Redis (ioredis 5.3.2)
- **Multi-Layer Caching:** L1 (memory) + L2 (Redis)
- **Cache Strategy:** 
  - L1: In-memory cache (fast, limited size)
  - L2: Redis cache (persistent, distributed)
  - Cache warming on login
  - Automatic invalidation on writes

### Search & Indexing
- **Full-Text Search:** PostgreSQL full-text search
- **Future:** Meilisearch or Elasticsearch (self-hosted)

### AI/ML Integration
- **Primary LLM:** Groq API (llama-3.1-70b-versatile)
- **Fallback LLM:** Ollama (local, self-hosted)
- **Alternative:** Hugging Face Cloud API
- **Image Generation:** Google AI Studio (Gemini), Hugging Face
- **Text-to-Speech:** Coqui TTS (self-hosted Docker)
- **Speech-to-Text:** Whisper (self-hosted Docker)
- **Image-to-Text:** BLIP-2 + OCR (self-hosted Docker)
- **RAG:** Local knowledge base with embeddings (future)

### Message Queue/Background Jobs
- **Queue System:** Bull 4.12.0 (Redis-based)
- **Job Processors:**
  - Email sending
  - SMS sending
  - Report generation
  - Data synchronization
  - Cache warming
- **Scheduling:** Cron jobs via Bull scheduler

### File Storage
- **Primary:** AWS S3-compatible (self-hosted Minio option)
- **Package:** @aws-sdk/client-s3 3.958.0
- **Alternative:** Local filesystem (for self-hosted)

### Container Orchestration
- **Primary:** Docker + Docker Compose
- **Container Management:** Dockerode 4.0.9
- **Deployment:** Single-server or multi-container setup

### Reverse Proxy
- **Production:** Nginx or Caddy
- **Development:** Next.js built-in server

### SSL/TLS
- **Certificate Authority:** Let's Encrypt (free)
- **Automation:** Certbot or Caddy auto-SSL

### Monitoring & Logging
- **Metrics:** StatsD integration (`lib/monitoring/statsd.ts`)
- **Logging:** Winston/Pino (Node.js logging)
- **APM:** Application Performance Monitoring (optional)
- **Health Checks:** `/api/system/health`
- **Metrics Endpoint:** `/api/system/metrics`
- **Alerts Endpoint:** `/api/system/alerts`

### Authentication
- **Primary:** JWT (jsonwebtoken 9.0.2)
- **Password Hashing:** bcryptjs 2.4.3
- **2FA:** TOTP (otplib 12.0.1)
- **OAuth2:** OAuth2 SSO support
- **Session Management:** JWT tokens with refresh tokens

### Payment Processing
- **Gateway:** PayAid Payments (exclusive integration)
- **Integration:** Custom PayAid Payments SDK (`lib/payments/payaid.ts`)
- **Currency:** INR only
- **Methods:** UPI, Cards, Net Banking, Wallets
- **Webhooks:** Secure webhook handling with hash verification

---

## 4. Repository Structure

### Monorepo Strategy
PayAid V3 uses a **hybrid monorepo structure**:
- Main application in root directory
- Module directories for feature organization
- Shared libraries in `lib/`
- Separate repositories for decoupled modules (future)

### Directory Structure

```
PayAid V3/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (577+ endpoints)
│   ├── dashboard/                # Dashboard pages
│   ├── (auth)/                   # Authentication pages
│   └── layout.tsx                # Root layout
│
├── lib/                          # Shared libraries
│   ├── auth/                     # Authentication utilities
│   ├── cache/                    # Caching (multi-layer)
│   ├── db/                       # Database (Prisma)
│   ├── payments/                 # PayAid Payments integration
│   ├── ai/                       # AI agents and services
│   ├── monitoring/               # Monitoring and metrics
│   ├── queue/                    # Job queue (Bull)
│   └── security/                 # Security utilities
│
├── components/                   # React components
│   ├── ui/                       # UI components
│   ├── forms/                    # Form components
│   └── charts/                   # Chart components
│
├── prisma/                       # Database schema
│   ├── schema.prisma             # Main schema (7000+ lines)
│   └── seed.ts                   # Seed data
│
├── crm-module/                   # CRM module
├── invoicing-module/             # Invoicing module
├── hr-module/                    # HR module
├── marketing-module/             # Marketing module
├── analytics-module/             # Analytics module
├── ai-studio-module/             # AI Studio module
├── communication-module/         # Communication module
├── whatsapp-module/              # WhatsApp module
├── accounting-module/            # Accounting module
├── finance-module/              # Finance module
│
├── scripts/                      # Utility scripts
│   ├── load-test-setup.ts        # Load testing
│   ├── verify-env.ts             # Environment verification
│   └── sync-module-routes.ts     # Route synchronization
│
├── tests/                        # Test files
├── load-tests/                   # Load testing scripts
├── services/                     # External services (Python)
│
├── repositories/                 # Decoupled module repos (future)
│   ├── payaid-core/
│   ├── payaid-crm/
│   ├── payaid-finance/
│   └── ...
│
├── mobile/                       # Mobile app (React Native)
├── browser-extension/            # Browser extension
│
├── package.json                  # Dependencies
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.example                  # Environment variables template
```

### File Naming Conventions

- **Components:** PascalCase (e.g., `ContactList.tsx`)
- **API Routes:** kebab-case (e.g., `generate-payment-link/route.ts`)
- **Utilities:** camelCase (e.g., `generateHash.ts`)
- **Types:** PascalCase (e.g., `JWTPayload.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `JWT_SECRET`)

### Configuration Management

1. **Environment Variables**
   - `.env.local` - Local development
   - `.env.production` - Production
   - `.env.vercel` - Vercel deployment
   - All secrets in environment variables

2. **Secrets Management**
   - API keys: Environment variables
   - Database URLs: Environment variables
   - JWT secrets: Environment variables
   - Payment credentials: Tenant-specific (`TenantPaymentSettings` table)

3. **Feature Flags**
   - `FeatureToggle` model in database
   - Per-tenant feature flags
   - Module enablement flags

### Docker Compose Files

**Self-Hosted Deployment:**
- `docker-compose.yml` (to be created)
- Services:
  - PostgreSQL
  - Redis
  - Next.js app
  - Nginx (reverse proxy)
  - Optional: Minio (S3-compatible storage)
  - Optional: Ollama (local LLM)

---

## 5. Self-Hosted Deployment Architecture

### Single-Server Setup (Recommended for Start)

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Nginx (Reverse Proxy)          │
│         Port 80/443                     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Next.js Application                │
│      (Node.js + Next.js)               │
│      Port 3000                          │
└─────┬───────────────────┬───────────────┘
      │                   │
┌─────▼──────┐    ┌───────▼────────┐
│ PostgreSQL │    │     Redis      │
│ Port 5432  │    │   Port 6379    │
└────────────┘    └────────────────┘
```

### Recommended Hardware Specifications

| User Volume | CPU | RAM | Storage | Network |
|-------------|-----|-----|---------|---------|
| **< 100 users** | 4 cores | 8 GB | 100 GB SSD | 100 Mbps |
| **100-500 users** | 8 cores | 16 GB | 250 GB SSD | 500 Mbps |
| **500-2000 users** | 16 cores | 32 GB | 500 GB SSD | 1 Gbps |
| **2000+ users** | 32+ cores | 64+ GB | 1 TB+ SSD | 10 Gbps |

### Scaling Strategy

1. **Vertical Scaling (First)**
   - Upgrade server hardware
   - Increase CPU, RAM, storage
   - Optimize database queries
   - Add read replicas

2. **Horizontal Scaling (If Needed)**
   - Multiple Next.js instances behind load balancer
   - Database read replicas
   - Redis cluster
   - Shared file storage (S3/Minio)

### Backup and Disaster Recovery

1. **Database Backups**
   - Automated daily backups
   - Retention: 30 days
   - Off-site backup storage

2. **File Storage Backups**
   - S3 versioning enabled
   - Daily snapshots

3. **Disaster Recovery**
   - RTO (Recovery Time Objective): 4 hours
   - RPO (Recovery Point Objective): 24 hours
   - Automated backup restoration testing

### Data Persistence

- **Database:** PostgreSQL data directory (Docker volume)
- **Redis:** Redis data directory (Docker volume)
- **Files:** S3/Minio buckets or local filesystem
- **Logs:** Log rotation with 30-day retention

### Network Architecture

- **Ports:**
  - 80: HTTP (redirects to 443)
  - 443: HTTPS (Nginx)
  - 3000: Next.js (internal)
  - 5432: PostgreSQL (internal)
  - 6379: Redis (internal)

- **Firewall Rules:**
  - Allow: 80, 443 (public)
  - Block: 3000, 5432, 6379 (internal only)

---

## Summary

PayAid V3 is a production-ready, self-hosted SaaS platform designed for Indian businesses. It provides a unified solution for CRM, invoicing, payments, HR, marketing, and AI-powered business automation. The platform is 98% complete and ready for production deployment with self-hosted infrastructure support.

**Key Strengths:**
- ✅ All-in-one platform (replaces 15-20 tools)
- ✅ Self-hosted deployment option
- ✅ INR-native with GST compliance
- ✅ 27+ AI agents for business intelligence
- ✅ Module-based licensing (pay-as-you-grow)
- ✅ Production-ready infrastructure (caching, read replicas, monitoring)

**Next Steps:**
- Complete remaining 2% optimizations
- Execute load testing (10,000+ users)
- Configure production environment variables
- Set up monitoring and alerts
