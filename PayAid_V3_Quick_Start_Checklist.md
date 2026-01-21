# PayAid V3: Quick Start Checklist for Your Development Team
## Before You Start with Cursor: Preparation Checklist

---

## STEP 1: Project Preparation (Do This First)

### 1.1 Create PayAid Payments Account
- [ ] Sign up at https://payaidpayments.com/api-developer-kits/
- [ ] Read: https://payaidpayments.com/wp-content/uploads/2023/05/Payment_Gateway_Integration_Guide.pdf
- [ ] Generate API Key + Secret Key (TEST mode first)
- [ ] Store credentials securely (we'll use in env vars, never in code)
- [ ] Test sandbox endpoint

### 1.2 Set Up Development Infrastructure
```bash
# Create GitHub repository
git init payaid-v3
git config user.name "Your Name"
git config user.email "your@email.com"

# Initialize monorepo structure
mkdir -p apps/web packages/{ui,types,utils,hooks,payaid-sdk}
mkdir -p docs .github/workflows

# Create initial package.json (root)
npm init -w apps/web -w packages/ui -w packages/types -w packages/utils -w packages/hooks

# Install global dependencies
npm install -g typescript prettier eslint
```

### 1.3 Environment Setup
Create `.env.example` file (commit to repo, DO NOT commit actual keys):
```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# PayAid Payments
PAYAID_API_KEY=your_test_api_key_here
PAYAID_SECRET_KEY=your_test_secret_key_here
PAYAID_ENVIRONMENT=sandbox

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/payaid_v3
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxx
OPENAI_ORG_ID=org-xxxxx

# Ollama (for local AI)
OLLAMA_BASE_URL=http://localhost:11434

# WhatsApp (WAHA)
WHATSAPP_API_KEY=your_waha_key
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/webhooks/whatsapp
```

### 1.4 Set Up Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create new project or connect to existing
supabase projects list

# Initialize local development
supabase init

# Start local Supabase instance
supabase start

# Run database migrations (see section below)
supabase migration up
```

### 1.5 Create Initial Git Commits
```bash
# Commit 1: Project structure
git add .
git commit -m "chore: Initialize PayAid V3 monorepo structure"

# Commit 2: Environment files
git add .env.example
git commit -m "chore: Add environment variables template"

# Commit 3: TypeScript configuration
git add tsconfig.json tsconfig.app.json
git commit -m "chore: Configure TypeScript strict mode"

# Tag initial version
git tag v0.0.1
```

---

## STEP 2: Prepare Cursor with This Prompt

### 2.1 Before Opening Cursor:
1. [ ] Copy the full `PayAid_V3_Cursor_Prompt.md` file content
2. [ ] Copy the `PayAid_V3_Strategic_Enhancements.md` content
3. [ ] Copy this checklist to reference

### 2.2 First Message to Cursor (Copy-Paste This):
```
I'm building PayAid V3 - a comprehensive SaaS platform for Indian SMBs supporting 20 industries.

I have a detailed architecture document and implementation requirements. Before we start coding, please confirm you understand these CRITICAL RULES:

1. **NO COMPETITOR MENTIONS** - Zero mentions of Salesforce, HubSpot, Zoho, NetSuite, Shopify, Stripe, Razorpay, etc. anywhere in code or UI
2. **CURRENCY ONLY: ₹ (INR)** - No USD, $, or other currencies. All amounts in Indian Rupees
3. **PAYMENT GATEWAY: PayAid Payments ONLY** - No Stripe, Square, Razorpay, or any other gateway
4. **TYPESCRIPT STRICT MODE** - All types strict, no 'any', build must pass without warnings
5. **VERCEL DEPLOYMENT** - Code must be production-ready for Vercel deployment
6. **ENVIRONMENT VARIABLES** - All config external (.env), no hardcoding
7. **ERROR HANDLING** - All API routes have proper error handling and logging
8. **NO BROWSER STORAGE** - No localStorage/sessionStorage (causes SecurityError in sandbox)

I'll share detailed implementation guidelines momentarily. Questions before we proceed?
```

### 2.3 Provide Full Prompt Context to Cursor
```
Now, here's the complete implementation prompt:

[PASTE FULL CONTENT OF PayAid_V3_Cursor_Prompt.md HERE]

And here are strategic enhancements:

[PASTE FULL CONTENT OF PayAid_V3_Strategic_Enhancements.md HERE]

Can you confirm you understand:
1. All 10 strict implementation rules?
2. All 20 industry module requirements?
3. Module architecture pattern?
4. PayAid Payments integration requirements?
5. Vercel deployment checklist?

If yes, I'll provide the specific task for Phase 1 implementation.
```

---

## STEP 3: Initial Setup Tasks (For Cursor)

### Task 1: Project Scaffolding (First Cursor Prompt)
```
Task: Create initial Next.js 14 app with TypeScript strict mode

Requirements:
1. Create Next.js 14 app with App Router (/app directory)
2. Configure TypeScript: strict: true, noImplicitAny: true, noUnusedLocals: true
3. Set up folder structure:
   - /app/api (API routes)
   - /app/(auth) (auth pages)
   - /app/(dashboard) (main app)
   - /components (shared components)
   - /lib (utilities, helpers)
   - /types (TypeScript types)
4. Install dependencies:
   - next@14
   - react@18
   - typescript
   - tailwindcss
   - zod (validation)
   - supabase
   - @supabase/auth-helpers-nextjs
5. Configure Tailwind with design system colors (provided)
6. Create .env.local from .env.example template
7. Ensure `npm run build` succeeds without warnings
8. Run `npm run type-check` - must pass

DO NOT:
- Mention any competitors
- Use USD or $ currency
- Configure any payment gateway other than PayAid
- Use localStorage or sessionStorage
- Hardcode any configuration values
```

### Task 2: Database Schema (Second Cursor Prompt)
```
Task: Create Supabase PostgreSQL schema with RLS policies

Requirements:
1. Create tables:
   - organizations (with industry_id, currency_code='INR' only)
   - users (org_id, role)
   - subscriptions (org_id, billing_cycle, status)
   - audit_log (for compliance)
2. Enable RLS (Row Level Security) on all tables
3. Create policies:
   - Users can only access their org's data
   - Service role can access everything (for admin)
4. Add indexes for performance:
   - organizations(industry_id)
   - users(org_id)
   - subscriptions(org_id)
5. Run migrations successfully
6. Verify schema in Supabase dashboard

DO NOT:
- Create any multi-currency support
- Allow currencies other than INR
```

### Task 3: Authentication System (Third Cursor Prompt)
```
Task: Implement Supabase authentication with multi-tenancy

Requirements:
1. Set up Supabase Auth
2. Create signup flow:
   - Email/password
   - Organization name (required)
   - Industry selection (dropdown with all 20 industries)
   - Phone number
3. Create login flow
4. Add logout
5. Create middleware to check auth (redirect to /login if not authenticated)
6. Add RLS policies: users see only their org's data
7. Create auth types in /types/auth.ts
8. Test: signup → login → dashboard (should work)

DO NOT:
- Use OAuth for now (keep it simple)
- Store passwords in plain text (use Supabase's built-in hashing)
```

### Task 4: PayAid Payments Integration (Fourth Cursor Prompt)
```
Task: Create PayAid Payments integration

Requirements:
1. Create /lib/payaid.ts with PayAidPayments client initialization
2. Create /app/api/payments/create-intent route:
   - Accept: userId, orderId, amount (in ₹), metadata
   - Call PayAid API to create payment intent
   - Return: intentId, paymentLink
3. Create /app/api/webhooks/payaid route:
   - Verify webhook signature
   - Handle events: payment.success, payment.failed, payment.refunded
   - Update order status in database
4. Create /components/PaymentButton.tsx:
   - Button that opens PayAid Payments modal
   - Handle success/failure callbacks
5. Test end-to-end in SANDBOX mode
6. Error handling: all payaid calls wrapped in try-catch with logging

DO NOT:
- Use any other payment gateway
- Hardcode API keys (use env vars)
- Forget webhook verification (security critical)

Security Checks:
- Verify PAYAID_SECRET_KEY for webhook signatures
- Validate amount matches database record
- Log all payment events for audit trail
```

### Task 5: Landing Page & Onboarding (Fifth Cursor Prompt)
```
Task: Create landing page and industry selection onboarding

Requirements:
1. Create /app/(landing)/page.tsx:
   - Hero section: "PayAid V3 - Business Operating System for India"
   - Feature highlights (NO competitor mentions)
   - Industry-specific value prop
   - CTA: "Start Free Trial"
2. Create /app/onboarding/industry-select.tsx:
   - Display all 20 industries as cards with icons
   - Show base modules for each industry
   - Show recommended add-ons
   - User selects industry
3. Create /app/onboarding/module-review.tsx:
   - Show selected industry
   - Display base modules (cannot be deselected)
   - Display recommended add-ons (with toggle to add)
   - Pricing summary (all in ₹)
   - Review before subscription
4. Add navigation: Landing → Signup → Industry Selection → Module Review → Subscribe
5. All text in English, currency only ₹

DO NOT:
- Mention any competitors
- Show $ symbols anywhere
- Mention any payment gateway except PayAid
- Show any pricing in USD or other currency
```

---

## STEP 4: Code Quality Checklist

Before each Cursor commit, verify:

### TypeScript Safety
```bash
npm run type-check
# Should output: "Successfully compiled X files with TypeScript"
# No errors allowed
```

### Build Success
```bash
npm run build
# Should output: "✓ Ready to start production server"
# No errors or warnings
```

### Linting
```bash
npm run lint
# Should output: "X files checked. X files match linting rules"
# No errors in production code
```

### Competitor Mentions Audit
```bash
# Search entire codebase for forbidden terms
grep -r "Salesforce\|HubSpot\|Zoho\|NetSuite\|Shopify\|Stripe\|Razorpay" . --include="*.ts" --include="*.tsx" --include="*.json"
# Should output: No matches
```

### Currency Audit
```bash
# Search for $ symbol (forbidden)
grep -r "\$" . --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" | grep -v "node_modules" | grep -v ".git"
# Should output: Minimal matches, none in production code
```

---

## STEP 5: Weekly Verification Tasks

### Every Monday: Vercel Deployment Check
```bash
# Simulate Vercel build
npm run build
npm start

# Verify:
# - App starts without errors
# - All pages load
# - API routes respond correctly
# - No console errors
```

### Every Friday: Full Audit
```bash
# Run all checks
npm run type-check && npm run lint && npm run build

# Manual audit:
# - Open in browser: http://localhost:3000
# - Test: signup, login, logout
# - Test: PayAid payment flow (sandbox)
# - Check database: verify data integrity
# - Search codebase: no competitor mentions, no $ symbols
```

---

## STEP 6: Progress Milestones

### Week 1: Foundation
- [ ] Project scaffolding complete (Next.js, TypeScript, TailwindCSS)
- [ ] Supabase connected and migrated
- [ ] Authentication working (signup, login, logout)
- [ ] Build succeeds without errors

### Week 2: Core Infrastructure
- [ ] PayAid Payments integration (sandbox mode)
- [ ] Payment webhook handling
- [ ] Organization + subscription model
- [ ] Industry selection onboarding
- [ ] Landing page with zero competitor mentions

### Week 3: CRM Module (First Industry)
- [ ] Contact management (create, read, update, delete)
- [ ] Contact segmentation
- [ ] Communication history timeline
- [ ] Contact list + details view
- [ ] API endpoints (fully typed)

### Week 4: Finance Module (First Industry)
- [ ] Invoice creation (GST-compliant template)
- [ ] Invoice listing and search
- [ ] Invoice → Payment flow (via PayAid)
- [ ] Income statement generation
- [ ] Expense tracking

### Week 5: First Industry MVP Complete
- [ ] CRM + Finance modules working
- [ ] 3 other base modules (basic UI)
- [ ] Pricing page (all ₹)
- [ ] Subscription management
- [ ] Ready for beta users

---

## FINAL CHECKLIST: Before Sending First Code to Cursor

- [ ] PayAid Payments account created (test mode keys obtained)
- [ ] Supabase project created (connection string obtained)
- [ ] GitHub repo initialized (ready for commits)
- [ ] .env.example created (all required vars listed)
- [ ] All 3 prompts documents prepared
- [ ] Cursor session opened and ready
- [ ] Team understands strict rules (no competitors, ₹ only, PayAid only)
- [ ] Commit message conventions documented (feat/, fix/, docs/)
- [ ] Code review checklist created (TypeScript strict, error handling, logging)
- [ ] Deployment checklist bookmarked (Vercel requirements)
- [ ] Weekly verification tasks scheduled
- [ ] Success criteria understood by entire team

---

## TROUBLESHOOTING: Common Issues During Development

### Issue 1: "TypeScript error: noImplicitAny"
**Solution:** Ensure ALL variables, function parameters, and return types are explicitly typed.
```typescript
// ❌ WRONG
const getValue = (data) => data.name;

// ✅ CORRECT
const getValue = (data: { name: string }): string => data.name;
```

### Issue 2: "Vercel Build Fails: Unexpected token"
**Solution:** Ensure all TypeScript files are valid (no syntax errors). Run `npm run type-check` before deploying.

### Issue 3: "PayAid Payment Webhook Not Triggering"
**Solution:** 
1. Verify webhook URL in PayAid dashboard matches your environment
2. Verify signature verification code is correct
3. Check Vercel Logs for webhook delivery status
4. Test webhook manually in PayAid sandbox dashboard

### Issue 4: "Supabase RLS Policy: New row violates row level security policy"
**Solution:** Ensure INSERT statement includes org_id and user has proper auth context set (using Supabase client).

### Issue 5: "Cannot find module 'payaid-payments-sdk'"
**Solution:** Create mock SDK wrapper in `/packages/payaid-sdk` until official package available. Use HTTP client to call PayAid API directly.

---

## DOCUMENT SHARING INSTRUCTIONS

**Send to your development team:**

1. **PayAid_V3_Cursor_Prompt.md** - The main implementation guide (paste into Cursor)
2. **PayAid_V3_Strategic_Enhancements.md** - Strategic features + roadmap (reference)
3. **This checklist** - Quick reference for setup and weekly verification
4. **Module Recommendations Document** - The revised industry recommendations (context)

**Team Meeting Before Starting:**
```
Agenda: PayAid V3 Development Kickoff (2 hours)

1. Project Overview (15 min)
   - Vision: Unified business OS for Indian SMBs
   - Scope: 20 industries, multi-module platform
   - Timeline: 12-month roadmap (MVP in 3 months)

2. Strict Rules Review (30 min)
   - Rule 1: Zero competitor mentions (read examples)
   - Rule 2: ₹ (INR) only (audit checklist)
   - Rule 3: PayAid Payments only (API integration)
   - Rule 4: TypeScript strict mode (demo error)
   - Rule 5: Vercel deployment (checklist)
   - Rule 6: Environment variables (no hardcoding)
   - Rule 7: Error handling (demo pattern)

3. Tech Stack & Tools (15 min)
   - Next.js 14 App Router
   - TypeScript strict mode
   - Supabase + PostgreSQL
   - PayAid Payments API
   - Vercel deployment

4. Development Setup (15 min)
   - GitHub repo structure
   - Environment variables setup
   - Local development (Supabase, Ollama optional)
   - Commit conventions
   - Code review checklist

5. Q&A (15 min)
   - Technical questions
   - Clarify strict rules
   - Timeline expectations
```

---

## CALENDAR: Recommended Timeline

**Week 1 (Feb 24-28):** Setup + Foundation
- Mon: PayAid account, Supabase setup, GitHub init
- Tue-Thu: Next.js scaffolding, TypeScript config, database setup
- Fri: Verification + adjustments

**Week 2 (Mar 3-7):** Core Infrastructure  
- Mon-Tue: Auth system (signup, login, logout)
- Wed-Thu: PayAid Payments integration (sandbox)
- Fri: Landing page + onboarding UI

**Week 3 (Mar 10-14):** First Industry (Retail) - CRM Module
- Mon: Contact management CRUD
- Tue: Segmentation + filtering
- Wed: Communication timeline
- Thu: API endpoints
- Fri: Testing + bug fixes

**Week 4 (Mar 17-21):** Finance Module
- Mon: Invoice creation (GST template)
- Tue: Invoice management UI
- Wed: Payment integration
- Thu: Financial reporting
- Fri: Testing + deployment to staging

**Week 5 (Mar 24-28):** Polish + Beta
- Mon-Tue: Additional base modules (basic)
- Wed: Pricing page + subscription management
- Thu: Bug fixes + performance optimization
- Fri: Ready for first beta users!

---

## SUCCESS! 🎉

When you complete this checklist, you'll have:

✅ A fully functioning PayAid V3 MVP  
✅ First industry (Retail or Restaurant) with 5 base modules  
✅ PayAid Payments integration end-to-end  
✅ Zero deviations from strict rules  
✅ Vercel deployment ready  
✅ Ready for first 100 beta users  
✅ Foundation to add remaining 19 industries  

**Next: Launch beta, gather feedback, iterate on UX, then expand to 20 industries!**

