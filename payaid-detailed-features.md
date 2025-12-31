# PayAid V3: Detailed Feature Specifications & Integrations

**Document:** Feature Specifications & Technical Implementation  
**Date:** December 9, 2025

---

## FEATURE SPECIFICATIONS BY PRODUCT LAYER

### Layer 1: Setup & Onboarding (MVP: Days 1-7)

#### 1.1 Domain Registration
**Feature:** In-app domain purchase and registration

```typescript
// app/setup/domain/page.tsx
interface DomainRegistration {
  domainName: string;
  extension: '.in' | '.com' | '.store' | '.shop' | '.co';
  duration: 1 | 2 | 3 | 5 | 10; // years
  autoRenew: boolean;
}

API Integration:
├─ Namecheap API (bulk domain registration)
├─ AWS Route 53 (DNS management)
└─ Auto-redirect setup (domain → website)

Workflow:
1. User enters desired domain name
2. Check availability (Namecheap API)
3. Show 5 alternatives if taken
4. Purchase via PayAid Payments
5. Auto-setup DNS records
6. Verify ownership
```

**Pricing Strategy:**
- .in: ₹500/year (markup from ₹200)
- .com: ₹800/year (markup from ₹500)
- .store: ₹1,200/year
- **Profit margin:** 30% on domain sales

**Integrations:**
- Namecheap API (registration, pricing)
- PayAid Payments (integrated)
- AWS Route 53 (DNS)

---

#### 1.2 Website Builder (Drag-drop with 50+ Templates)

**Feature:** No-code website builder integrated into PayAid

```typescript
// lib/website-builder/templates.ts
interface Template {
  id: string;
  name: string;
  category: 'ecommerce' | 'service' | 'portfolio' | 'lead-gen';
  sections: TemplateSection[];
  previewUrl: string;
  conversionRate: number; // Historical data
}

const templates = [
  {
    id: 'fashion-01',
    name: 'Fashion Store Pro',
    category: 'ecommerce',
    sections: [
      { name: 'hero', editable: true },
      { name: 'products-grid', editable: true },
      { name: 'testimonials', editable: true },
      { name: 'footer', editable: true },
    ],
  },
  // ... 50+ more templates
];

// Edit website in real-time
interface PageBuilder {
  dragDropElements: boolean; // Drag elements
  inlineEdit: boolean; // Edit text inline
  templateSwap: boolean; // Change templates anytime
  mobilePreview: boolean; // See mobile version
  seoEditor: boolean; // Edit SEO meta tags
}
```

**Key Features:**
- 50+ industry-specific templates
- Drag-drop builder (like Wix)
- Mobile-responsive (auto-responsive)
- SEO editor (meta tags, alt text)
- Built-in analytics (page views, bounce rate)
- Form builder (email capture)
- Payment integration (PayAid Payments embedded)

**Technology:**
- Frontend: React + TailwindCSS
- Builder: React-Grid-Layout or Grapesjs
- Rendering: Next.js SSR
- CDN: Cloudflare (fast delivery)

**Hosting:**
- Auto-deployed to Vercel (1-click)
- SSL certificate auto-renewed
- Bandwidth: Unlimited
- Uptime: 99.9%

---

#### 1.3 Logo Generator (AI-powered)

**Feature:** Generate logos using DALL-E or local image model

```typescript
// lib/ai-helpers/logo-generator.ts
interface LogoRequest {
  businessName: string;
  industry: string;
  style: 'modern' | 'traditional' | 'playful' | 'elegant';
  colors: string[]; // Hex codes
}

async function generateLogo(request: LogoRequest): Promise<string> {
  const prompt = buildPrompt(request);
  
  // Option 1: DALL-E (best quality)
  const logo = await openai.images.generate({
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
  });
  
  // Option 2: Local Stable Diffusion (cheaper)
  // const logo = await localSDService.generate(prompt);
  
  return logo.data[0].url;
}

// Generate 5 variations
async function generateLogoVariations(request: LogoRequest) {
  return Promise.all([
    generateLogo({ ...request, style: 'modern' }),
    generateLogo({ ...request, style: 'traditional' }),
    generateLogo({ ...request, style: 'playful' }),
    generateLogo({ ...request, style: 'minimal' }),
    generateLogo({ ...request, style: 'bold' }),
  ]);
}
```

**Cost Handling:**
- DALL-E: $0.08 per image (cost to us)
- Charge user: ₹200 per logo
- Free credits: 3 logos on free tier, then 50 credits/month

---

### Layer 2: Core CRM (MVP: Days 1-30)

#### 2.1 Contact Management

```typescript
// database schema (Prisma)
model Contact {
  id String @id @default(cuid())
  
  // Basic info
  name String
  email String @unique
  phone String?
  company String?
  
  // Segmentation
  type 'customer' | 'lead' | 'vendor' | 'employee'
  status 'active' | 'inactive' | 'lost'
  source 'website' | 'referral' | 'cold-call' | 'social'
  
  // Relationships
  customerId String
  customer Customer @relation(fields: [customerId], references: [id])
  
  // Timeline
  createdAt DateTime @default(now())
  lastContactedAt DateTime?
  nextFollowUp DateTime?
  
  // AI-generated insights
  likelyToBuy Boolean? // Predicted conversion
  churnRisk Boolean? // At-risk customer
  
  // Metadata
  tags String[] // Custom tags for filtering
  notes String? // Sales notes
  
  // Relations
  interactions Interaction[]
  tasks Task[]
  
  @@index([customerId])
  @@index([status])
  @@index([type])
}

model Interaction {
  id String @id @default(cuid())
  
  contactId String
  contact Contact @relation(fields: [contactId], references: [id])
  
  type 'email' | 'call' | 'meeting' | 'whatsapp' | 'sms'
  subject String
  notes String
  duration Int? // in minutes
  outcome 'positive' | 'neutral' | 'negative'
  
  createdAt DateTime @default(now())
}

// API for contact management
export async function getContactWithHistory(contactId: string) {
  return await db.contact.findUnique({
    where: { id: contactId },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      tasks: {
        where: { completed: false },
      },
    },
  });
}
```

**Features:**
- ✅ Import contacts from CSV
- ✅ LinkedIn sync (2-way sync)
- ✅ Gmail integration (auto-extract email content)
- ✅ Call recording (Twilio integration)
- ✅ Communication history (all touchpoints in one place)
- ✅ Duplicate detection (auto-merge)
- ✅ Bulk actions (update 100 contacts at once)

---

#### 2.2 Lead Pipeline & Sales Funnel

```typescript
model Deal {
  id String @id @default(cuid())
  
  name String
  value Float // Deal amount
  probability Float // 0-100 (estimated likelihood)
  stage 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  
  contactId String
  contact Contact @relation(fields: [contactId], references: [id])
  
  expectedCloseDate DateTime
  actualCloseDate DateTime?
  lostReason String? // Why deal was lost
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Dashboard showing funnel
interface SalesFunnel {
  lead: number; // Count of deals in 'lead' stage
  qualified: number;
  proposal: number;
  negotiation: number;
  won: number;
  lost: number;
  winRate: number; // won / (won + lost)
  avgDealValue: number;
  forecastedRevenue: number; // Sum of (value * probability)
}

export async function getSalesFunnel(customerId: string): Promise<SalesFunnel> {
  const deals = await db.deal.findMany({
    where: { contact: { customerId } },
  });
  
  return {
    lead: deals.filter(d => d.stage === 'lead').length,
    qualified: deals.filter(d => d.stage === 'qualified').length,
    // ...
    winRate: wonDeals / (wonDeals + lostDeals),
    forecastedRevenue: deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
  };
}
```

**Kanban Board:**
- Drag deals between stages
- Visual pipeline (see deals moving)
- Bottleneck detection (stuck deals)
- Probability indicator (0-100%)

---

#### 2.3 Task Automation & Follow-ups

```typescript
interface TaskAutomation {
  // Send email after deal won
  winEmailTemplate: string;
  delayMinutes: number;
  
  // Schedule follow-up after 3 days
  followUpAfterDays: number;
  
  // Send SMS if high-value contact
  highValueThreshold: number;
  sendSMS: boolean;
  
  // Tag contact if active
  markActiveIfInteractionInDays: number;
}

// Auto-create tasks
export async function createFollowUpTask(contactId: string) {
  const contact = await db.contact.findUnique({
    where: { id: contactId },
    include: { interactions: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
  
  if (!contact.lastContactedAt) {
    // First contact - schedule follow-up in 2 days
    await db.task.create({
      data: {
        contactId,
        title: `Follow up with ${contact.name}`,
        dueDate: addDays(new Date(), 2),
        priority: 'high',
        assignedTo: contact.customerId,
      },
    });
  }
}
```

---

### Layer 3: E-commerce & Orders (Phase 2: Days 15-60)

#### 3.1 Product Catalog Management

```typescript
model Product {
  id String @id @default(cuid())
  
  // Basic info
  name String
  description String
  sku String @unique
  barcode String?
  
  // Pricing
  costPrice Float
  salePrice Float
  discountPrice Float?
  discountType 'fixed' | 'percentage'
  
  // Images
  images Image[]
  
  // Categories
  categories String[] // Multiple categories
  
  // Inventory
  quantity Int
  reorderLevel Int // Alert when stock drops below
  
  // Variants (sizes, colors)
  variants ProductVariant[]
  
  // Marketing
  seoTitle String?
  seoDescription String?
  seoKeywords String[]
  
  // Analytics
  totalSold Int @default(0)
  totalRevenue Float @default(0)
  lastSoldAt DateTime?
  
  customerId String
  customer Customer @relation(fields: [customerId], references: [id])
  
  createdAt DateTime @default(now())
}

model ProductVariant {
  id String @id @default(cuid())
  productId String
  product Product @relation(fields: [productId], references: [id])
  
  name String // e.g., 'Size', 'Color'
  value String // e.g., 'Small', 'Red'
  salePrice Float?
  quantity Int
  barcode String?
}
```

**Features:**
- ✅ Bulk product upload (CSV)
- ✅ Product variants (size, color, etc.)
- ✅ AI-generated descriptions (use Creative Agent)
- ✅ Image optimization (auto-crop, background removal)
- ✅ Stock tracking (with alerts)
- ✅ Pricing rules (seasonal, quantity discounts)
- ✅ Product reviews (customer feedback)

---

#### 3.2 Shopping Cart & Checkout

```typescript
model Order {
  id String @id @default(cuid())
  
  // Order info
  orderNumber String @unique // Display number
  status 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  
  // Customer
  customerId String
  customer Customer @relation(fields: [customerId], references: [id])
  
  // Items
  items OrderItem[]
  
  // Pricing
  subtotal Float
  tax Float // GST calculation
  shipping Float
  total Float
  
  // Discounts
  discountCode String?
  discountAmount Float?
  
  // Shipping
  shippingAddress String
  shippingCity String
  shippingPostal String
  shippingCountry String
  
  // Fulfillment
  shiprocketOrderId String? // Link to Shiprocket
  trackingUrl String?
  
  // Dates
  createdAt DateTime @default(now())
  paidAt DateTime?
  shippedAt DateTime?
  deliveredAt DateTime?
  
  @@index([customerId])
  @@index([status])
}

model OrderItem {
  id String @id @default(cuid())
  orderId String
  order Order @relation(fields: [orderId], references: [id])
  
  productId String
  productName String
  quantity Int
  price Float // Price at time of purchase
  total Float // quantity * price
}

// Checkout flow
export async function createOrder(
  customerId: string,
  cartItems: CartItem[],
  shippingAddress: Address,
  paymentMethod: 'payaid' | 'cod' // COD = Cash on Delivery, payaid = PayAid Payments
) {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // 18% GST for most products
  const shipping = calculateShipping(shippingAddress);
  const total = subtotal + tax + shipping;
  
  // Create order
  const order = await db.order.create({
    data: {
      customerId,
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending',
      shippingAddress: shippingAddress.address,
      shippingCity: shippingAddress.city,
      items: {
        createMany: {
          data: cartItems.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
    },
  });
  
  // If PayAid Payments: Create payment link
  if (paymentMethod === 'payaid') {
    const paymentLink = await payaid.getPaymentRequestUrl({
      amount: total * 100, // In paise
      currency: 'INR',
      reference_id: order.id,
      customer_notify: 1,
      notify: {
        sms: true,
        email: true,
      },
      description: `Order #${order.orderNumber}`,
      callback_url: 'https://payaid.com/orders/callback',
    });
    
    order.paymentLinkId = paymentLink.id;
    order.paymentLinkUrl = paymentLink.short_url;
    await db.order.update({
      where: { id: order.id },
      data: { paymentLinkId: paymentLink.id },
    });
  }
  
  // If COD: Auto-create Shiprocket label
  if (paymentMethod === 'cod') {
    const shiprocketOrder = await shiprocket.orders.create({
      order_id: order.id,
      order_date: new Date().toISOString(),
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: shippingAddress,
      items: cartItems,
      payment_method: 'COD',
    });
    
    order.shiprocketOrderId = shiprocketOrder.shiprocket_id;
    await db.order.update({
      where: { id: order.id },
      data: { shiprocketOrderId: shiprocketOrder.shiprocket_id },
    });
  }
  
  return order;
}
```

---

### Layer 4: Accounting & GST Compliance (Phase 3: Days 90-120)

#### 4.1 Auto GST Calculation

```typescript
// lib/accounting/gst.ts

interface GSTRate {
  category: string;
  rate: number; // 0%, 5%, 12%, 18%, 28%
}

const gstRates: Record<string, GSTRate> = {
  'essential-items': { rate: 0 }, // Food, medicine
  'fast-moving': { rate: 5 }, // Clothes, books
  'standard': { rate: 18 }, // Most items
  'luxury': { rate: 28 }, // Luxury goods
};

export function calculateGST(productCategory: string, amount: number): number {
  const rate = gstRates[productCategory]?.rate || 18;
  return (amount * rate) / 100;
}

// GSTR-1 Filing (Sales register)
export async function generateGSTR1(businessId: string, month: number, year: number) {
  const orders = await db.order.findMany({
    where: {
      customerId: businessId,
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0),
      },
      status: 'delivered', // Only delivered orders
    },
    include: { items: true },
  });
  
  // Group by GSTIN (for B2B) or state (for B2C)
  const groupedByGSTIN = groupBy(orders, 'customerGSTIN');
  
  const gstr1 = {
    filing_period: `${month}/${year}`,
    b2b: Object.entries(groupedByGSTIN).map(([gstin, orders]) => ({
      gstin,
      invoices: orders.map(order => ({
        invoice_number: order.orderNumber,
        date: order.createdAt,
        amount: order.total,
        gst: order.tax,
      })),
      total_amount: orders.reduce((sum, o) => sum + o.total, 0),
      total_gst: orders.reduce((sum, o) => sum + o.tax, 0),
    })),
    b2c: {
      total_amount: orders.reduce((sum, o) => sum + o.total, 0),
      total_gst: orders.reduce((sum, o) => sum + o.tax, 0),
    },
  };
  
  return gstr1;
}

// Auto-file GSTR-1
export async function autoFileGSTR1(businessId: string, month: number, year: number) {
  const gstr1Data = await generateGSTR1(businessId, month, year);
  
  // Option 1: File via GSTN API
  // const filing = await gstnAPI.fileGSTR1(gstr1Data);
  
  // Option 2: Generate PDF for manual filing
  const pdf = generateGSTR1PDF(gstr1Data);
  
  // Option 3: Auto-file via third-party (Cleartax, ClearTax, etc.)
  const filing = await cleartaxAPI.fileGSTR1({
    businessGSTIN: business.gstin,
    data: gstr1Data,
    autoFile: true,
  });
  
  return filing;
}
```

**GST Compliance Features:**
- ✅ Auto-calculate GST on each invoice
- ✅ Generate GSTR-1 (sales register)
- ✅ Generate GSTR-2B (purchases register)
- ✅ Generate GSTR-3B (summary return)
- ✅ Auto-file with government (if connected to GSTN)
- ✅ Compliance alerts (filing deadlines)
- ✅ Reverse charge mechanism (B2B)
- ✅ ITC (Input Tax Credit) calculation

---

#### 4.2 Bank Reconciliation

```typescript
// lib/accounting/bank-reconciliation.ts

interface BankStatement {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface BankReconciliation {
  statementBalance: number;
  ledgerBalance: number;
  difference: number;
  uncleared: Transaction[]; // Transactions not yet cleared
  discrepancies: Discrepancy[]; // Differences to investigate
}

export async function autoReconcileBank(
  businessId: string,
  bankAccountId: string,
  statementPeriod: { from: Date; to: Date }
) {
  // 1. Get bank statement (from bank API)
  const bankStatement = await fetchBankStatement(bankAccountId, statementPeriod);
  
  // 2. Get our ledger transactions
  const ledgerTransactions = await db.transaction.findMany({
    where: {
      customerId: businessId,
      date: {
        gte: statementPeriod.from,
        lte: statementPeriod.to,
      },
    },
  });
  
  // 3. Match transactions (auto-match by amount, date, reference)
  const matched = [];
  const unmatched = [];
  
  for (const stmt of bankStatement) {
    const match = ledgerTransactions.find(
      t => t.amount === stmt.credit || t.amount === stmt.debit
    );
    
    if (match) {
      matched.push({ stmt, transaction: match });
    } else {
      unmatched.push(stmt);
    }
  }
  
  // 4. Flag discrepancies
  const discrepancies = unmatched.map(stmt => ({
    date: stmt.date,
    description: stmt.description,
    amount: stmt.credit || stmt.debit,
    type: stmt.credit ? 'deposit' : 'withdrawal',
  }));
  
  return {
    statementBalance: bankStatement[bankStatement.length - 1].balance,
    ledgerBalance: calculateLedgerBalance(ledgerTransactions),
    difference: bankStatement[bankStatement.length - 1].balance - calculateLedgerBalance(ledgerTransactions),
    uncleared: unmatched,
    discrepancies,
  };
}
```

**Bank Integration APIs:**
- ✅ ICICI Bank Open Banking API
- ✅ YES Bank Open Banking API
- ✅ RazorpayX (bank reconciliation)
- ✅ Plaid (international banks)

---

### Layer 5: Marketing Automation (Phase 2: Days 120-180)

#### 5.1 Email Marketing (Mailchimp-style)

```typescript
// lib/marketing/email-marketing.ts

model EmailCampaign {
  id String @id @default(cuid())
  
  name String
  subject String
  fromName String
  fromEmail String
  
  // Content
  templateId String? // Use built-in template
  htmlContent String? // Custom HTML
  
  // Recipients
  segmentId String? // Send to specific segment
  recipientCount Int
  
  // Scheduling
  status 'draft' | 'scheduled' | 'sent' | 'paused'
  scheduledFor DateTime?
  sentAt DateTime?
  
  // Analytics
  delivered Int @default(0)
  opened Int @default(0)
  clicked Int @default(0)
  unsubscribed Int @default(0)
  
  // Metrics
  openRate Float? // (opened / delivered) * 100
  clickRate Float? // (clicked / delivered) * 100
  
  customerId String
}

// Email templates (20+ built-in)
const emailTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to [BusinessName]!',
    content: `
      <h1>Welcome!</h1>
      <p>Thank you for signing up...</p>
      [UNSUBSCRIBE_LINK]
    `,
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    subject: 'You left something behind!',
    content: `
      <h1>Complete Your Purchase</h1>
      <p>You have items in your cart...</p>
      [ABANDONED_ITEMS]
      [CHECKOUT_LINK]
    `,
  },
  // ... 18+ more templates
];

// Send campaign
export async function sendEmailCampaign(campaignId: string) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
    include: { segment: { include: { contacts: true } } },
  });
  
  const contacts = campaign.segment?.contacts || [];
  
  // Send via SendGrid
  const batch = await sendgrid.mail.send({
    to: contacts.map(c => ({ email: c.email, name: c.name })),
    from: campaign.fromEmail,
    subject: campaign.subject,
    html: campaign.htmlContent,
    templateId: campaign.templateId,
    tracking: {
      opens: true,
      clicks: true,
    },
  });
  
  // Track delivery
  campaign.status = 'sent';
  campaign.sentAt = new Date();
  await db.emailCampaign.update({
    where: { id: campaignId },
    data: campaign,
  });
  
  // Listen for open/click events
  setupWebhooks(campaign);
}

// Automation workflow
const automationFlows = [
  {
    name: 'Welcome Series',
    trigger: 'new-subscriber',
    emails: [
      { delay: 0, template: 'welcome' },
      { delay: 3, template: 'first-discount' },
      { delay: 7, template: 'top-products' },
    ],
  },
  {
    name: 'Abandoned Cart Recovery',
    trigger: 'cart-abandoned',
    emails: [
      { delay: 1, template: 'abandoned-cart-1' },
      { delay: 3, template: 'abandoned-cart-2' },
      { delay: 7, template: 'abandoned-cart-final' },
    ],
  },
];
```

---

#### 5.2 WhatsApp Marketing (WATI-style)

```typescript
// lib/marketing/whatsapp.ts

model WhatsAppTemplate {
  id String @id @default(cuid())
  
  name String
  category 'marketing' | 'transactional' | 'utility'
  
  // Message content
  content String // Message text
  variables String[] // [name], [discount], etc.
  mediaUrl String? // Image/video URL
  
  // Meta approval status
  status 'draft' | 'pending-approval' | 'approved' | 'rejected'
  approvalReason String? // Reason if rejected
  
  customerId String
  createdAt DateTime @default(now())
}

model WhatsAppBroadcast {
  id String @id @default(cuid())
  
  name String
  templateId String
  template WhatsAppTemplate @relation(fields: [templateId], references: [id])
  
  // Recipients
  segmentId String? // Send to specific customer segment
  recipientCount Int
  
  // Variables (personalization)
  variables Record<string, string[]> // One array per recipient
  
  // Scheduling
  status 'draft' | 'scheduled' | 'sent'
  scheduledFor DateTime?
  sentAt DateTime?
  
  // Analytics
  sent Int @default(0)
  delivered Int @default(0)
  clicked Int @default(0)
  
  customerId String
  createdAt DateTime @default(now())
}

// Templates
const whatsappTemplates = [
  {
    name: 'Order Confirmation',
    content: 'Hi [name], your order #[order_id] has been confirmed. Total: ₹[amount]',
    variables: ['name', 'order_id', 'amount'],
    category: 'transactional',
  },
  {
    name: 'Promotional Offer',
    content: 'Hi [name], get [discount]% off on [category]. Offer ends [date]. Shop now: [link]',
    variables: ['name', 'discount', 'category', 'date', 'link'],
    category: 'marketing',
  },
  // ... More templates
];

// Send broadcast
export async function sendWhatsAppBroadcast(broadcastId: string) {
  const broadcast = await db.whatsAppBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      template: true,
      segment: { include: { contacts: true } },
    },
  });
  
  const contacts = broadcast.segment?.contacts || [];
  
  // Send via WATI API
  for (const contact of contacts) {
    const personalizedContent = replaceVariables(
      broadcast.template.content,
      broadcast.variables[contact.id]
    );
    
    await wati.messages.send({
      to: contact.phone,
      type: 'template',
      template: {
        name: broadcast.template.name,
        language: { code: 'en' },
        bodyParameters: broadcast.variables[contact.id],
        mediaUrl: broadcast.template.mediaUrl,
      },
    });
  }
  
  // Track delivery
  setupWhatsAppWebhooks(broadcast);
}
```

**WATI Integration Details:**
- ✅ Template creation (WhatsApp Business Account)
- ✅ Template approval (Meta automated system)
- ✅ Broadcast messaging (bulk SMS-style)
- ✅ Message templates (pre-approved)
- ✅ Click tracking (track which users click links)
- ✅ Read receipts (know when customer reads)
- ✅ Auto-replies (rule-based responses)

---

#### 5.3 Content Creation (AI-powered)

```typescript
// lib/marketing/content-generator.ts

export async function generateMarketingCopy(
  productName: string,
  productDescription: string,
  tone: 'formal' | 'casual' | 'witty'
): Promise<{
  emailSubject: string;
  emailBody: string;
  socialPost: string;
  adCopy: string;
}> {
  const prompt = `
    Product: ${productName}
    Description: ${productDescription}
    Tone: ${tone}
    
    Generate marketing content:
    1. Email subject line (max 50 chars)
    2. Email body (150-200 words)
    3. Social media post (100 chars)
    4. Ad copy for Google Ads (max 130 chars)
    
    Make it ${tone} and conversion-focused.
  `;
  
  const response = await creativeAgent.generate(prompt);
  
  return {
    emailSubject: response.emailSubject,
    emailBody: response.emailBody,
    socialPost: response.socialPost,
    adCopy: response.adCopy,
  };
}

// Generate product image variations
export async function generateProductImages(
  productId: string,
  imageCount: number = 3
): Promise<string[]> {
  const product = await db.product.findUnique({
    where: { id: productId },
  });
  
  const prompt = `Generate 3 professional product photos for: ${product.name}
    Description: ${product.description}
    Style: e-commerce, lifestyle
    Resolution: 1200x1200px`;
  
  const images = await Promise.all(
    Array(imageCount).fill(0).map(() => 
      openai.images.generate({ prompt, n: 1, size: '1024x1024' })
    )
  );
  
  return images.map(img => img.data[0].url);
}
```

---

## INTEGRATIONS SPECIFICATION

### Payment Integrations

**Razorpay:**
```typescript
// lib/payments/razorpay.ts
interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

// Accept payments
async function createPaymentLink(order: Order) {
  const link = await razorpay.paymentLink.create({
    amount: order.total * 100,
    currency: 'INR',
    customer: { name: order.customer.name, email: order.customer.email },
    notify: { sms: true, email: true },
  });
  return link.short_url;
}

// Handle webhook
export async function handlePaymentWebhook(payload: any) {
  const payment = payload.payment;
  const order = await db.order.findUnique({
    where: { payaidPaymentId: payment.id },
  });
  
  if (payment.status === 'captured') {
    order.status = 'confirmed';
    order.paidAt = new Date();
    // Create Shiprocket order for fulfillment
  }
}
```

**Stripe (for international):**
```typescript
// lib/payments/stripe.ts
async function createCheckoutSession(order: Order) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: order.items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: { name: item.productName },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${BASE_URL}/orders/${order.id}?status=success`,
    cancel_url: `${BASE_URL}/orders/${order.id}?status=cancel`,
  });
  
  return session.url;
}
```

---

### Logistics Integrations

**Shiprocket:**
```typescript
// lib/fulfillment/shiprocket.ts

async function createShipment(order: Order) {
  const shipment = await shiprocket.orders.create({
    order_id: order.id,
    order_date: order.createdAt,
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    pickup_location_id: 123, // Your warehouse
    delivery_type: 'home_delivery',
    shipping_address: order.shippingAddress,
    items: order.items.map(item => ({
      name: item.productName,
      sku: item.product.sku,
      units: item.quantity,
      hsn_code: item.product.hsnCode,
    })),
  });
  
  // Auto-generate label
  const label = await shiprocket.orders.generateLabel(shipment.id);
  return label.labelUrl; // Print this label
}
```

**Delhivery & BlueDart:** Similar integration pattern

---

### Marketing Integrations

**Mailchimp:**
```typescript
// lib/marketing/mailchimp.ts
async function syncContactsToMailchimp(segment: Segment) {
  const list = await mailchimp.lists.create({
    name: segment.name,
    contact: { company: 'PayAid' },
  });
  
  await mailchimp.lists.batchAddMembers(list.id, {
    members: segment.contacts.map(c => ({
      email_address: c.email,
      merge_fields: { FNAME: c.name },
    })),
  });
}
```

**Google Ads Integration:**
```typescript
// lib/marketing/google-ads.ts
async function createGoogleAdsCampaign(campaign: EmailCampaign) {
  const gadsClient = new google.ads.GoogleAdsClient();
  
  const adCampaign = {
    name: campaign.name,
    budgetAmount: campaign.dailyBudget * 100000000, // In micros
    biddingStrategy: {
      enhancedCpc: {},
    },
    channels: [google.ads.GoogleAdsClient.enums.AdvertisingChannelType.SEARCH],
  };
  
  // Create campaign and ads automatically
}
```

---

## SUMMARY: What Makes This Different

**Old Way (15-20 tools):**
- CRM: Salesforce (₹5,000/month)
- Email: Mailchimp (₹500/month)
- SMS: Twilio (₹1,000/month)
- Accounting: Tally (₹500/month)
- Invoicing: Zoho Invoice (₹500/month)
- WhatsApp: WATI (₹2,500/month)
- Website: Wix/Shopify (₹3,000/month)
- HR: ADP/Workday (₹2,000/month)
- Inventory: Fishbowl (₹1,500/month)
- **Total: ₹16,500+/month = ₹2L+/year**

**PayAid Way (1 platform):**
- Everything included
- **Cost: ₹999-4,999/month = ₹12K-60K/year**
- **Savings: 50-80% vs competitors**

---

**This is the future of business software for Indian SMBs.**

