# PayAid V3: Complete Implementation Prompt for Cursor
## Comprehensive Development Brief with Strict Guidelines

---

## PROJECT OVERVIEW

**Project Name:** PayAid V3 - Comprehensive Business Operating System for Indian SMBs

**Objective:** Build a full-stack, multi-module SaaS platform supporting 20 industry verticals with AI-powered automation, real-time analytics, and omnichannel integration.

**Target Market:** Indian SMBs (₹5L - ₹5Cr revenue), startups, freelancers, and professional services firms

**Tech Stack (MANDATORY - No Deviations):**
- **Frontend:** Next.js 14+ (App Router), TypeScript (strict mode), React 18+, TailwindCSS
- **Backend:** Next.js API Routes or Node.js/Express (TypeScript), Supabase/PostgreSQL
- **Real-time:** Supabase Realtime or Socket.io (for collaborative features)
- **AI Integration:** OpenAI API, Ollama (self-hosted for cost optimization)
- **Payment Processing:** PayAid Payments API ONLY (https://payaidpayments.com/api-developer-kits/)
- **Mobile:** React Native or responsive web (mobile-first design)
- **Deployment:** Vercel (frontend), Railway/Render (backend), Supabase Cloud (database)
- **Version Control:** GitHub with strict commit conventions (feat/, fix/, docs/ prefixes)

**Deployment Checklist (Vercel-Ready):**
- [ ] All environment variables documented in `.env.example`
- [ ] No hardcoded API keys, endpoints, or configuration
- [ ] TypeScript strict mode enabled in `tsconfig.json`
- [ ] All pages and API routes have proper error handling and logging
- [ ] Build succeeds without warnings or errors: `npm run build`
- [ ] All external API calls wrapped with retry logic and timeouts
- [ ] Database migrations versioned and tracked in version control

---

## STRICT IMPLEMENTATION RULES

### Rule 1: NO COMPETITOR MENTIONS
- ❌ **NEVER mention:** Salesforce, HubSpot, Zoho, NetSuite, Shopify, Oracle, Microsoft Dynamics, QuickBooks, Wave, FreshBooks, Stripe, Square, Razorpay, or any other competitor
- ❌ **NEVER use:** Comparison tables, feature comparisons, "vs. [competitor]" language
- ❌ **NEVER say:** "Like Salesforce but for Indians" or "Affordable alternative to HubSpot"
- ✅ **Instead use:** "PayAid V3 is a unified business operating system for Indian SMBs"
- ✅ **Brand positioning:** "All-in-one platform designed for India-first operations"
- **Landing Page Rule:** Zero competitor mentions anywhere (homepage, pricing, features, docs, in-app)

**Implementation Check:**
```javascript
// Forbidden patterns - catch these in code review
const forbiddenTerms = [
  'Salesforce', 'HubSpot', 'Zoho', 'NetSuite', 'Shopify', 'Oracle', 'Microsoft Dynamics',
  'QuickBooks', 'Wave', 'FreshBooks', 'Stripe', 'Square', 'Razorpay', 'alternative to',
  'vs.', 'compared to', 'like Salesforce', 'like HubSpot'
];
// Add linter rule to catch these in production
```

### Rule 2: INDIAN RUPEE ONLY (₹)
- ❌ **NEVER display:** USD ($), $ symbol, any currency except ₹
- ✅ **Always use:** ₹ symbol with "₹" HTML entity (`&rupee;` or Unicode U+20B9)
- ✅ **Format:** ₹1,00,000 (Indian number format with commas) or ₹1.5L, ₹10Cr
- ✅ **Pricing tiers:** Display in ₹ only, no multi-currency toggle

**Implementation Across All Areas:**
```typescript
// Currency formatting utility
export const formatCurrency = (amount: number, locale: 'en-IN' = 'en-IN'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Usage: formatCurrency(100000) → "₹1,00,000"

// Validation: Reject any request with non-INR currency
if (currency !== 'INR') {
  throw new Error('Only Indian Rupee (INR) is supported');
}
```

**Audit Checklist:**
- [ ] All price displays use ₹ symbol
- [ ] All API responses return amount in INR with currency: 'INR' field
- [ ] No hardcoded $ or USD anywhere
- [ ] Database stores currency as 'INR' by default
- [ ] Search/replace all files: ensure zero $ symbol occurrences
- [ ] Test: curl API endpoints, verify INR in responses

### Rule 3: PayAid Payments Integration ONLY
- ❌ **NEVER integrate:** Stripe, Square, Razorpay, Instamojo, PhonePe, Google Pay, or any other payment gateway
- ✅ **ONLY use:** PayAid Payments API (https://payaidpayments.com/api-developer-kits/)
- ✅ **Documentation:** https://payaidpayments.com/wp-content/uploads/2023/05/Payment_Gateway_Integration_Guide.pdf

**PayAid Payments Integration Requirements:**
```typescript
// Initialize PayAid Payments Client
import PayAidPayments from '@payaid/payments-sdk';

const paymentClient = new PayAidPayments({
  apiKey: process.env.PAYAID_API_KEY,
  secretKey: process.env.PAYAID_SECRET_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
});

// Create Payment Intent (for all transactions)
export async function createPaymentIntent(
  amount: number, // in paisa (₹1 = 100 paisa)
  orderId: string,
  customerId: string,
  metadata: Record<string, any>
) {
  try {
    const intent = await paymentClient.paymentIntents.create({
      amount: amount * 100, // Convert rupees to paisa
      currency: 'INR',
      orderId,
      customerId,
      description: metadata.description,
      metadata,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payaid`,
    });
    return intent;
  } catch (error) {
    console.error('PayAid Payment Intent Creation Failed:', error);
    throw new Error('Payment initialization failed');
  }
}

// Verify Webhook Signature
export function verifyPayAidSignature(
  signature: string,
  payload: string,
  secretKey: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

// Webhook Handler
export async function handlePayAidWebhook(req: NextApiRequest, res: NextApiResponse) {
  const signature = req.headers['x-payaid-signature'] as string;
  const payload = JSON.stringify(req.body);

  if (!verifyPayAidSignature(signature, payload, process.env.PAYAID_SECRET_KEY!)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  switch (event) {
    case 'payment.success':
      // Update order status to PAID
      await updateOrderStatus(data.orderId, 'PAID');
      await createInvoice(data.orderId);
      break;
    case 'payment.failed':
      // Update order status to FAILED
      await updateOrderStatus(data.orderId, 'FAILED');
      break;
    case 'payment.refunded':
      // Handle refund
      await createRefundRecord(data.orderId, data.refundAmount);
      break;
  }

  res.status(200).json({ status: 'webhook_received' });
}
```

**Environment Variables (MANDATORY):**
```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYAID_API_KEY=your_payaid_api_key
PAYAID_SECRET_KEY=your_payaid_secret_key
PAYAID_ENVIRONMENT=sandbox # or 'live' for production
```

**Configuration in Next.js:**
```typescript
// lib/payaid.ts
import PayAidPayments from '@payaid/payments-sdk';

export const initializePayAid = () => {
  const requiredEnvVars = ['PAYAID_API_KEY', 'PAYAID_SECRET_KEY'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required PayAid environment variables: ${missing.join(', ')}`);
  }

  return new PayAidPayments({
    apiKey: process.env.PAYAID_API_KEY!,
    secretKey: process.env.PAYAID_SECRET_KEY!,
    environment: process.env.PAYAID_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
  });
};

export const payaid = initializePayAid();
```

**All Payment Flows:**
1. ✅ Subscription billing
2. ✅ One-time purchases (modules, add-ons)
3. ✅ Refunds (automatic sync with accounting module)
4. ✅ Invoice payment collection (for customers paying invoices)
5. ✅ Vendor payments (for supplier management module)
6. ✅ Payroll processing (for HR module)
7. ✅ Expense reimbursement (for admin module)

### Rule 4: TypeScript Strict Mode Mandatory
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  }
}
```

### Rule 5: Vercel Deployment Requirements
- ✅ **All environment variables:** Documented in `.env.example`
- ✅ **Build output:** Must succeed: `npm run build` → `npm start`
- ✅ **No dev dependencies in production:** Verify `package.json` separates dev vs. production
- ✅ **API routes:** All with error handling, proper status codes, CORS headers
- ✅ **Image optimization:** Use `next/image` with proper sizing
- ✅ **Database:** Vercel Postgres or Supabase (with connection pooling)
- ✅ **Logs:** All API calls logged to Vercel Logs for debugging

**Vercel Configuration (vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "env": {
    "NEXT_PUBLIC_APP_URL": "@next_public_app_url",
    "DATABASE_URL": "@database_url",
    "PAYAID_API_KEY": "@payaid_api_key",
    "PAYAID_SECRET_KEY": "@payaid_secret_key",
    "PAYAID_ENVIRONMENT": "sandbox"
  },
  "functions": {
    "api/**": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/webhooks/:path*",
      "destination": "/api/webhooks/[...path].ts"
    }
  ]
}
```

### Rule 6: No Hardcoded Configuration
- ✅ All config: `.env.local`, environment-specific
- ✅ Database credentials: Never in code
- ✅ API keys: Always via environment variables
- ✅ Feature flags: Supabase config table or env variables

### Rule 7: Error Handling & Logging
```typescript
// Consistent error handling across all API routes
import { NextApiRequest, NextApiResponse } from 'next';
import { log } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate input
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Business logic
    const result = await processPayment(userId, amount);

    log.info('Payment processed', { userId, amount, result });
    return res.status(200).json(result);
  } catch (error) {
    log.error('Payment processing failed', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## ARCHITECTURE & MODULE STRUCTURE

### Directory Structure (Mandatory)
```
payaid-v3/
├── apps/
│   ├── web/ (Next.js frontend + API routes)
│   ├── mobile/ (React Native - future)
│   └── admin/ (Admin dashboard)
├── packages/
│   ├── ui/ (Shared components, TailwindCSS)
│   ├── types/ (Shared TypeScript types)
│   ├── utils/ (Shared utilities)
│   ├── hooks/ (Custom React hooks)
│   └── payaid-sdk/ (PayAid Payments wrapper)
├── docs/
│   ├── API.md (API documentation)
│   ├── MODULES.md (Module specifications)
│   ├── ARCHITECTURE.md (System design)
│   └── PAYAID_INTEGRATION.md (Payment integration guide)
├── .github/
│   └── workflows/ (CI/CD: TypeScript check, build, test)
├── docker-compose.yml (Local development stack)
└── README.md (Project overview)
```

### Module Architecture

Each industry module should follow this standardized structure:

```typescript
// modules/[industry]/index.ts
export const moduleConfig = {
  id: 'retail', // unique identifier
  name: 'Retail Management',
  icon: 'ShoppingCart',
  industries: ['Retail Shop / Chain'],
  baseModules: [
    'CRM',
    'Finance',
    'Inventory',
    'POS & Sales',
    'Marketing & AI Content',
    'Analytics',
    'Productivity',
  ],
  recommendedAddOns: [
    {
      id: 'omnichannel-loyalty',
      name: 'Omnichannel Loyalty',
      description: 'Unified points across online/offline',
      pricing: { monthly: 499, annual: 4990 }, // in ₹
      features: ['Unified loyalty', 'Referrals', 'Email integration'],
    },
    // ... more add-ons
  ],
};

// modules/[industry]/components/Dashboard.tsx
import { BaseModuleLayout } from '@/components/BaseModuleLayout';

export function RetailDashboard() {
  return (
    <BaseModuleLayout module="retail">
      {/* Retail-specific dashboard content */}
    </BaseModuleLayout>
  );
}

// modules/[industry]/api/[endpoint].ts (REST API for this module)
```

### Base Module Structure

```typescript
// modules/base/crm/index.ts
export interface CRMConfig {
  moduleName: 'CRM';
  features: {
    contactManagement: boolean;
    leadTracking: boolean;
    communicationHistory: boolean;
    segmentation: boolean;
    automationRules: boolean;
  };
  dataModels: {
    Contact: ContactSchema;
    Lead: LeadSchema;
    Company: CompanySchema;
  };
}

// modules/base/crm/components/
// ├── ContactList.tsx
// ├── LeadTracker.tsx
// ├── CommunicationTimeline.tsx
// └── SegmentBuilder.tsx

// modules/base/crm/api/
// ├── contacts.ts (GET, POST, PUT, DELETE)
// ├── leads.ts
// ├── segments.ts
// └── automations.ts
```

---

## STRICT IMPLEMENTATION GUIDELINES

### 1. Component Development
```typescript
// ✅ CORRECT: Fully typed, error handling, accessibility
'use client'; // Mark client components in Next.js 13+

import { FC, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface ContactListProps {
  industryId: string;
  onSelectContact: (contactId: string) => void;
}

export const ContactList: FC<ContactListProps> = ({ 
  industryId, 
  onSelectContact 
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/contacts?industryId=${industryId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`);
      }
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [industryId]);

  // Accessibility: ARIA labels, keyboard navigation
  return (
    <div role="region" aria-label="Contact List">
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      <ul>
        {contacts.map(contact => (
          <li key={contact.id}>
            <Button
              onClick={() => onSelectContact(contact.id)}
              aria-label={`Select ${contact.name}`}
            >
              {contact.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### 2. API Route Development
```typescript
// ✅ CORRECT: Typed request/response, validation, error handling
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAuth } from '@/lib/auth';
import { log } from '@/lib/logger';

// Input validation schema
const CreateContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  industryId: z.string().uuid(),
});

type CreateContactRequest = z.infer<typeof CreateContactSchema>;

export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const user = await validateAuth(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedData = CreateContactSchema.parse(body);

    // Process request
    const contact = await createContact(user.id, validatedData);

    log.info('Contact created', { userId: user.id, contactId: contact.id });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    log.error('Failed to create contact', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Database Schema (Supabase/PostgreSQL)
```sql
-- Core tables (MUST BE CREATED FIRST)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry_id VARCHAR(50) NOT NULL, -- freelancer, retail, restaurant, etc.
  country_code VARCHAR(2) NOT NULL DEFAULT 'IN',
  currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (country_code = 'IN'), -- Only Indian organizations
  CHECK (currency_code = 'INR') -- Only Indian Rupee
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL, -- starter, professional, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, cancelled
  billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly', -- monthly, annual
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  payment_method_id VARCHAR(255), -- PayAid Payments customer ID
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

### 4. Type Safety Across Project
```typescript
// types/index.ts (Shared types - single source of truth)
export interface Organization {
  id: string;
  name: string;
  industryId: IndustryType;
  countryCode: 'IN'; // Only India
  currencyCode: 'INR'; // Only INR
  createdAt: Date;
  updatedAt: Date;
}

export type IndustryType = 
  | 'freelancer'
  | 'service-business'
  | 'retail'
  | 'restaurant'
  | 'manufacturing'
  | 'ecommerce'
  | 'professional-services'
  | 'healthcare'
  | 'education'
  | 'real-estate'
  | 'logistics'
  | 'construction'
  | 'beauty'
  | 'automotive'
  | 'hospitality'
  | 'legal'
  | 'financial-services'
  | 'event-management'
  | 'wholesale'
  | 'agriculture';

export interface PayAidPayment {
  id: string;
  orderId: string;
  amount: number; // in INR
  currency: 'INR';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## STRATEGIC ENHANCEMENTS FOR SUPER SAAS

### Enhancement 1: AI-Powered Automation Engine
```typescript
// lib/ai-automation/index.ts
/**
 * Multi-agent AI system for automating business processes
 * Uses OpenAI API + Ollama for cost-effective local processing
 */

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'on_invoice_created' | 'on_payment_received' | 'on_contact_added';
  action: 'send_email' | 'create_task' | 'generate_report' | 'update_inventory';
  aiAssistant: 'email-writer' | 'task-generator' | 'analyst' | 'inventory-optimizer';
  template?: string;
  enabled: boolean;
}

// Example: Auto-generate email when invoice created
export async function generateInvoiceEmail(
  invoice: Invoice,
  aiModel: 'gpt-4' | 'ollama' = 'ollama' // Prefer local Ollama for cost
): Promise<string> {
  const prompt = `
    Generate a professional invoice follow-up email in English (for Indian context).
    
    Invoice Details:
    - Client Name: ${invoice.clientName}
    - Amount: ₹${formatCurrency(invoice.amount)}
    - Due Date: ${invoice.dueDate}
    - Invoice Number: ${invoice.invoiceNumber}
    
    Requirements:
    - Professional tone (India-specific business language)
    - Mention payment methods accepted (PayAid Payments only)
    - Include company branding hints if available
    - Keep length to 3-4 paragraphs
    - Add CTA button hint: "Pay Now via PayAid Payments"
  `;

  if (aiModel === 'ollama') {
    return await generateWithOllama(prompt);
  } else {
    return await generateWithOpenAI(prompt);
  }
}

// Example: Inventory optimization AI
export async function optimizeInventoryLevels(
  inventory: InventoryItem[],
  salesHistory: SalesData[]
): Promise<OptimizationRecommendation[]> {
  // Use AI to predict optimal stock levels based on demand patterns
  // Returns suggestions like: "Reorder Widget A: optimal stock 500 units"
}
```

**Benefits:**
- ✅ Reduce manual work by 70%
- ✅ Automated email generation, report generation, task creation
- ✅ Cost-effective: Ollama for standard tasks, OpenAI for complex tasks
- ✅ India-specific business language and compliance

### Enhancement 2: Real-Time Omnichannel Sync
```typescript
// lib/omnichannel/index.ts
/**
 * Unified customer view across all touchpoints
 * Online shop, offline POS, WhatsApp, email, etc.
 */

export interface UnifiedCustomerProfile {
  customerId: string;
  name: string;
  phone: string; // Primary identifier in India
  email?: string;
  whatsappNumber?: string;
  segments: string[];
  ltv: number; // Lifetime value in ₹
  lastInteraction: Date;
  channels: {
    pos: { lastPurchase?: Date; totalSpent: number };
    online: { lastPurchase?: Date; totalSpent: number };
    whatsapp: { lastMessage?: Date; subscribed: boolean };
    email: { lastOpen?: Date; subscribed: boolean };
  };
}

// Real-time sync when purchase occurs
export async function syncCustomerAcrossChannels(
  customerId: string,
  transactionData: Transaction
) {
  // Update CRM with new transaction
  // Trigger loyalty points
  // Send automated follow-up (email/WhatsApp)
  // Update inventory
  // Generate invoice
  // All in real-time using Supabase Realtime
}
```

**Benefits:**
- ✅ 360° customer view
- ✅ Consistent loyalty points across channels
- ✅ Intelligent follow-ups (best channel selection)
- ✅ Unified analytics (online + offline)

### Enhancement 3: Compliance & Tax Automation
```typescript
// lib/compliance/index.ts
/**
 * India-specific tax, compliance, and regulatory automation
 */

export interface TaxCompliance {
  gstRegistration: string; // GSTIN
  gstSlab: '0%' | '5%' | '12%' | '18%' | '28%';
  panNumber: string;
  invoiceFormat: 'GST Invoice' | 'Bill' | 'Receipt';
}

// Auto-calculate GST for every transaction
export function calculateGST(
  amount: number,
  gstSlab: number = 18 // Default 18%
): { baseAmount: number; gstAmount: number; totalAmount: number } {
  const gstAmount = amount * (gstSlab / 100);
  return {
    baseAmount: amount,
    gstAmount: Math.round(gstAmount * 100) / 100,
    totalAmount: amount + gstAmount,
  };
}

// Generate compliant GST invoice
export async function generateGSTInvoice(
  org: Organization,
  invoice: Invoice
): Promise<GSTInvoiceDocument> {
  // Generate invoice with all GST fields as per CBIC guidelines
  // Include QR code for e-invoice
  // Maintain audit trail for IT Act Section 44AB
}

// Auto-file GST returns (GSTR-1, GSTR-3B)
export async function generateGSTRFilings(
  org: Organization,
  month: number,
  year: number
): Promise<GSTRData> {
  // Aggregate all invoices for the month
  // Categorize as:
  //   - B2B supplies (GSTR-1)
  //   - B2C supplies
  //   - Exports
  //   - Input tax credit eligible
  // Return as JSON ready for upload to GSTN portal
}
```

**Benefits:**
- ✅ Zero GST compliance errors
- ✅ Auto-calculation for every transaction
- ✅ Ready-to-file GST returns (GSTR-1, GSTR-3B)
- ✅ IT Act compliance (records preservation)

### Enhancement 4: Intelligent Analytics Dashboard
```typescript
// modules/base/analytics/components/SmartDashboard.tsx
/**
 * Context-aware dashboard that changes based on:
 * - Industry vertical
 * - Business stage (startup vs. scale-up)
 * - Real-time data
 * - AI-powered predictions
 */

export interface DashboardMetrics {
  // Universal metrics
  revenue: number; // ₹ this month
  revenueGrowth: number; // % vs. last month
  activeCustomers: number;
  
  // Industry-specific metrics
  // For Retail: inventory turnover, avg transaction value
  // For Restaurant: food cost %, table turnover, avg check
  // For Service: utilization %, project profitability, team bandwidth
  
  // AI-powered insights
  insights: [
    { title: 'Revenue Opportunity', description: 'Top 10% customers account for 60% revenue', actionUrl: '/crm/segments/top-customers' },
    { title: 'Inventory Risk', description: 'Widget A stock will run out in 5 days based on current sales', actionUrl: '/inventory/reorder' },
  ];
  
  // Predictions
  forecasts: {
    nextMonthRevenue: number;
    churnRisk: number; // % of customers at risk
    bestProductToPromote: string;
  };
}
```

**Benefits:**
- ✅ Actionable insights specific to each industry
- ✅ AI-powered predictions reduce guesswork
- ✅ One-click actions (no dashboard prison)

### Enhancement 5: Integrated Payroll & HR Compliance
```typescript
// modules/base/hr/payroll/index.ts
/**
 * Automated payroll with India-specific taxes and compliance
 */

export interface PayrollEntry {
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  deductions: {
    incomeTax: number; // Auto-calculated using New/Old Tax Regime
    pf: number; // Employee PF: 12%
    esi: number; // ESI if applicable
    professionalTax: number; // State-specific
    otherDeductions: number;
  };
  allowances: {
    hra: number;
    conveyance: number;
    medicalAllowance: number;
    other: number;
  };
  netSalary: number; // Automatically calculated
  paymentVia: 'bank_transfer' | 'payaid_payments';
}

// Auto-calculate payroll with all India-specific taxes
export function calculatePayroll(entry: PayrollEntry): PayrollCalculation {
  // Calculate income tax (offer both Old & New Tax Regime options)
  // Calculate PF (12% employee, 12.67% employer)
  // Calculate ESI (if applicable based on wages)
  // Calculate professional tax (state-specific)
  // Generate Form 16 automatically
}

// File compliance documents
export async function generateCompliances(
  org: Organization,
  month: number,
  year: number
) {
  // Generate Form 16 (income tax)
  // Generate Form 12BB (tax exemption declaration)
  // Generate ESI return (MIS)
  // Generate PF statement
}
```

**Benefits:**
- ✅ Zero payroll errors
- ✅ Auto-compliance with all tax regimes
- ✅ One-click compliance filing

### Enhancement 6: Multi-Tenant Marketplace (Future Revenue Stream)
```typescript
// lib/marketplace/index.ts
/**
 * Allow third-party developers to build on PayAid V3
 * Monetize through app commission
 */

export interface MarketplaceApp {
  id: string;
  name: string;
  developer: string;
  description: string;
  icon: string;
  price: number; // ₹ per month or one-time
  priceType: 'monthly_subscription' | 'one_time' | 'free';
  permissions: ['read_crm', 'write_inventory', 'read_analytics'];
  webhookUrl: string;
  documentation: string;
}

// Example: Third-party WhatsApp integration app
// - Installed in PayAid V3 by small business
// - Sends CRM data to WhatsApp automation
// - PayAid takes 30% commission on app revenue
```

**Benefits:**
- ✅ Expand ecosystem without building everything
- ✅ Revenue: 30% commission on 3rd-party apps
- ✅ Network effects: More integrations = stickier platform

### Enhancement 7: Smart Notification Engine
```typescript
// lib/notifications/index.ts
/**
 * Intelligent notifications - right message, right channel, right time
 */

export interface NotificationStrategy {
  event: 'payment_pending' | 'inventory_low' | 'customer_inactive' | 'invoice_unpaid';
  channels: ['email', 'whatsapp', 'sms', 'in_app_notification'];
  timing: 'immediate' | 'daily_digest' | 'weekly_summary';
  messageTemplate: string;
  aiOptimization: boolean; // Use AI to personalize based on customer history
}

// Example: Payment pending notification
const paymentPendingStrategy = {
  event: 'payment_pending',
  channels: ['whatsapp', 'email'], // WhatsApp has higher open rate in India
  timing: 'immediate', // Send immediately
  messageTemplate: `Hi {{customer_name}}, your invoice #{{invoice_id}} for ₹{{amount}} is due on {{due_date}}. Pay now: {{payment_link}}`,
  aiOptimization: true, // Personalize based on customer response patterns
};
```

**Benefits:**
- ✅ Optimal channel selection (WhatsApp for India market)
- ✅ Reduce notification fatigue
- ✅ Higher engagement rates

### Enhancement 8: WhatsApp Business Integration (Critical for India)
```typescript
// lib/whatsapp/index.ts
/**
 * Native WhatsApp Business integration for India SMB market
 * Replaces email as primary communication channel
 */

import { WAHA } from 'waha'; // Open-source WhatsApp API

export interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (+91xxxxxxxxxx)
  type: 'text' | 'template' | 'media';
  content: string;
  mediaUrl?: string;
  templateName?: string; // Pre-approved templates: invoice, appointment, shipping
}

// Send invoice via WhatsApp (higher engagement than email in India)
export async function sendInvoiceViaWhatsApp(
  invoice: Invoice,
  customerPhoneNumber: string
): Promise<WhatsAppMessage> {
  const whatsappMessage = {
    to: customerPhoneNumber,
    type: 'template',
    templateName: 'invoice_ready',
    content: `Hi ${invoice.clientName}, your invoice #${invoice.invoiceNumber} for ₹${formatCurrency(invoice.amount)} is ready. View/Pay: ${generatePaymentLink(invoice.id)}`,
  };

  return await sendWhatsAppMessage(whatsappMessage);
}

// Receive WhatsApp messages (for customer support)
export async function handleWhatsAppIncomingMessage(message: WhatsAppMessage) {
  // Message from customer via WhatsApp
  // Route to CRM communication timeline
  // Trigger support ticket if needed
  // Enable WhatsApp support chatbot (Ollama-based)
}
```

**Benefits:**
- ✅ WhatsApp has 90%+ penetration in India vs. email ~30%
- ✅ Higher engagement rates (invoice payment reminders)
- ✅ Native support/customer service on WhatsApp
- ✅ Competitive advantage: Competitors still use email

### Enhancement 9: Real-Time Multi-User Collaboration
```typescript
// lib/collaboration/index.ts
/**
 * Real-time multiplayer editing + presence
 * Similar to Google Docs but for business documents
 */

export interface CollaborativeDocument {
  id: string;
  type: 'invoice' | 'proposal' | 'purchase_order' | 'quote';
  content: JSONContent; // Use Yjs for CRDT-based conflict resolution
  collaborators: User[];
  activeEditors: User[]; // Currently editing
  lastModified: Date;
}

// Enable team members to edit invoice together in real-time
export async function enableRealtimeEditing(
  documentId: string,
  userId: string
): Promise<CollaborativeSession> {
  // Use Supabase Realtime + Yjs for conflict-free collaboration
  // Show presence cursors
  // Sync changes across all connected clients
}
```

**Benefits:**
- ✅ Faster team collaboration
- ✅ No version confusion (single source of truth)
- ✅ Audit trail of who changed what

### Enhancement 10: Predictive Analytics Engine
```typescript
// lib/ml/predictions.ts
/**
 * Machine learning models for business predictions
 * - Churn prediction: Which customers will leave?
 * - Revenue forecast: How much revenue next quarter?
 * - Demand forecast: How much inventory to stock?
 */

export async function predictCustomerChurn(
  customerId: string,
  lookbackDays: number = 90
): Promise<{ churnRisk: number; riskFactors: string[] }> {
  // Analyze: purchase frequency, order value, support tickets, cart abandonment
  // Return: % likelihood to churn + actionable reasons
  // Trigger: Retention campaign (discount, exclusive offer)
}

export async function forecastNextQuarterRevenue(
  org: Organization,
  seasons: string[] = ['holiday', 'summer', 'monsoon']
): Promise<{ forecast: number; confidence: number; factors: string[] }> {
  // Consider: historical trends, seasonality, growth rate, customer cohort behavior
  // Suggest: pricing adjustments, promotional timing
}

export async function optimizeInventoryStocking(
  product: Product,
  demandHistory: DemandData[]
): Promise<{ optimalStock: number; reorderPoint: number; safetyStock: number }> {
  // Use demand forecasting to suggest optimal inventory levels
  // Reduce overstock costs + prevent stockouts
}
```

**Benefits:**
- ✅ Data-driven decisions
- ✅ Prevent revenue surprises
- ✅ Optimize working capital (inventory)

---

## STRICT CODING STANDARDS

### Commit Message Convention
```
feat(CRM): Add contact segmentation by industry
fix(Finance): GST calculation rounding error
docs(Payroll): Add Form 16 generation guide
refactor(API): Standardize error handling across routes
test(Analytics): Add revenue forecast tests
chore(deps): Update Next.js to 14.2
```

### Code Review Checklist
- [ ] All types are properly defined (no `any`)
- [ ] All API routes have error handling + logging
- [ ] All database queries have proper indexing
- [ ] No hardcoded configuration (use env vars)
- [ ] No competitor mentions in code or comments
- [ ] All currency is in ₹ (INR)
- [ ] All payment processing via PayAid Payments only
- [ ] TypeScript build succeeds without warnings
- [ ] Vercel deployment would succeed

### Testing Requirements
```bash
# Before every PR:
npm run type-check  # TypeScript strict check
npm run lint        # ESLint + Prettier
npm run test        # Jest unit tests
npm run build       # Production build (must succeed)
```

---

## DATABASE REQUIREMENTS

### Supabase Setup (MANDATORY)
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgtrgm";

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's data
CREATE POLICY "org_isolation"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_organizations_industry_id ON organizations(industry_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
```

---

## DEPLOYMENT CHECKLIST

Before pushing to production (Vercel):

- [ ] All environment variables set in Vercel dashboard
- [ ] PayAid Payments API keys verified (test mode first)
- [ ] Database migrations run successfully
- [ ] All TypeScript types pass strict mode check
- [ ] Build succeeds: `npm run build`
- [ ] No console.error() or TODO comments in production code
- [ ] All API endpoints return proper error responses
- [ ] CORS headers configured correctly
- [ ] Rate limiting enabled on payment endpoints
- [ ] Monitoring + alerting configured (Vercel Logs)
- [ ] Backup strategy documented (Supabase backups)
- [ ] Privacy policy & Terms of Service updated for your legal jurisdiction
- [ ] GDPR/Data Protection compliance verified (India has BharatStack?)
- [ ] Security audit performed (no SQL injection, XSS, CSRF vulnerabilities)

---

## CURSOR-SPECIFIC INSTRUCTIONS

### When Using Cursor with This Prompt:

1. **First Message to Cursor:**
```
I'm building PayAid V3 - a comprehensive SaaS for Indian SMBs with 20 industry modules.

Please review this architecture document and confirm you understand:
1. NO competitor mentions anywhere
2. Currency is ₹ (INR) only
3. Payments ONLY via PayAid Payments API
4. TypeScript strict mode mandatory
5. Vercel deployment ready
6. All environment variables external (no hardcoding)

Before starting, ask me:
- PayAid Payments API keys (for testing)
- Supabase connection string
- Target deployment date
- Current development stage (architecture/scaffolding/MVP)
```

2. **For Each Feature Implementation:**
```
Before writing code, confirm:
- [ ] TypeScript types defined (strict mode)
- [ ] Error handling strategy (try-catch + logging)
- [ ] Database schema updated (if needed)
- [ ] No hardcoded values (use env vars)
- [ ] No competitor mentions
- [ ] Currency handling (₹ only)
- [ ] Payment flow (PayAid only if financial transaction)
- [ ] Vercel compatible (no Node-only packages)
```

3. **Code Review with Cursor:**
```
After Cursor generates code, ask:
"Audit this code against these standards:
1. TypeScript strict mode - any 'any' types?
2. Competitor mentions - any Salesforce, HubSpot, etc.?
3. Currency - any $ symbols or USD?
4. Payment flow - using PayAid Payments?
5. Environment variables - any hardcoded values?
6. Error handling - missing try-catch blocks?
7. Logging - proper log levels and context?
8. Vercel compatibility - any Node-specific APIs?
9. Database - any N+1 queries or missing indexes?
10. Authentication - proper RLS policies?"
```

---

## NEXT STEPS (FOR YOU, NOT CURSOR)

1. **Prepare PayAid Integration:**
   - Sign up at https://payaidpayments.com/api-developer-kits/
   - Generate API & Secret keys (test mode first)
   - Store in `.env.local`

2. **Set Up Supabase:**
   - Create free tier project at supabase.com
   - Run SQL migrations (provided above)
   - Get connection string

3. **Initialize Repository:**
   ```bash
   git clone <your-repo>
   cd payaid-v3
   npm install
   cp .env.example .env.local
   # Fill in PayAid keys, Supabase connection, etc.
   npm run dev
   ```

4. **Share This Prompt with Your Development Team:**
   - Add to team wiki/Notion
   - Reference in PRs: "Ensure compliance with PayAid V3 Implementation Prompt"
   - Use as onboarding document

5. **Verify Zero Deviations:**
   - Run linter check for competitor mentions
   - Audit all currency displays monthly
   - Verify PayAid payment flow in each new feature
   - Test Vercel deployments weekly

---

## SUCCESS CRITERIA

Your implementation is successful when:

✅ **Zero mentions of competitors** anywhere in codebase or UI  
✅ **100% transactions in ₹ (INR)** with no $ symbols  
✅ **All payments via PayAid Payments** API only  
✅ **Vercel build succeeds** without errors or warnings  
✅ **TypeScript strict mode** passes on all files  
✅ **All environment variables** externalized (no hardcoding)  
✅ **Multi-tenant architecture** with RLS policies  
✅ **All 20 industries** supported with industry-specific modules  
✅ **AI automation engine** functional (email generation, reports, etc.)  
✅ **WhatsApp integration** live for India market  
✅ **GST compliance** automated  
✅ **Real-time analytics** dashboard live  
✅ **Comprehensive testing** (API routes, components, integrations)  
✅ **Production monitoring** enabled (Vercel Logs, error tracking)  

