# PayAid V3 - Backend Architecture & Best Practices

**Version:** 3.0.0  
**Last Updated:** January 2026

---

## 1. API Design

### REST API Design Principles

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources (full replacement)
- `PATCH` - Update resources (partial)
- `DELETE` - Delete resources

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (authorization failed)
- `404` - Not Found
- `500` - Internal Server Error

**Example:**
```typescript
// app/api/contacts/route.ts
export async function GET(request: NextRequest) {
  const contacts = await prisma.contact.findMany({ where: { tenantId } })
  return NextResponse.json(contacts) // 200 OK
}

export async function POST(request: NextRequest) {
  const contact = await prisma.contact.create({ data })
  return NextResponse.json(contact, { status: 201 }) // 201 Created
}
```

### API Versioning Strategy

**Current:** No versioning (v1 implicit)

**Future:** URL path versioning
- `/api/v1/contacts`
- `/api/v2/contacts`

**Header Versioning (Alternative):**
- `Accept: application/vnd.payaid.v1+json`

### Request/Response Format

**Request Format:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

**Response Format:**
```json
{
  "id": "contact123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "createdAt": "2026-01-15T12:00:00Z"
}
```

**Error Response Format:**
```json
{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format"
  }
}
```

### Pagination

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit
  
  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { tenantId },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where: { tenantId } }),
  ])
  
  return NextResponse.json({
    data: contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Filtering, Sorting

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  const where = {
    tenantId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }
  
  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
  })
  
  return NextResponse.json(contacts)
}
```

### Authentication Header Format

**Bearer Token:**
```
Authorization: Bearer <jwt-token>
```

**API Key:**
```
X-API-Key: <api-key>
```

### CORS Configuration

**Next.js Config:**
```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.NEXT_PUBLIC_APP_URL,
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    },
  ]
}
```

### API Rate Limiting Configuration

**Tier-Based Limits:**
```typescript
// lib/rate-limit/tiers.ts
export const rateLimits = {
  free: { requests: 100, window: '1h' },
  starter: { requests: 1000, window: '1h' },
  professional: { requests: 10000, window: '1h' },
  enterprise: { requests: Infinity },
}
```

---

## 2. Service Layer Architecture

### Service Organization

**Domain-Driven Design:**
```
lib/services/
├── contacts/
│   ├── contact-service.ts
│   └── contact-validator.ts
├── invoices/
│   ├── invoice-service.ts
│   └── invoice-validator.ts
└── payments/
    ├── payment-service.ts
    └── payment-validator.ts
```

**Service Example:**
```typescript
// lib/services/contacts/contact-service.ts
export class ContactService {
  async createContact(data: CreateContactInput, tenantId: string) {
    // Validate input
    const validated = contactSchema.parse(data)
    
    // Business logic
    const contact = await prisma.contact.create({
      data: {
        ...validated,
        tenantId,
        leadScore: this.calculateLeadScore(validated),
      },
    })
    
    // Invalidate cache
    await multiLayerCache.delete(`contacts:${tenantId}`)
    
    // Emit event (future)
    // eventEmitter.emit('contact.created', contact)
    
    return contact
  }
  
  private calculateLeadScore(data: CreateContactInput): number {
    let score = 0
    if (data.email) score += 10
    if (data.phone) score += 10
    if (data.company) score += 20
    return score
  }
}
```

### Service Dependencies and Injection

**Dependency Injection (Future):**
```typescript
// Current: Direct instantiation
const contactService = new ContactService()

// Future: Dependency injection
class ContactService {
  constructor(
    private db: PrismaClient,
    private cache: MultiLayerCache,
    private eventEmitter: EventEmitter
  ) {}
}
```

### Transaction Handling

**ACID Compliance:**
```typescript
export async function createInvoiceWithItems(
  invoiceData: InvoiceData,
  items: InvoiceItemData[]
) {
  return prisma.$transaction(async (tx) => {
    // Create invoice
    const invoice = await tx.invoice.create({
      data: invoiceData,
    })
    
    // Create invoice items
    await tx.invoiceItem.createMany({
      data: items.map(item => ({
        ...item,
        invoiceId: invoice.id,
      })),
    })
    
    return invoice
  })
}
```

### Error Handling and Custom Error Codes

**Custom Error Classes:**
```typescript
// lib/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super('VALIDATION_ERROR', message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
  }
}
```

**Error Handling:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const contact = await prisma.contact.findUnique({ where: { id } })
    if (!contact) {
      throw new NotFoundError('Contact')
    }
    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    throw error
  }
}
```

---

## 3. Data Access Layer

### ORM: Prisma

**Prisma Client:**
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Query Optimization

**Avoid N+1 Queries:**
```typescript
// ❌ Bad: N+1 query
const contacts = await prisma.contact.findMany()
for (const contact of contacts) {
  const deals = await prisma.deal.findMany({ where: { contactId: contact.id } })
}

// ✅ Good: Single query with include
const contacts = await prisma.contact.findMany({
  include: {
    deals: true,
  },
})
```

**Select Only Needed Fields:**
```typescript
// ✅ Good: Select only needed fields
const contacts = await prisma.contact.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // Don't select unnecessary fields
  },
})
```

### Database Connection Management

**Connection Pooling:**
- Prisma connection pool (default: 100 connections)
- PgBouncer (future) for better pooling

**Connection String:**
```
postgresql://user:password@host:5432/database?connection_limit=100&pool_timeout=10
```

### Transaction Management

**Transaction Example:**
```typescript
export async function transferDeal(
  dealId: string,
  fromContactId: string,
  toContactId: string
) {
  return prisma.$transaction(async (tx) => {
    // Update deal
    const deal = await tx.deal.update({
      where: { id: dealId },
      data: { contactId: toContactId },
    })
    
    // Update contact stats
    await tx.contact.update({
      where: { id: fromContactId },
      data: { dealCount: { decrement: 1 } },
    })
    
    await tx.contact.update({
      where: { id: toContactId },
      data: { dealCount: { increment: 1 } },
    })
    
    return deal
  })
}
```

### Data Validation at Database Level

**Prisma Schema Constraints:**
```prisma
model Contact {
  id        String   @id @default(cuid())
  email     String?  @unique
  phone     String?
  tenantId  String
  
  @@index([tenantId])
  @@index([tenantId, email])
}
```

**Database-Level Validation:**
- Unique constraints
- Foreign key constraints
- Check constraints (future)

---

## 4. Caching Strategy

### Cache Invalidation Strategy

**Invalidation on Write:**
```typescript
export async function updateContact(id: string, data: UpdateContactInput) {
  const contact = await prisma.contact.update({
    where: { id },
    data,
  })
  
  // Invalidate cache
  await multiLayerCache.delete(`contacts:${contact.tenantId}`)
  await multiLayerCache.delete(`contact:${id}`)
  
  return contact
}
```

**Cache Warming:**
```typescript
// lib/cache/warmer.ts
export async function warmTenantCache(tenantId: string) {
  await Promise.all([
    warmDashboardStats(tenantId),
    warmRecentContacts(tenantId),
    warmActiveDeals(tenantId),
  ])
}
```

### Cache Key Naming Convention

**Format:** `module:tenantId:resourceId`

**Examples:**
- `contacts:tenant123` - All contacts for tenant
- `contact:tenant123:contact456` - Single contact
- `dashboard:stats:tenant123` - Dashboard stats
- `invoice:tenant123:invoice789` - Single invoice

### TTL (Time-To-Live)

**TTL Configuration:**
```typescript
// Short-lived (frequently updated)
await multiLayerCache.set(key, value, 300) // 5 minutes

// Medium-lived (moderately updated)
await multiLayerCache.set(key, value, 3600) // 1 hour

// Long-lived (rarely updated)
await multiLayerCache.set(key, value, 86400) // 24 hours
```

### Cache Hit/Miss Monitoring

**Metrics:**
```typescript
// lib/cache/metrics.ts
export async function trackCacheHit(key: string) {
  statsd.increment('cache.hit', 1, [`key:${key}`])
}

export async function trackCacheMiss(key: string) {
  statsd.increment('cache.miss', 1, [`key:${key}`])
}
```

---

## 5. Async Processing & Background Jobs

### Job Queue System Configuration

**Bull Queue:**
```typescript
// lib/queue/bull.ts
import Bull from 'bull'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export const emailQueue = new Bull('emails', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
  },
})

export const smsQueue = new Bull('sms', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
  },
})
```

### Job Retry Logic

**Retry Configuration:**
```typescript
emailQueue.process('send-email', async (job) => {
  try {
    await sendEmail(job.data)
  } catch (error) {
    // Retry with exponential backoff
    throw new Error('Failed to send email')
  }
})

emailQueue.on('failed', async (job, error) => {
  if (job.attemptsMade < 3) {
    // Retry with exponential backoff
    const delay = Math.pow(2, job.attemptsMade) * 1000
    await job.retry({ delay })
  } else {
    // Move to dead letter queue
    await deadLetterQueue.add(job.data)
  }
})
```

### Job Scheduling

**Cron Jobs:**
```typescript
// lib/jobs/scheduler.ts
import cron from 'node-cron'

// Daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await emailQueue.add('send-daily-reports', {})
})

// Every hour
cron.schedule('0 * * * *', async () => {
  await cacheQueue.add('warm-cache', {})
})
```

### Dead Letter Queue Handling

**Dead Letter Queue:**
```typescript
// lib/queue/dead-letter.ts
export const deadLetterQueue = new Bull('dead-letters', {
  redis: {
    host: redis.options.host,
    port: redis.options.port,
  },
})

deadLetterQueue.process(async (job) => {
  // Log failed job
  await prisma.failedJob.create({
    data: {
      queue: job.queue.name,
      data: job.data,
      error: job.failedReason,
    },
  })
  
  // Notify admin
  await sendAdminAlert({
    subject: 'Failed Job Alert',
    message: `Job ${job.id} failed: ${job.failedReason}`,
  })
})
```

### Job Monitoring

**Job Status:**
```typescript
// Get job status
const job = await emailQueue.getJob(jobId)
console.log(job.state) // 'completed', 'failed', 'active', etc.
```

**Queue Metrics:**
```typescript
// Get queue metrics
const counts = await emailQueue.getJobCounts()
console.log(counts) // { waiting: 10, active: 5, completed: 100, failed: 2 }
```

---

## 6. Security Best Practices

### Input Validation

**Zod Schemas:**
```typescript
const contactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[0-9]{10}$/).optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = contactSchema.parse(body) // Throws if invalid
  // ...
}
```

### SQL Injection Prevention

**Prisma ORM (Automatic):**
- Parameterized queries
- No raw SQL (unless necessary)
- Type-safe queries

**Never Do This:**
```typescript
// ❌ NEVER: SQL injection vulnerability
const query = `SELECT * FROM contacts WHERE name = '${userInput}'`
```

### CORS Security

**Configuration:**
```typescript
// Only allow specific origins
const allowedOrigins = [
  'https://app.payaid.in',
  'https://staging.payaid.in',
]

if (!allowedOrigins.includes(origin)) {
  return new Response('CORS not allowed', { status: 403 })
}
```

### HTTPS Enforcement

**Middleware:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.protocol === 'http:' && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(
      request.nextUrl.toString().replace('http:', 'https:')
    )
  }
}
```

### Security Headers

**Next.js Config:**
```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline';",
        },
      ],
    },
  ]
}
```

### CSRF Protection

**SameSite Cookies:**
```typescript
response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
})
```

### Rate Limiting Configuration

**Per-Endpoint Limits:**
```typescript
// lib/rate-limit/endpoints.ts
export const endpointLimits = {
  '/api/auth/login': { requests: 5, window: '15m' },
  '/api/contacts': { requests: 100, window: '1h' },
  '/api/invoices': { requests: 100, window: '1h' },
}
```

### DDoS Mitigation

**Strategies:**
- Rate limiting (per IP, per user)
- Cloudflare (future)
- Request throttling
- IP blacklisting (future)

---

## 7. Testing

### Unit Testing Framework

**Jest:**
```typescript
// __tests__/contact-service.test.ts
import { ContactService } from '@/lib/services/contacts/contact-service'

describe('ContactService', () => {
  it('should create contact', async () => {
    const service = new ContactService()
    const contact = await service.createContact({
      name: 'John Doe',
      email: 'john@example.com',
    }, 'tenant123')
    
    expect(contact.name).toBe('John Doe')
  })
})
```

### Integration Testing

**API Testing:**
```typescript
// __tests__/api/contacts.test.ts
import { createMocks } from 'node-mocks-http'

test('POST /api/contacts', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    body: { name: 'John Doe' },
  })
  
  await POST(req as any)
  
  expect(res._getStatusCode()).toBe(201)
  expect(JSON.parse(res._getData())).toHaveProperty('id')
})
```

### Test Data and Fixtures

**Fixtures:**
```typescript
// __tests__/fixtures/contacts.ts
export const contactFixtures = {
  valid: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
  },
  invalid: {
    name: '',
    email: 'invalid-email',
  },
}
```

### Test Database Setup

**Test Database:**
```typescript
// __tests__/setup.ts
beforeAll(async () => {
  await prisma.$connect()
  await prisma.$executeRaw`TRUNCATE TABLE "Contact" CASCADE`
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

### API Contract Testing

**Contract Testing (Future):**
- Pact testing
- OpenAPI schema validation
- Response schema validation

---

## Summary

PayAid V3 backend follows REST API best practices with proper error handling, transaction management, caching, and security measures. The architecture is scalable and maintainable.

**Key Features:**
- ✅ REST API with proper HTTP methods and status codes
- ✅ Service layer architecture (domain-driven)
- ✅ Prisma ORM (type-safe, SQL injection prevention)
- ✅ Multi-layer caching (memory + Redis)
- ✅ Background job queue (Bull)
- ✅ Transaction management (ACID compliance)
- ✅ Input validation (Zod)
- ✅ Security best practices (CORS, HTTPS, rate limiting)
- ✅ Comprehensive error handling
- ✅ Test coverage (unit + integration)
