# PayAid V3 - Development Handover Document

**Created:** December 20, 2025  
**Project:** PayAid V3 - Multi-Industry Business Operating System  
**Status:** Active Development - Core Features Complete

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Completed Features](#completed-features)
5. [Development Quirks & Important Notes](#development-quirks--important-notes)
6. [Database Schema](#database-schema)
7. [API Structure](#api-structure)
8. [Environment Configuration](#environment-configuration)
9. [Setup Instructions](#setup-instructions)
10. [Known Issues & Limitations](#known-issues--limitations)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Future Roadmap](#future-roadmap)

---

## 🎯 Project Overview

PayAid V3 is a comprehensive multi-tenant SaaS platform designed to be "the operating system for Indian businesses." It combines CRM, accounting, invoicing, payments, marketing automation, HR, and industry-specific modules into a single unified platform.

### Core Vision
- **Multi-Industry Support**: One platform serving restaurants, retail, manufacturing, real estate, healthcare, and 40+ other industries
- **All-in-One Solution**: Replaces 15-20 different tools (Zoho, Toast, SAP, etc.) with one platform
- **Cost Savings**: 80% cost reduction for businesses (₹1,999-5,000/month vs ₹15,000+/month)
- **India-First**: Built for Indian businesses with GST compliance, UPI payments, multi-language support

### Current Status
- ✅ Core platform complete (CRM, Accounting, Invoicing, Payments)
- ✅ Multi-tenant architecture implemented
- ✅ AI services integrated (chat, image generation, text-to-speech)
- ✅ WhatsApp integration complete
- ✅ Lead management & sales automation
- ✅ HR module (payroll, attendance, leave management)
- ✅ Marketing automation (campaigns, email sequences)
- ✅ **Phase 1: Licensing Layer Complete** (December 2025)
  - Module-based licensing system implemented
  - API route protection with license checking
  - Frontend module gating (Sidebar, ModuleGate)
  - Admin panel for license management
  - JWT tokens include licensing information
- ⏳ Industry-specific modules in progress (Restaurant, Retail, Manufacturing)

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14.2.0 (App Router)
- **UI Library**: React 18.3.0
- **Styling**: Tailwind CSS 3.4.0
- **State Management**: Zustand 4.5.7
- **Data Fetching**: TanStack React Query 5.56.0
- **Forms**: React Hook Form (implicit via components)
- **Validation**: Zod 3.23.0

### Backend
- **Runtime**: Node.js (via Next.js API Routes)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.19.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Queue System**: Bull 4.12.0 (Redis-based)
- **File Processing**: PDFKit 0.17.2, PapaParse 5.5.3, XLSX 0.18.5

### AI Services
- **Primary Chat**: Groq API (llama-3.1-70b-versatile)
- **Fallback Chat**: Ollama (local), Hugging Face Cloud API
- **Image Generation**: Google AI Studio (Gemini), Hugging Face Cloud API
- **Text-to-Speech**: Coqui TTS (self-hosted Docker)
- **Speech-to-Text**: Whisper (self-hosted Docker)
- **Image-to-Text**: BLIP-2 + OCR (self-hosted Docker)

### Infrastructure
- **Database**: Supabase PostgreSQL
- **Cache/Queue**: Redis (ioredis 5.3.2)
- **Containerization**: Docker (Dockerode 4.0.9)
- **Deployment**: Vercel (with cron jobs)
- **CI/CD**: GitHub Actions

### Third-Party Integrations
- **Email**: SendGrid (configured), Gmail API
- **SMS**: Twilio, Exotel, Wati
- **WhatsApp**: WAHA (self-hosted)
- **Payments**: PayAid Payments Gateway (fully integrated - invoice payment links)

---

## 🏗 Architecture

### Multi-Tenant Architecture

**Tenant Isolation**: Every database query MUST filter by `tenantId`. This is critical for data security.

```typescript
// ✅ CORRECT - Always filter by tenantId
const contacts = await prisma.contact.findMany({
  where: { tenantId }  // Required!
})

// ❌ WRONG - Missing tenantId filter
const contacts = await prisma.contact.findMany()  // Security risk!
```

**Tenant Model**: The `Tenant` model is the root of all data. Every model (except User) has a `tenantId` foreign key.

**Key Files**:
- `lib/middleware/tenant.ts` - Tenant context middleware
- `lib/middleware/auth.ts` - Authentication middleware
- `TENANT_ISOLATION_EXPLAINED.md` - Detailed explanation

### File Structure

```
PayAid V3/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/           # AI service endpoints
│   │   ├── whatsapp/     # WhatsApp endpoints
│   │   ├── contacts/     # CRM endpoints
│   │   └── ...
│   ├── dashboard/        # Dashboard pages
│   │   ├── contacts/     # CRM pages
│   │   ├── invoices/     # Invoicing pages
│   │   ├── whatsapp/     # WhatsApp pages
│   │   └── ...
│   └── login/            # Auth pages
├── lib/                   # Shared utilities
│   ├── ai/              # AI service clients
│   ├── auth/            # Authentication
│   ├── db/              # Database (Prisma client)
│   ├── middleware/      # Middleware functions
│   └── ...
├── prisma/               # Database schema
│   ├── schema.prisma    # Main schema (3700+ lines!)
│   └── seed.ts          # Seed scripts
├── components/          # React components
├── services/            # External service integrations
└── scripts/            # Utility scripts
```

### API Route Pattern

All API routes follow this pattern:

```typescript
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: Request) {
  const { user, tenantId } = await authenticateRequest(request)
  
  // Always filter by tenantId!
  const data = await prisma.model.findMany({
    where: { tenantId }
  })
  
  return Response.json(data)
}
```

---

## ✅ Completed Features

### 1. Core Platform (100% Complete)

#### CRM Module
- ✅ Contact management (create, edit, view, delete)
- ✅ Deal pipeline management
- ✅ Task management
- ✅ Interaction tracking
- ✅ Lead scoring (0-100 algorithm)
- ✅ Smart lead allocation to sales reps
- ✅ Lead nurturing sequences (automated emails)
- ✅ Multi-channel notifications

#### Accounting Module
- ✅ Expense tracking
- ✅ Financial reports
- ✅ GST compliance (GSTR-1, GSTR-3B)
- ✅ Chart of accounts

#### Invoicing Module
- ✅ Invoice creation with GST
- ✅ Multiple payment methods
- ✅ Invoice templates (Standard, Minimal, Detailed, Professional, GST Compliant)
- ✅ PDF generation
- ✅ Payment tracking
- ✅ Invoice settings configuration (admin panel)
- ✅ Reverse Charge option (configurable visibility and default)
- ✅ Zoho-style invoice options:
  - Order Number field
  - Payment Terms dropdown
  - Accounts Receivable selection
  - Salesperson assignment
  - Discount (amount or percentage)
  - TDS/TCS support
  - Adjustment field
  - File attachments
  - Save as Draft / Save and Send
  - Make Recurring option
- ✅ Create invoice from Contact/Deal pages
- ✅ Send invoice with payment link via email

#### Products & Orders
- ✅ Product catalog
- ✅ Order management
- ✅ Inventory tracking (basic)

### 2. AI Services (100% Complete)

#### AI Chat
- ✅ Multi-provider support (Groq, Ollama, Hugging Face)
- ✅ Business context awareness
- ✅ Tenant-specific responses
- ✅ Semantic caching
- ✅ Fallback chain: Groq → Ollama → Hugging Face → Rule-based

#### Image Generation
- ✅ Google AI Studio integration (per-tenant API keys)
- ✅ Hugging Face Cloud API
- ✅ Self-hosted removed (cloud-only now)
- ✅ Social media post creation

#### Other AI Services
- ✅ Text-to-Speech (Coqui TTS - Docker)
- ✅ Speech-to-Text (Whisper - Docker)
- ✅ Image-to-Text (BLIP-2 + OCR - Docker)

**Key Files**:
- `lib/ai/groq.ts` - Groq client
- `lib/ai/ollama.ts` - Ollama client
- `lib/ai/huggingface.ts` - Hugging Face client
- `lib/ai/image-generation.ts` - Image generation
- `app/api/ai/chat/route.ts` - Chat endpoint
- `CLOUD_ONLY_SETUP.md` - AI services setup

### 3. WhatsApp Integration (100% Complete)

- ✅ WhatsApp account management
- ✅ QR code session management
- ✅ Send/receive messages
- ✅ Conversation management
- ✅ Template management
- ✅ Auto-link to CRM contacts
- ✅ Analytics and reporting
- ✅ Webhook handlers
- ✅ Audit logging

**Key Files**:
- `app/api/whatsapp/` - All WhatsApp endpoints
- `app/dashboard/whatsapp/` - WhatsApp UI pages
- `WHATSAPP_IMPLEMENTATION_COMPLETE.md` - Full documentation

**Important**: Requires WAHA (WhatsApp HTTP API) deployment. See `WHATSAPP_IMPLEMENTATION_COMPLETE.md` for setup.

### 4. HR Module (100% Complete)

- ✅ Employee management
- ✅ Attendance tracking
- ✅ Leave management (balances, requests, policies)
- ✅ Payroll (cycles, runs, salary structures)
- ✅ Tax declarations
- ✅ Hiring pipeline (job requisitions, candidates, interviews, offers)
- ✅ Onboarding templates
- ✅ Asset management
- ✅ Departments, designations, locations

### 5. Marketing Automation (100% Complete)

- ✅ Email campaigns
- ✅ Lead nurturing sequences
- ✅ Email templates
- ✅ Segment management
- ✅ Social media posting
- ✅ Scheduled posts
- ✅ Analytics

### 6. Website Builder (100% Complete)

- ✅ Website creation and management
- ✅ Landing pages
- ✅ Checkout pages
- ✅ Website analytics (visits, sessions, events)
- ✅ Heatmaps
- ✅ Chatbots
- ✅ Logo generation

### 7. Sales Automation (100% Complete)

- ✅ Lead scoring algorithm
- ✅ Smart lead allocation
- ✅ Sales rep management
- ✅ Performance tracking
- ✅ Nurture sequence enrollment
- ✅ Automated email scheduling

**Key Files**:
- `lib/ai-helpers/lead-scoring.ts` - Scoring algorithm
- `lib/sales-automation/lead-allocation.ts` - Allocation logic
- `lib/background-jobs/recalculate-lead-scores.ts` - Cron job
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Detailed docs

### 8. PayAid Payments Integration (100% Complete)

- ✅ Payment link generation for invoices
- ✅ Email invoices with payment links
- ✅ Real-time payment status tracking
- ✅ Webhook support for payment updates
- ✅ Payment link open tracking
- ✅ Automatic invoice status updates
- ✅ Customer return URLs (success/failure/cancel)
- ✅ Secure hash verification

**Key Files**:
- `lib/payments/payaid.ts` - PayAid Payments client
- `lib/payments/payaid-hash.ts` - Hash calculation
- `app/api/invoices/[id]/generate-payment-link/route.ts` - Generate payment link
- `app/api/invoices/[id]/send-with-payment/route.ts` - Send invoice with payment
- `app/api/payments/webhook/route.ts` - Payment webhook handler
- `lib/background-jobs/send-invoice-with-payment-link.ts` - Email job processor
- `PAYAID_PAYMENTS_INTEGRATION.md` - Full documentation

**Important**: Requires PayAid Payments API credentials. See `PAYAID_PAYMENTS_INTEGRATION.md` for setup.

### 9. Industry-Specific Modules (In Progress)

#### Restaurant Module
- ✅ QR menu
- ✅ Kitchen display
- ✅ Order management
- ⏳ Delivery tracking

#### Retail Module
- ✅ POS system
- ✅ Inventory management
- ✅ Barcode scanning
- ⏳ Loyalty program

#### Manufacturing Module
- ✅ Production orders
- ✅ Material management
- ⏳ BOM (Bill of Materials)
- ⏳ QC (Quality Control)

---

## ⚠️ Development Quirks & Important Notes

### 1. **Tenant Isolation is CRITICAL**

**ALWAYS** filter database queries by `tenantId`. This is not optional - it's a security requirement.

```typescript
// ✅ CORRECT
const data = await prisma.model.findMany({
  where: { tenantId }
})

// ❌ WRONG - Security vulnerability!
const data = await prisma.model.findMany()
```

**Why**: Without tenant filtering, users can access other tenants' data. This is a critical security issue.

**How to verify**: Search codebase for `prisma.*.findMany()` and ensure all have `where: { tenantId }` or equivalent filtering.

### 2. **Environment Variables Must Be Reloaded**

**IMPORTANT**: Next.js does NOT automatically reload `.env` file changes. You MUST restart the dev server after adding/updating environment variables.

```bash
# After updating .env:
# 1. Stop server (Ctrl+C)
# 2. Restart: npm run dev
```

**Common Issue**: "API key not working" → Usually means server wasn't restarted after adding the key.

### 3. **Prisma Client Must Be Regenerated**

After schema changes, always regenerate Prisma client:

```bash
npx prisma generate
npx prisma db push
```

**When to do this**:
- After modifying `schema.prisma`
- After pulling new changes that modify schema
- When getting "model not found" errors

### 4. **AI Services Fallback Chain**

The AI chat uses a fallback chain. If one service fails, it tries the next:

```
1. Groq API (primary - fast, free tier)
2. Ollama (local - free forever)
3. Hugging Face Cloud API (fallback)
4. Rule-based responses (always works)
```

**Important**: The rule-based fallback is quite sophisticated and provides real business data even when AI services are down.

**Key File**: `app/api/ai/chat/route.ts`

### 5. **Image Generation is Cloud-Only**

Self-hosted Docker image generation has been **removed** to save space (~32GB). Only cloud APIs are used:

- Google AI Studio (per-tenant API keys)
- Hugging Face Cloud API

**Why removed**: Docker models were too large and required GPU. Cloud APIs are easier to manage.

**Documentation**: `CLOUD_ONLY_SETUP.md`

### 6. **WhatsApp Requires WAHA**

WhatsApp integration requires a separate WAHA (WhatsApp HTTP API) deployment. This is NOT included in the codebase.

**Setup Options**:
1. Docker: `docker run -d --name waha devlikeapro/waha-plus`
2. Oracle Cloud Free Tier: Deploy WAHA on a free VM
3. Any server: Follow WAHA documentation

**Key File**: `WHATSAPP_IMPLEMENTATION_COMPLETE.md`

### 7. **PayAid Payments Integration**

Invoice payment links require PayAid Payments API credentials:
- `PAYAID_PAYMENTS_API_KEY` - 36-digit merchant key
- `PAYAID_PAYMENTS_SALT` - Salt for hash calculation (KEEP SECRET!)
- `PAYAID_PAYMENTS_BASE_URL` - Payment gateway API URL
- `NEXT_PUBLIC_APP_URL` - Your app URL (for return URLs)

**Webhook Setup**: Configure webhook URL in PayAid Payments dashboard:
```
https://your-domain.com/api/payments/webhook
```

**Key File**: `PAYAID_PAYMENTS_INTEGRATION.md`

### 8. **Database Schema is HUGE**

The Prisma schema (`prisma/schema.prisma`) is **3700+ lines** with 100+ models. This is intentional - it supports multiple industries.

**Important**:
- Don't modify schema without understanding all relationships
- Always test migrations on a copy first
- Use `npx prisma studio` to explore the database

### 10. **Invoice Creation Features**

The invoice creation form includes Zoho-style options:
- **Order Number**: Link invoices to purchase orders
- **Payment Terms**: Dropdown (Due on Receipt, Net 15/30/45/60, Custom)
- **Accounts Receivable**: Account selection for accounting
- **Salesperson**: Assign to sales rep
- **Discount**: Amount or percentage-based discounts
- **TDS/TCS**: Tax Deducted/Collected at Source support
- **Adjustment**: Final amount adjustments
- **File Attachments**: Attach supporting documents
- **Save as Draft**: Save without sending
- **Save and Send**: Create and send invoice
- **Make Recurring**: Set up recurring invoices (UI ready, backend pending)

**Sticky Footer**: The invoice creation form has a sticky footer that stays within the main content area (doesn't cover sidebar).

**Key Files**:
- `app/dashboard/invoices/new/page.tsx` - Invoice creation form
- `app/api/invoices/route.ts` - Invoice creation API

### 11. **Cron Jobs Configuration**

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/recalculate-scores",
      "schedule": "0 * * * *"  // Every hour
    },
    {
      "path": "/api/cron/send-scheduled-emails",
      "schedule": "*/15 * * * *"  // Every 15 minutes
    }
  ]
}
```

**Important**: Cron jobs require `CRON_SECRET` environment variable for security.

**Key Files**:
- `vercel.json` - Cron configuration
- `app/api/cron/` - Cron job endpoints

### 9. **Authentication Pattern**

All API routes use `authenticateRequest` middleware:

```typescript
import { authenticateRequest } from '@/lib/middleware/auth'

export async function GET(request: Request) {
  const { user, tenantId } = await authenticateRequest(request)
  // user and tenantId are now available
}
```

**Important**: This middleware:
- Validates JWT token
- Extracts user and tenantId
- Returns 401 if invalid

**Key File**: `lib/middleware/auth.ts`

### 13. **AI Context Building**

The AI chat builds business context by querying the database. This is expensive, so it's cached.

**Key File**: `lib/ai/context-analyzer.ts`

**Important**: All context queries MUST filter by `tenantId` to ensure tenant isolation.

### 11. **File Upload Handling**

File uploads are handled via Next.js API routes. Files are stored in:
- Local development: `public/uploads/`
- Production: Should use cloud storage (S3, Supabase Storage, etc.)

**TODO**: Implement cloud storage for production.

### 15. **Error Handling Pattern**

All API routes should use try-catch:

```typescript
export async function POST(request: Request) {
  try {
    // ... logic
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 13. **TypeScript Strict Mode**

The project uses TypeScript with strict type checking. Always:
- Define proper types for API responses
- Use Zod schemas for validation
- Avoid `any` types

### 17. **Database Migrations**

**Never use `prisma migrate` in production without testing first!**

Use `prisma db push` for development:
```bash
npx prisma db push
```

For production migrations, create proper migration files:
```bash
npx prisma migrate dev --name migration_name
```

### 15. **Redis Dependency**

Some features require Redis:
- Bull queue system (background jobs)
- Rate limiting
- Caching

**Development**: Can run Redis locally or use Upstash (free tier).

**Key File**: `lib/redis/client.ts`

---

## 🗄 Database Schema

### Key Models

**Tenant** - Root model for multi-tenancy
- `id`, `name`, `subdomain`, `industry`, `industrySettings`
- All other models reference this via `tenantId`

**User** - System users
- `id`, `email`, `name`, `password`, `role`
- Belongs to a `Tenant`

**Contact** - CRM contacts
- `id`, `name`, `email`, `phone`, `type` (lead/customer/vendor)
- `leadScore` (0-100), `assignedTo` (sales rep)

**Deal** - Sales pipeline
- `id`, `name`, `value`, `stage`, `probability`
- Linked to `Contact`

**Invoice** - Invoicing
- `id`, `invoiceNumber`, `subtotal`, `tax`, `total`, `status`, `dueDate`
- GST fields: `gstRate`, `gstAmount`, `cgst`, `sgst`, `igst`, `hsnCode`, `isInterState`, `placeOfSupply`
- Payment tracking: `paymentLinkUrl`, `paymentLinkUuid`, `paymentTransactionId`, `paymentStatus`, `paymentMode`, `paymentChannel`, `paymentLinkOpenedCount`

**Tenant** - Root model (includes invoice settings)
- `invoiceSettings` (JSON field): Stores invoice configuration including:
  - `template`: Invoice template selection
  - `showReverseCharge`: Show/hide Reverse Charge option
  - `defaultReverseCharge`: Default Reverse Charge value
  - `defaultPaymentTerms`: Default payment terms
  - `defaultNotes`: Default invoice notes
  - `invoicePrefix`: Invoice number prefix
  - `autoGenerateNumber`: Auto-generate invoice numbers

**Product** - Product catalog
- `id`, `name`, `price`, `hsnCode`, `gstRate`

**WhatsappAccount** - WhatsApp business accounts
- `id`, `channelType`, `wahaBaseUrl`, `wahaApiKey`
- Linked to `Tenant`

**SalesRep** - Sales representatives
- `id`, `specialization`, `conversionRate`, `isOnLeave`
- Linked to `User`

**NurtureTemplate** - Email sequence templates
- `id`, `name`, `description`
- Contains `NurtureStep[]` (email steps)

### Industry-Specific Models

- `RestaurantOrder`, `RestaurantMenuItem`
- `RetailTransaction`, `RetailProduct`
- `ManufacturingOrder`, `ManufacturingMaterial`
- `RealEstateProperty`, `RealEstateAdvance`
- `HealthcarePatient`, `HealthcareAppointment`

**Full Schema**: See `prisma/schema.prisma` (3700+ lines)

---

## 🔌 API Structure

### Authentication

All API routes require JWT token in `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### API Endpoints

#### CRM
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get contact
- `PATCH /api/contacts/[id]` - Update contact
- `GET /api/deals` - List deals
- `POST /api/deals` - Create deal

#### Invoicing
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PATCH /api/invoices/[id]` - Update invoice
- `POST /api/invoices/[id]/generate-payment-link` - Generate payment link
- `POST /api/invoices/[id]/send-with-payment` - Send invoice with payment link
- `POST /api/invoices/[id]/track-payment-link` - Track payment link opens

#### AI Services
- `POST /api/ai/chat` - AI chat
- `POST /api/ai/generate-image` - Generate image
- `POST /api/ai/text-to-speech` - TTS
- `POST /api/ai/speech-to-text` - STT

#### WhatsApp
- `GET /api/whatsapp/accounts` - List accounts
- `POST /api/whatsapp/sessions` - Create session (QR code)
- `POST /api/whatsapp/messages/send` - Send message
- `GET /api/whatsapp/conversations` - List conversations

#### Sales Automation
- `POST /api/leads/score` - Recalculate lead scores
- `POST /api/leads/[id]/allocate` - Allocate lead
- `POST /api/leads/[id]/enroll-sequence` - Enroll in nurture sequence

#### Payments (PayAid Payments)
- `POST /api/payments/webhook` - Payment status webhook (from PayAid Payments)
- `GET/POST /api/payments/callback/success` - Customer success redirect
- `GET/POST /api/payments/callback/failure` - Customer failure redirect
- `GET/POST /api/payments/callback/cancel` - Customer cancel redirect

#### Cron Jobs
- `GET /api/cron/recalculate-scores` - Recalculate lead scores (hourly)
- `GET /api/cron/send-scheduled-emails` - Send scheduled emails (every 15 min)

**Full API Documentation**: See individual route files in `app/api/`

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
JWT_SECRET="your-secret-key-min-32-chars"
CRON_SECRET="your-cron-secret-min-32-chars"

# AI Services (at least one required)
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.1-70b-versatile"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="mistral:7b"
HUGGINGFACE_API_KEY="hf_..."
HUGGINGFACE_MODEL="google/gemma-2-2b-it"

# Image Generation (optional)
GEMINI_API_KEY="AIza_..."  # Per-tenant, can be set in dashboard
HUGGINGFACE_IMAGE_MODEL="ByteDance/SDXL-Lightning"

# Redis (optional, for queues)
REDIS_URL="redis://localhost:6379"

# Email (optional)
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# PayAid Payments (required for invoice payment links)
PAYAID_PAYMENTS_API_KEY="your-36-digit-api-key"
PAYAID_PAYMENTS_SALT="your-salt-key"
PAYAID_PAYMENTS_BASE_URL="https://your-pg-api-url.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"  # For payment return URLs

# WhatsApp (optional, requires WAHA)
WAHA_DEFAULT_URL="http://localhost:3000"
WAHA_DEFAULT_API_KEY="your-api-key"
```

### Environment File Location

- Development: `.env` (in project root)
- Production: Set in Vercel dashboard (or your hosting platform)

**Important**: Never commit `.env` file to git!

**Template**: See `env.example` (if exists)

---

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Redis (optional, for queues)
- Docker (optional, for AI services)

### 2. Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd "PayAid V3"

# Install dependencies
npm install

# Copy environment file
cp env.example .env
# Edit .env with your credentials

# Setup database
npx prisma generate
npx prisma db push

# Seed database (optional)
npm run db:seed

# Start dev server
npm run dev
```

### 3. Database Setup

**Using Supabase** (Recommended):
1. Create Supabase project
2. Get PostgreSQL connection string
3. Add to `.env`: `DATABASE_URL="postgresql://..."`
4. Run: `npx prisma db push`

**See**: `SUPABASE_SETUP.md` for detailed instructions

### 4. AI Services Setup

**Minimum Setup** (Chat only):
```env
GROQ_API_KEY="gsk_..."  # Get from https://console.groq.com
```

**Full Setup** (Chat + Images):
```env
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIza_..."  # Get from https://aistudio.google.com/app/apikey
HUGGINGFACE_API_KEY="hf_..."  # Get from https://huggingface.co/settings/tokens
```

**See**: `CLOUD_ONLY_SETUP.md` for detailed instructions

### 5. WhatsApp Setup (Optional)

1. Deploy WAHA (WhatsApp HTTP API):
   ```bash
   docker run -d --name waha -p 3000:3000 devlikeapro/waha-plus
   ```

2. Configure in PayAid:
   - Go to `/dashboard/whatsapp/accounts`
   - Add WAHA URL and API key
   - Create session and scan QR code

**See**: `WHATSAPP_IMPLEMENTATION_COMPLETE.md` for detailed instructions

### 6. Verify Setup

1. **Start server**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Register**: Create an account
4. **Test AI Chat**: Go to `/dashboard/ai/chat`
5. **Test Invoicing**: Create an invoice
6. **Test WhatsApp**: If configured, test messaging

---

## 🐛 Known Issues & Limitations

### 1. **Email Integration Not Complete**

Email sending is currently a placeholder. To enable:
- Install SendGrid: `npm install @sendgrid/mail`
- Update `lib/email/sendgrid.ts`
- Add `SENDGRID_API_KEY` to `.env`

**Status**: Placeholder code exists, needs integration

### 2. **SMS Integration Not Complete**

SMS sending is currently a placeholder. To enable:
- Choose provider (Twilio, Exotel, Wati)
- Update `lib/marketing/exotel.ts` or similar
- Add API keys to `.env`

**Status**: Placeholder code exists, needs integration

### 3. **File Storage Not Production-Ready**

File uploads are stored locally in `public/uploads/`. For production:
- Use cloud storage (S3, Supabase Storage, etc.)
- Update file upload handlers

**Status**: Works in development, needs cloud storage for production

### 4. **Rate Limiting Not Implemented**

API rate limiting is not fully implemented. Should add:
- Per-tenant rate limits
- Per-user rate limits
- Per-endpoint rate limits

**Status**: Middleware exists (`lib/middleware/rate-limit.ts`), needs configuration

### 5. **WebSocket Not Implemented**

Real-time features (chat, notifications) use polling instead of WebSockets.

**Status**: TODO comments in code, needs WebSocket implementation

### 6. **Payment Gateway Integration**

PayAid payment gateway integration exists but may need updates for production.

**Status**: Code exists, needs testing and production configuration

### 7. **Multi-Language Support**

Multi-language support is planned but not fully implemented.

**Status**: Framework exists, needs translation files

### 8. **Mobile App**

Mobile app is planned but not started.

**Status**: See `mobile/` directory for plans

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**:
   - Push code to GitHub
   - Connect to Vercel
   - Import project

2. **Configure Environment Variables**:
   - Add all required env vars in Vercel dashboard
   - Especially: `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`

3. **Configure Database**:
   - Use Supabase or another PostgreSQL provider
   - Update `DATABASE_URL` in Vercel

4. **Deploy**:
   - Vercel will auto-deploy on push
   - Cron jobs configured in `vercel.json` will work automatically

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Railway
- Render
- AWS
- DigitalOcean

**Requirements**:
- Node.js 18+
- PostgreSQL database
- Environment variables configured

---

## 🧪 Testing

### Manual Testing Checklist

**CRM**:
- [ ] Create contact
- [ ] Create deal
- [ ] Assign lead to sales rep
- [ ] Enroll lead in nurture sequence

**Invoicing**:
- [ ] Create invoice
- [ ] Configure invoice settings (templates, defaults)
- [ ] Test Reverse Charge option (show/hide, default)
- [ ] Test Zoho-style options (Order Number, Terms, Salesperson, Discount, TDS/TCS, Adjustment)
- [ ] Create invoice from Contact page
- [ ] Create invoice from Deal page
- [ ] Generate PDF
- [ ] Send invoice with payment link
- [ ] Track payment

**AI Services**:
- [ ] Test AI chat
- [ ] Generate image
- [ ] Verify tenant isolation

**WhatsApp**:
- [ ] Create account
- [ ] Create session (scan QR)
- [ ] Send/receive messages

### Test Scripts

```bash
# Test lead scoring
npx tsx scripts/test-lead-scoring.ts

# Test lead allocation
npx tsx scripts/test-lead-allocation.ts
```

### Database Testing

```bash
# Open Prisma Studio
npx prisma studio

# View database in browser
# Navigate to http://localhost:5555
```

---

## 📈 Future Roadmap

### Short Term (Next 4 Weeks)
- [ ] Complete Restaurant module
- [ ] Complete Retail module
- [ ] Complete Manufacturing module
- [ ] Email integration (SendGrid)
- [ ] SMS integration (Twilio/Exotel)
- [ ] Production file storage

### Medium Term (Next 3 Months)
- [ ] 20 industry modules
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Custom workflows
- [ ] API for third-party integrations

### Long Term (6-12 Months)
- [ ] 50 industry modules
- [ ] Enterprise features
- [ ] Multi-language support
- [ ] Advanced AI features
- [ ] White-label solution

**See**: `payaid-multi-industry-executive-summary.md` for full roadmap

---

## 📚 Key Documentation Files

### Setup & Configuration
- `SUPABASE_SETUP.md` - Database setup
- `CLOUD_ONLY_SETUP.md` - AI services setup
- `WHATSAPP_IMPLEMENTATION_COMPLETE.md` - WhatsApp setup
- `AI_DEBUGGING_GUIDE.md` - AI troubleshooting

### Feature Documentation
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Lead management features
- `AI_SERVICES_IMPLEMENTATION_COMPLETE.md` - AI services
- `WHATSAPP_IMPLEMENTATION_COMPLETE.md` - WhatsApp module
- `TENANT_ISOLATION_EXPLAINED.md` - Multi-tenancy

### Business Documentation
- `payaid-multi-industry-executive-summary.md` - Business strategy
- `AI_BUSINESS_DOCUMENT_SUPPORT.md` - AI business features

---

## 🔐 Security Notes

### Critical Security Practices

1. **Always filter by tenantId** - Never query without tenant filtering
2. **Validate all inputs** - Use Zod schemas for validation
3. **Never expose API keys** - Keep secrets in environment variables
4. **Use HTTPS in production** - Never use HTTP for production
5. **Sanitize user inputs** - Prevent XSS and SQL injection
6. **Rate limit APIs** - Prevent abuse
7. **Audit sensitive operations** - Log important actions

### Security Checklist

- [ ] All API routes use `authenticateRequest`
- [ ] All database queries filter by `tenantId`
- [ ] All user inputs validated with Zod
- [ ] API keys stored in environment variables
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens have expiration
- [ ] CORS configured properly
- [ ] Rate limiting implemented

---

## 💡 Development Tips

### 1. Use Prisma Studio for Database Exploration

```bash
npx prisma studio
```

Opens a GUI to explore the database. Very helpful for debugging.

### 2. Check Server Logs

Always check the server console when debugging. The AI services log extensively:
- `🔑 Environment check: ...`
- `🔄 Attempting Groq API call...`
- `📤 Groq request: ...`

### 3. Test API Endpoints Directly

Use `curl` or Postman to test API endpoints:

```bash
curl http://localhost:3000/api/contacts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Use TypeScript Strictly

The project uses strict TypeScript. Always:
- Define proper types
- Avoid `any`
- Use Zod for runtime validation

### 5. Follow Existing Patterns

When adding new features:
- Follow the existing API route pattern
- Use the same authentication middleware
- Follow the same error handling pattern
- Use the same component structure

---

## 🆘 Troubleshooting

### "Cannot find module '@/lib/...'"

**Solution**: Check `tsconfig.json` paths configuration. Should have:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### "Prisma Client not generated"

**Solution**: Run `npx prisma generate`

### "API key not working"

**Solution**: 
1. Check `.env` file has the key
2. **Restart dev server** (Next.js doesn't auto-reload `.env`)
3. Verify key format is correct

### "Database connection failed"

**Solution**:
1. Check `DATABASE_URL` in `.env`
2. Verify database is accessible
3. Check firewall rules (Supabase allows all IPs by default)

### "Tenant not found" errors

**Solution**: 
1. Verify user has a valid `tenantId`
2. Check authentication is working
3. Verify tenant exists in database

### "Cron jobs not running"

**Solution**:
1. Check `CRON_SECRET` is set in environment
2. Verify `vercel.json` has cron configuration
3. For local testing, use a cron job scheduler or manual triggers

---

## 📞 Support & Resources

### Internal Documentation
- See `*.md` files in project root for feature-specific docs
- Check `prisma/schema.prisma` for database structure
- Review `lib/` directory for utility functions

### External Resources
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Groq**: https://console.groq.com/docs
- **Supabase**: https://supabase.com/docs

---

## ✅ Handover Checklist

Before handing over to a new developer/AI:

- [x] All code is committed to repository
- [x] Environment variables documented
- [x] Database schema documented
- [x] API endpoints documented
- [x] Setup instructions provided
- [x] Known issues documented
- [x] Development quirks documented
- [x] Key files identified
- [x] Security practices documented

---

**Last Updated**: December 21, 2025  
**Maintained By**: Development Team  
**Status**: Active Development

---

## 📝 Recent Updates (December 21, 2025)

### Invoice Module Enhancements

1. **Invoice Settings Page** (`/dashboard/settings/invoices`)
   - Admin can configure default invoice template
   - Toggle Reverse Charge option visibility
   - Set default Reverse Charge value
   - Configure default payment terms and notes
   - Customize invoice numbering (prefix, auto-generation)

2. **Zoho-Style Invoice Options**
   - Added Order Number field
   - Payment Terms dropdown with standard options
   - Accounts Receivable selection
   - Salesperson assignment (from Sales Reps)
   - Discount field (amount or percentage)
   - TDS/TCS section with tax selection
   - Adjustment field for final amount modifications
   - File attachment support
   - Save as Draft and Save and Send buttons
   - Make Recurring option (UI ready)

3. **UI Improvements**
   - Fixed sticky footer positioning (no longer covers sidebar)
   - Enhanced invoice summary with discount, TDS/TCS, and adjustment display
   - Improved form layout matching Zoho Books interface

4. **Invoice Creation Enhancements**
   - Create invoice from Contact detail page
   - Create invoice from Deal detail page
   - Auto-fill customer details from selected contact
   - Auto-fill Place of Supply from tenant profile
   - Conditional Reverse Charge display based on settings

**Key Files Updated**:
- `app/dashboard/settings/invoices/page.tsx` - New invoice settings page
- `app/api/settings/invoices/route.ts` - Invoice settings API
- `app/dashboard/invoices/new/page.tsx` - Enhanced invoice creation form
- `app/api/invoices/route.ts` - Updated invoice creation schema
- `prisma/schema.prisma` - Added `invoiceSettings` JSON field to Tenant model

---

## 🎯 Quick Start for New Developers

1. **Read this document** (you're doing it!)
2. **Read `payaid-multi-industry-executive-summary.md`** for business context
3. **Set up local environment** (see Setup Instructions)
4. **Explore the codebase** using Prisma Studio
5. **Test features** using the manual testing checklist
6. **Start with small changes** to understand the patterns
7. **Always filter by tenantId** in database queries
8. **Restart dev server** after changing `.env`

**Welcome to PayAid V3! 🚀**
