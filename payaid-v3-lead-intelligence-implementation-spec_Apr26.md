# PayAid V3 Lead Intelligence Module — Cursor-Ready Implementation Spec

## Overview

This document defines a production-ready implementation spec for a new Lead Intelligence module in PayAid V3. The module is designed for the current PayAid V3 stack: Next.js 16, React 19, TypeScript, PostgreSQL via Prisma, monorepo app modules, and shared packages.[cite:106][cite:108][cite:109]

The goal is not to build a generic lead database clone. The module should help users define target accounts, discover companies, resolve decision-makers, explain why an account matters now, activate records into CRM and marketing flows, and measure revenue impact while preserving platform speed and trust.[cite:110][web:121][web:131]

The architecture below prioritizes four constraints from the start:
- fast UI interactions,
- provider abstraction,
- compliance and provenance,
- low-latency core paths with async heavy work.[web:121][web:123][web:125]

## Product definition

### Positioning

Externally, the feature can be called **Lead Generator** for sales clarity. Internally, the bounded domain should be named **Lead Intelligence** because the real value is account discovery, enrichment quality, prioritization, and activation rather than raw contact dumping.[web:121][web:124]

### Core promise

The module should enable this flow:
1. Define ICP and persona.
2. Generate a company-first shortlist.
3. Resolve the best contacts with source-aware confidence.
4. Score by fit, timing, and reachability.
5. Push approved records into CRM and outbound workflows.
6. Measure pipeline and outcome by source and segment.[cite:116][web:121][web:131]

### Non-goals

The MVP should explicitly avoid these patterns:
- mass blind export engine,
- synchronous enrichment in request-response cycles,
- opaque AI-only scoring without evidence,
- direct dependence on one script vendor,
- duplicate data models parallel to CRM core.[cite:108][web:123][web:126]

## Speed principles

The module must preserve PayAid V3 performance by treating enrichment and discovery as background work, not page-blocking operations. Modern lead-enrichment workflows often rely on staged enrichment and waterfall logic precisely because full enrichment on every record is expensive and slow.[web:120][web:121][web:125]

Apply these rules everywhere:
- Never enrich contacts during initial page load.
- Search companies first; enrich contacts only after shortlist approval.
- Use server-rendered shells with streamed result batches.
- Cache normalized account summaries aggressively.
- Use queue jobs for provider I/O, scoring refreshes, exports, and re-enrichment.
- Precompute default sort fields such as `conversionPotential` and `freshnessScore`.
- Store provider responses once and derive UI projections from normalized tables.[web:121][web:125]

### Performance budget

| Area | Target |
|---|---|
| Initial workspace shell load | under 1.5s on warm path |
| Filter interaction response | under 150ms for local state and indexed queries |
| Results first batch visible | under 3s after discovery job starts |
| CRM activation action | under 500ms to enqueue and confirm |
| Heavy enrichment | always async job-driven |
| Default result page size | 25 accounts, lazy expand contacts |

### Performance architecture rules

- All external provider calls run in worker jobs, never directly in synchronous route handlers unless it is a tiny metadata/usage check.
- Use materialized ranking fields in database rows for default sorting.
- Use partial indexes for common filters: geo, industry, employee band, verified email present, score buckets.
- Use cursor pagination only; avoid offset pagination on large lead tables.
- Denormalize read-model summaries for the main workspace grid.
- Keep raw provider payloads in snapshot tables or JSON columns, but never query against large raw JSON in the main UX path.
- Use selective revalidation on Next.js routes and avoid over-fetching on initial render.

## Monorepo structure

Recommended structure:

```text
apps/
  leads/
    app/
      (workspace)/
        briefs/
        segments/
        discover/
        accounts/
        contacts/
        activation/
        analytics/
      api/
        briefs/
        discovery/
        accounts/
        contacts/
        activation/
        analytics/
        providers/
    components/
    lib/
    hooks/
    types/

packages/
  leads-core/
    src/
      domain/
      services/
      scoring/
      merge/
      orchestration/
      validators/
  leads-providers/
    src/
      adapters/
      base/
      registry/
      transforms/
  leads-ai/
    src/
      prompts/
      summarizers/
      explainers/
      personalization/
  leads-compliance/
    src/
      policy/
      suppression/
      retention/
      legal-basis/
  queue/
    src/
      jobs/
      workers/
      scheduler/
  db/
    prisma/
      schema/
        lead-intelligence.prisma
```

### Design intent

- `apps/leads` owns UI and route composition.
- `packages/leads-core` owns domain rules and orchestration.
- `packages/leads-providers` isolates provider-specific mapping and churn.
- `packages/leads-ai` handles explanation and drafting, not source-of-truth persistence.
- `packages/leads-compliance` centralizes guardrails for export, enrichment, retention, and suppression.[web:123][web:126][web:129]

This separation protects speed because provider complexity and prompt logic stay outside the hot UI path.[web:121][web:125]

## Domain model

### Bounded domains

The module should have five subdomains:
- Briefs and segments.
- Discovery and enrichment.
- Scoring and prioritization.
- Activation.
- Compliance and audit.

### Core entities

| Entity | Purpose |
|---|---|
| `LeadBrief` | Saved ICP definition plus persona, exclusions, and target signals |
| `LeadSegment` | Materialized result set definition and refreshable shortlist |
| `LeadAccount` | Company-level normalized record |
| `LeadContact` | Person-level normalized record |
| `LeadSignal` | Trigger event or intent clue tied to account/contact |
| `LeadScore` | Fit, intent, reachability, and composite score |
| `LeadEnrichmentSnapshot` | Provider response snapshot for audit and refresh |
| `LeadFieldEvidence` | Field-level provenance, confidence, and timestamp |
| `LeadConsentProfile` | Consent/legal-basis/suppression controls |
| `LeadActivationJob` | Sync/import into CRM or marketing |
| `LeadExportJob` | Controlled export workflow |
| `LeadProviderUsage` | Cost, credits, and provider latency observability |
| `LeadAuditEvent` | Compliance and operational traceability |

### CRM relationship model

Do not make Lead Intelligence a separate CRM. Discovery data should live in lead tables until approved, then activate into CRM account/contact/deal workflows through an explicit activation boundary. This preserves dedupe discipline and prevents dual-record drift.[cite:108][cite:116]

## Prisma schema blueprint

Below is a high-level Prisma-ready model outline. Field types and indexes may be adjusted to match existing naming conventions in `@payaid/db`.

```prisma
model LeadBrief {
  id                String   @id @default(cuid())
  orgId             String
  name              String
  description       String?
  industryFilters   Json
  geoFilters        Json
  sizeFilters       Json
  revenueFilters    Json?
  personaFilters    Json
  techFilters       Json?
  triggerFilters    Json?
  exclusionFilters  Json?
  scoringProfileId  String?
  createdById       String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  segments          LeadSegment[]

  @@index([orgId, createdAt])
  @@index([orgId, name])
}

model LeadSegment {
  id                    String   @id @default(cuid())
  orgId                 String
  briefId               String
  name                  String
  status                LeadSegmentStatus @default(DRAFT)
  discoveryState        LeadDiscoveryState @default(IDLE)
  resultCount           Int      @default(0)
  approvedAccountCount  Int      @default(0)
  approvedContactCount  Int      @default(0)
  lastRunAt             DateTime?
  nextRefreshAt         DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  brief                 LeadBrief @relation(fields: [briefId], references: [id])
  accounts              LeadAccount[]

  @@index([orgId, briefId])
  @@index([orgId, status, updatedAt])
}

model LeadAccount {
  id                    String   @id @default(cuid())
  orgId                 String
  segmentId             String?
  domain                String?
  companyName           String
  normalizedName        String
  websiteUrl            String?
  linkedinUrl           String?
  country               String?
  region                String?
  city                  String?
  employeeCount         Int?
  employeeBand          String?
  revenueBand           String?
  industry              String?
  subIndustry           String?
  techStack             Json?
  description           String?
  fitScore              Int      @default(0)
  intentScore           Int      @default(0)
  reachabilityScore     Int      @default(0)
  conversionPotential   Int      @default(0)
  freshnessScore        Int      @default(0)
  sourceCoverageScore   Int      @default(0)
  status                LeadAccountStatus @default(DISCOVERED)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  segment               LeadSegment? @relation(fields: [segmentId], references: [id])
  contacts              LeadContact[]
  signals               LeadSignal[]
  scores                LeadScore[]
  snapshots             LeadEnrichmentSnapshot[]
  fieldEvidence         LeadFieldEvidence[]

  @@index([orgId, segmentId, conversionPotential])
  @@index([orgId, domain])
  @@index([orgId, industry, employeeBand])
  @@index([orgId, country, region, city])
  @@index([orgId, status, updatedAt])
}

model LeadContact {
  id                    String   @id @default(cuid())
  orgId                 String
  accountId             String
  fullName              String
  normalizedFullName    String
  firstName             String?
  lastName              String?
  title                 String?
  seniority             String?
  department            String?
  linkedinUrl           String?
  workEmail             String?
  emailStatus           LeadVerificationStatus @default(UNKNOWN)
  emailConfidence       Float?
  phone                 String?
  phoneStatus           LeadVerificationStatus @default(UNKNOWN)
  phoneConfidence       Float?
  personaMatchScore     Int      @default(0)
  reachabilityScore     Int      @default(0)
  status                LeadContactStatus @default(RESOLVED)
  lastVerifiedAt        DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  account               LeadAccount @relation(fields: [accountId], references: [id])
  scores                LeadScore[]
  snapshots             LeadEnrichmentSnapshot[]
  fieldEvidence         LeadFieldEvidence[]
  consentProfile        LeadConsentProfile?

  @@index([orgId, accountId])
  @@index([orgId, workEmail])
  @@index([orgId, linkedinUrl])
  @@index([orgId, status, lastVerifiedAt])
}

model LeadSignal {
  id                    String   @id @default(cuid())
  orgId                 String
  accountId             String?
  contactId             String?
  type                  String
  title                 String
  description           String?
  strength              Int      @default(0)
  observedAt            DateTime
  expiresAt             DateTime?
  sourceProvider        String
  sourceUrl             String?
  metadata              Json?
  createdAt             DateTime @default(now())

  account               LeadAccount? @relation(fields: [accountId], references: [id])
  contact               LeadContact? @relation(fields: [contactId], references: [id])

  @@index([orgId, accountId, observedAt])
  @@index([orgId, type, observedAt])
}

model LeadScore {
  id                    String   @id @default(cuid())
  orgId                 String
  accountId             String?
  contactId             String?
  scoreType             LeadScoreType
  fitScore              Int      @default(0)
  intentScore           Int      @default(0)
  reachabilityScore     Int      @default(0)
  compositeScore        Int      @default(0)
  explanation           Json?
  modelVersion          String?
  computedAt            DateTime @default(now())

  account               LeadAccount? @relation(fields: [accountId], references: [id])
  contact               LeadContact? @relation(fields: [contactId], references: [id])

  @@index([orgId, scoreType, computedAt])
  @@index([orgId, compositeScore])
}

model LeadEnrichmentSnapshot {
  id                    String   @id @default(cuid())
  orgId                 String
  accountId             String?
  contactId             String?
  provider              String
  operation             String
  status                String
  requestFingerprint    String
  rawPayload            Json
  normalizedPayload     Json?
  fetchedAt             DateTime @default(now())
  expiresAt             DateTime?
  latencyMs             Int?
  costUnits             Decimal? @db.Decimal(12, 4)

  account               LeadAccount? @relation(fields: [accountId], references: [id])
  contact               LeadContact? @relation(fields: [contactId], references: [id])

  @@index([orgId, provider, operation, fetchedAt])
  @@index([orgId, requestFingerprint])
}

model LeadFieldEvidence {
  id                    String   @id @default(cuid())
  orgId                 String
  accountId             String?
  contactId             String?
  fieldName             String
  rawValue              String?
  normalizedValue       String?
  provider              String
  confidence            Float?
  verificationStatus    LeadVerificationStatus @default(UNKNOWN)
  sourceUrl             String?
  sourceType            String?
  legalBasis            String?
  observedAt            DateTime
  expiresAt             DateTime?
  isWinningValue        Boolean  @default(false)
  createdAt             DateTime @default(now())

  account               LeadAccount? @relation(fields: [accountId], references: [id])
  contact               LeadContact? @relation(fields: [contactId], references: [id])

  @@index([orgId, fieldName, isWinningValue])
  @@index([orgId, provider, observedAt])
}

model LeadConsentProfile {
  id                    String   @id @default(cuid())
  orgId                 String
  contactId             String   @unique
  region                String?
  legalBasis            String?
  consentStatus         String?
  emailAllowed          Boolean  @default(false)
  callAllowed           Boolean  @default(false)
  linkedinAllowed       Boolean  @default(false)
  exportAllowed         Boolean  @default(false)
  doNotEnrich           Boolean  @default(false)
  doNotCall             Boolean  @default(false)
  suppressionReason     String?
  updatedAt             DateTime @updatedAt
  createdAt             DateTime @default(now())

  contact               LeadContact @relation(fields: [contactId], references: [id])

  @@index([orgId, consentStatus])
  @@index([orgId, region, emailAllowed, callAllowed])
}

model LeadActivationJob {
  id                    String   @id @default(cuid())
  orgId                 String
  segmentId             String?
  initiatedById         String
  destination           String
  status                JobStatus @default(PENDING)
  payload               Json
  resultSummary         Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([orgId, status, createdAt])
}

model LeadExportJob {
  id                    String   @id @default(cuid())
  orgId                 String
  initiatedById         String
  status                JobStatus @default(PENDING)
  exportType            String
  payload               Json
  fileUrl               String?
  resultSummary         Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([orgId, status, createdAt])
}

model LeadProviderUsage {
  id                    String   @id @default(cuid())
  orgId                 String
  provider              String
  operation             String
  units                 Decimal  @db.Decimal(12, 4)
  estimatedCost         Decimal? @db.Decimal(12, 4)
  latencyMs             Int?
  success               Boolean  @default(true)
  recordedAt            DateTime @default(now())

  @@index([orgId, provider, recordedAt])
}

model LeadAuditEvent {
  id                    String   @id @default(cuid())
  orgId                 String
  actorId               String?
  entityType            String
  entityId              String
  action                String
  metadata              Json?
  createdAt             DateTime @default(now())

  @@index([orgId, entityType, entityId, createdAt])
}

enum LeadSegmentStatus {
  DRAFT
  RUNNING
  READY
  ARCHIVED
}

enum LeadDiscoveryState {
  IDLE
  QUEUED
  DISCOVERING
  ENRICHING
  SCORING
  READY
  FAILED
}

enum LeadAccountStatus {
  DISCOVERED
  SHORTLISTED
  APPROVED
  ACTIVATED
  ARCHIVED
}

enum LeadContactStatus {
  RESOLVED
  VERIFIED
  REJECTED
  ACTIVATED
  ARCHIVED
}

enum LeadVerificationStatus {
  VERIFIED
  UNVERIFIED
  LIKELY
  UNKNOWN
}

enum LeadScoreType {
  ACCOUNT
  CONTACT
}
```

## TypeScript contracts

### Core request/response types

```ts
export type UUID = string;

export interface LeadBriefInput {
  name: string;
  description?: string;
  industryFilters: IndustryFilter[];
  geoFilters: GeoFilter[];
  sizeFilters: SizeFilter[];
  revenueFilters?: RevenueFilter[];
  personaFilters: PersonaFilter[];
  techFilters?: TechFilter[];
  triggerFilters?: TriggerFilter[];
  exclusionFilters?: ExclusionFilter[];
}

export interface CompanyDiscoveryRequest {
  orgId: UUID;
  briefId: UUID;
  segmentId: UUID;
  limit: number;
  cursor?: string;
  searchMode: 'seed' | 'broad' | 'similar';
}

export interface CompanyCandidate {
  externalId?: string;
  provider: string;
  companyName: string;
  domain?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  country?: string;
  region?: string;
  city?: string;
  employeeCount?: number;
  employeeBand?: string;
  revenueBand?: string;
  industry?: string;
  subIndustry?: string;
  techStack?: string[];
  signals?: CandidateSignal[];
  confidence?: number;
  sourceUrl?: string;
  raw?: unknown;
}

export interface ContactDiscoveryRequest {
  orgId: UUID;
  accountId: UUID;
  personas: PersonaFilter[];
  limit: number;
}

export interface ContactCandidate {
  externalId?: string;
  provider: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  seniority?: string;
  department?: string;
  linkedinUrl?: string;
  workEmail?: string;
  emailConfidence?: number;
  phone?: string;
  phoneConfidence?: number;
  sourceUrl?: string;
  raw?: unknown;
}

export interface LeadScoreBreakdown {
  fitScore: number;
  intentScore: number;
  reachabilityScore: number;
  compositeScore: number;
  whyNow: string[];
  recommendedChannel?: 'email' | 'linkedin' | 'call' | 'nurture';
  recommendedAngle?: string;
  explanationVersion: string;
}

export interface ActivationRequest {
  orgId: UUID;
  segmentId?: UUID;
  accountIds: UUID[];
  contactIds?: UUID[];
  destination: 'crm' | 'marketing' | 'sequence';
  options: {
    createTasks?: boolean;
    assignOwner?: boolean;
    startSequence?: boolean;
    skipDuplicates?: boolean;
  };
}
```

### Provider abstraction interface

```ts
export interface LeadSourceAdapter {
  name: string;
  discoverCompanies(input: CompanyDiscoveryRequest): Promise<CompanyCandidate[]>;
  enrichCompany(input: { orgId: UUID; accountId: UUID }): Promise<CompanyCandidate | null>;
  findContacts(input: ContactDiscoveryRequest): Promise<ContactCandidate[]>;
  enrichContact(input: { orgId: UUID; contactId: UUID }): Promise<ContactCandidate | null>;
  verifyEmail?(input: { orgId: UUID; email: string }): Promise<EmailVerificationResult>;
  verifyPhone?(input: { orgId: UUID; phone: string }): Promise<PhoneVerificationResult>;
  getUsage?(input: { orgId: UUID }): Promise<ProviderUsageSnapshot>;
}
```

### Orchestrator interfaces

```ts
export interface LeadDiscoveryOrchestrator {
  runSegmentDiscovery(input: CompanyDiscoveryRequest): Promise<{ jobId: string }>;
  refreshSegment(input: { orgId: UUID; segmentId: UUID }): Promise<{ jobId: string }>;
}

export interface LeadMergeService {
  mergeCompanyCandidates(input: CompanyCandidate[]): Promise<NormalizedCompanyRecord[]>;
  mergeContactCandidates(input: ContactCandidate[]): Promise<NormalizedContactRecord[]>;
}

export interface LeadComplianceService {
  canEnrichContact(contactId: UUID): Promise<boolean>;
  canExportContact(contactId: UUID): Promise<boolean>;
  getChannelPermissions(contactId: UUID): Promise<ChannelPermissions>;
}
```

## Merge and conflict resolution

Use deterministic merge rules before any AI explanation is generated. Best-practice enrichment systems improve quality by using waterfall enrichment plus conflict resolution across freshness, verification, and provider confidence.[web:121][web:125]

Winning-value rules:
1. Manual user edits win over provider values.
2. Verified value wins over unverified or likely.
3. Fresher value wins over older values.
4. Higher provider trust weight wins when timestamps are similar.
5. Domain-matching work email beats generic/inferred email.
6. Role-based emails are marked but do not win unless explicitly allowed.[web:121][web:123]

### Suggested provider trust config

```ts
export interface ProviderTrustProfile {
  provider: string;
  baseWeight: number; // 0-100
  strengths: Array<'company' | 'contact' | 'email' | 'phone' | 'signal'>;
  freshnessTtlDays: number;
}
```

## Scoring model

Keep the scoring engine deterministic and cheap in the request path. AI should explain the score and generate angles, but not be the only scorer.[cite:106][web:131]

### Composite formula

A simple first version:

```ts
compositeScore = Math.round(
  fitScore * 0.40 +
  intentScore * 0.30 +
  reachabilityScore * 0.20 +
  sourceCoverageScore * 0.10
);
```

### Fit score inputs

- industry match,
- geo match,
- employee band match,
- revenue band match,
- persona presence,
- tech stack match.[web:121][web:124]

### Intent score inputs

- hiring activity,
- recent job posts,
- detected ads or martech usage,
- website changes,
- inbound activity if first-party signals exist,
- recent trigger events.[web:117][web:121]

### Reachability score inputs

- verified email,
- verified phone,
- LinkedIn available,
- freshness of contact data,
- suppression/compliance eligibility.[web:121][web:123]

## Queue and worker design

The module should be job-first. All heavy external work must happen in queue workers to preserve application speed.[web:121][web:125]

### Job list

| Job | Purpose |
|---|---|
| `leadBrief.runDiscovery` | Start company-first discovery for a segment |
| `leadAccount.enrich` | Deepen company profile and signals |
| `leadAccount.resolveContacts` | Find candidate contacts for approved accounts |
| `leadContact.enrich` | Enrich selected contacts only |
| `leadScore.compute` | Compute deterministic scores and summaries |
| `leadSegment.refresh` | Re-run discovery for saved segment |
| `leadSegment.reEnrich` | Refresh stale contacts/accounts |
| `leadActivation.syncToCrm` | Push approved records into CRM |
| `leadActivation.startSequence` | Trigger outbound workflow or marketing audience sync |
| `leadExport.generate` | Controlled export generation |
| `leadCompliance.auditSweep` | Re-check stale legal basis or suppression conditions |

### Worker pipeline

1. `runDiscovery` fetches company candidates.
2. Merge and normalize account records.
3. Compute preliminary account scores.
4. Persist summary rows and stream batches to UI.
5. Only after approval, `resolveContacts` runs for selected accounts.
6. Contact enrichment updates field evidence and confidence.
7. `compute` recalculates account/contact scores.
8. `syncToCrm` activates selected records.[web:121][web:125]

### Retry logic

- Retry transient provider failures with exponential backoff.
- Circuit-break failing providers per org/provider pair.
- Fall back to secondary provider if primary coverage is below threshold.
- Record latency and cost for every provider call in `LeadProviderUsage`.

## API routes

The API should be thin and job-oriented. Route handlers validate, authorize, enqueue, and return read-model responses.

### Route map

```text
POST   /api/leads/briefs
GET    /api/leads/briefs
GET    /api/leads/briefs/:id
PATCH  /api/leads/briefs/:id
POST   /api/leads/briefs/:id/run

POST   /api/leads/segments
GET    /api/leads/segments/:id
POST   /api/leads/segments/:id/refresh
GET    /api/leads/segments/:id/results
GET    /api/leads/segments/:id/stats

GET    /api/leads/accounts
GET    /api/leads/accounts/:id
POST   /api/leads/accounts/:id/shortlist
POST   /api/leads/accounts/:id/resolve-contacts

GET    /api/leads/contacts/:id
POST   /api/leads/contacts/:id/enrich
POST   /api/leads/contacts/bulk-approve

POST   /api/leads/activation/crm
POST   /api/leads/activation/sequence
POST   /api/leads/export

GET    /api/leads/analytics/overview
GET    /api/leads/analytics/sources
GET    /api/leads/providers/usage
```

### Route behavior rules

- `POST /briefs/:id/run` enqueues discovery and returns `{ jobId, segmentId }`.
- `GET /segments/:id/results` returns paginated account summaries only by default.
- Contact details are fetched lazily per account drawer or contact route.
- Bulk actions always require explicit selected IDs or saved selection snapshots.
- Export endpoint performs compliance eligibility checks before enqueueing.[web:123][web:126]

## Service layer breakdown

### `packages/leads-core/src/services`

Recommended services:
- `LeadBriefService`
- `LeadSegmentService`
- `LeadDiscoveryService`
- `LeadContactResolutionService`
- `LeadScoreService`
- `LeadMergeService`
- `LeadActivationService`
- `LeadAnalyticsService`
- `LeadReadModelService`

### `packages/leads-providers/src`

Recommended folders:
- `base/LeadSourceAdapter.ts`
- `registry/providerRegistry.ts`
- `adapters/providerA.ts`
- `adapters/providerB.ts`
- `adapters/internalCrawler.ts`
- `transforms/normalizeCompany.ts`
- `transforms/normalizeContact.ts`
- `transforms/normalizeSignal.ts`

### `packages/leads-compliance/src`

Recommended services:
- `LeadConsentService`
- `LeadSuppressionService`
- `LeadExportPolicyService`
- `LeadRetentionService`
- `LeadRegionPolicyEngine`

## Read models for speed

The main workspace should not join ten tables on every request. Create read models or optimized SQL views for the hot screens.

Recommended read models:
- `LeadAccountListItemView`
- `LeadAccountInsightView`
- `LeadContactListItemView`
- `LeadSegmentOverviewView`
- `LeadSourcePerformanceView`

Example account list projection:

```ts
export interface LeadAccountListItemView {
  id: string;
  companyName: string;
  domain?: string;
  industry?: string;
  city?: string;
  employeeBand?: string;
  conversionPotential: number;
  fitScore: number;
  intentScore: number;
  verifiedContactCount: number;
  topSignal?: string;
  freshnessLabel: 'fresh' | 'aging' | 'stale';
  recommendedAction?: 'review' | 'resolve_contacts' | 'activate';
}
```

These projections should be updated by jobs or transactional service methods, not computed repeatedly in the UI path.

## Page-by-page UI breakdown

The UI should feel operational, not decorative. It should behave like a sales intelligence workspace connected to PayAid CRM and marketing flows rather than a standalone gimmick product.[cite:115][cite:116]

### 1. Lead Workspace Home

**Route:** `/leads`

Purpose:
- landing page for saved briefs, active segments, provider usage, and recent activations.

Sections:
- KPI strip: active segments, approved accounts, verified contacts, pipeline created.
- Recent briefs.
- Refresh queue and recent runs.
- Source performance preview.
- “Create Lead Brief” primary CTA.

Performance notes:
- fully server-rendered summary page,
- avoid loading heavy grids here,
- use small widgets backed by read models.

### 2. Brief Builder

**Route:** `/leads/briefs/new` and `/leads/briefs/:id`

Layout:
- left: step navigation,
- center: form panels,
- right: live estimated audience summary.

Steps:
1. Market definition.
2. Persona targeting.
3. Tech and trigger signals.
4. Exclusions and compliance defaults.
5. Review and save.

UX rules:
- autosave draft,
- inline count estimates only from cached provider metadata or internal heuristics,
- do not run full discovery during editing.

### 3. Segment Discovery Workspace

**Route:** `/leads/segments/:id`

Layout:
- left rail: filters, saved views, confidence threshold, verified-only toggle.
- center: company-first results grid.
- right drawer: insight panel for selected company.

Grid columns:
- company,
- geo,
- employee band,
- top signal,
- fit,
- intent,
- verified contacts count,
- conversion potential,
- status.

Primary actions:
- shortlist account,
- resolve contacts,
- refresh account,
- bulk approve selected.

Performance rules:
- infinite cursor pagination,
- only one selected account drawer open,
- contact resolution hidden until requested.

### 4. Account Detail View

**Route:** `/leads/accounts/:id`

Tabs:
- Overview.
- Signals.
- Contacts.
- Evidence.
- Activation history.

Overview:
- company summary,
- why-now bullets,
- tech stack,
- fit summary,
- compliance notes.

Signals:
- chronological signal feed with strength labels.

Contacts:
- candidate decision-makers sorted by persona match and reachability.

Evidence:
- field-level provenance table for website, email, phone, LinkedIn, title.

### 5. Contact Detail View

**Route:** `/leads/contacts/:id`

Sections:
- identity card,
- verification state,
- evidence timeline,
- allowed channels,
- AI-generated angle and opening line,
- activation CTA.

UX rules:
- show `Verified`, `Unverified`, `Likely`, `Suppressed` chips prominently,
- never hide source/confidence for contact channels.

### 6. Activation Review

**Route:** `/leads/activation`

Purpose:
- final approval step before records enter CRM or outbound workflows.

Sections:
- selected accounts/contacts summary,
- dedupe preview,
- owner assignment preview,
- suppression/conflict alerts,
- destination options: CRM, campaign, sequence.

Actions:
- activate now,
- save activation set,
- export eligible only.

### 7. Analytics and ROI

**Route:** `/leads/analytics`

Sections:
- source performance,
- provider cost and verified yield,
- meetings by segment,
- pipeline created by brief,
- win rate by persona/geo,
- stale segment alerts.

Performance rules:
- charts and tables must read from pre-aggregated tables or materialized summaries.

## UX defaults

These defaults make the module feel premium and trustworthy:
- Default sort = `conversionPotential DESC`.
- Default filter hides low-confidence contacts.
- Contact-level enrichment is opt-in, not automatic.
- Bulk actions require review.
- Every contact field shows confidence and source.
- Every score has a “why” panel.
- Activation is more prominent than export.[web:121][web:131]

## AI integration design

AI should be used selectively where it creates leverage without hurting speed or determinism.[cite:106]

### Use AI for
- account summary generation,
- signal summarization,
- “why now” explanations,
- persona-to-pain-point mapping,
- recommended outreach angle,
- first-draft message generation.

### Do not use AI for
- authoritative field resolution,
- compliance decisions,
- deterministic score calculation,
- dedupe source of truth.

### Invocation pattern

- AI runs after normalized data exists.
- AI outputs are cached with model/version tags.
- AI generation is async for bulk result sets.
- Only selected account/contact details need real-time-ish generation.

## Compliance and trust controls

The module must support field-level source attribution and legal-basis tagging because B2B prospecting compliance depends on provenance, retention, and channel restrictions.[web:123][web:126][web:129]

### Minimum controls

- per-field `provider`, `observedAt`, `expiresAt`, `verificationStatus`, `legalBasis`;
- per-contact channel permissions;
- `doNotEnrich`, `doNotCall`, `suppressed` flags;
- export guard for restricted contacts;
- retention and stale-data review policy;
- audit logs for enrichment, export, activation, and suppression changes.[web:123][web:126]

### UX trust rules

- show confidence inline,
- show source inline,
- let users filter by confidence threshold,
- mark role-based emails clearly,
- show last verified dates,
- warn before exporting inferred or low-confidence channels.[web:121][web:123]

## CRM and marketing integration

This module should connect directly with existing PayAid CRM and sales automation flows rather than duplicating them.[cite:108][cite:115][cite:116]

### Activation behaviors

On activation to CRM:
- create or merge account,
- create or merge contact,
- create lead/opportunity as configured,
- assign owner based on routing rules,
- create first follow-up tasks,
- optionally enroll in outbound sequence.

### Dedupe rules

- account dedupe: domain, normalized name, geo similarity;
- contact dedupe: email hash, LinkedIn URL, full name + account;
- preserve existing CRM owner and relationship history when matched.[cite:116]

## Suggested package APIs

### `packages/leads-core`

```ts
export class LeadBriefService {
  create(input: LeadBriefInput): Promise<LeadBriefDto> {}
  update(id: string, input: Partial<LeadBriefInput>): Promise<LeadBriefDto> {}
  run(id: string): Promise<{ jobId: string; segmentId: string }> {}
}

export class LeadDiscoveryService {
  enqueueSegmentRun(input: CompanyDiscoveryRequest): Promise<{ jobId: string }> {}
  listSegmentResults(input: ListSegmentResultsInput): Promise<Paginated<LeadAccountListItemView>> {}
}

export class LeadActivationService {
  preview(input: ActivationRequest): Promise<ActivationPreviewDto> {}
  enqueue(input: ActivationRequest): Promise<{ jobId: string }> {}
}
```

## Suggested implementation phases

### Phase 1 — Foundations
- Prisma schema.
- Domain services.
- Provider adapter base.
- Brief builder.
- Segment run job.
- Account list read model.

### Phase 2 — Discovery and trust
- Company-first discovery.
- Account insight drawer.
- Field evidence persistence.
- Preliminary scoring.
- Confidence/source UI.

### Phase 3 — Contact resolution and activation
- Resolve contacts per selected account.
- Activation preview.
- CRM dedupe + sync.
- Suppression checks.

### Phase 4 — ROI and AI assist
- Provider usage analytics.
- Source ROI dashboards.
- AI summaries and outreach angles.
- Re-enrichment scheduler.[web:121][web:125]

## Engineering guardrails for Cursor

Use these instructions when implementing:

- Keep all heavy provider access in queue workers.
- Do not call external providers from React Server Components directly.
- Build list pages from read models, not deep relational joins.
- Add indexes with every filterable column introduced.
- Use cursor pagination from day one.
- Keep scoring deterministic and pure in `packages/leads-core`.
- Store raw provider payloads for audit, but never render them directly to users.
- Gate export actions behind compliance service checks.
- Prefer account-first workflows over contact-first workflows.
- Reuse CRM routing and sales automation systems instead of duplicating them.[cite:115][cite:116]

## Cursor-ready build order

1. Add Prisma models and migrations.
2. Add `packages/leads-core` domain types and services.
3. Add `LeadSourceAdapter` base and stub providers.
4. Add queue jobs and worker handlers.
5. Build `/leads` shell and brief builder.
6. Build segment results page with company-first grid.
7. Build account drawer and contact resolution flow.
8. Build activation preview and CRM sync.
9. Add analytics read models and ROI dashboard.
10. Add AI summary/explanation layer behind feature flags.

## Final recommendation

The strongest implementation for PayAid V3 is a speed-first, company-first, job-driven Lead Intelligence module that enriches selectively, shows trust per field, activates directly into CRM, and measures real business outcomes. That architecture matches current enrichment best practices, aligns with PayAid’s modular CRM and automation direction, and avoids the fragility of script-led, scrape-heavy lead products.[cite:108][cite:109][web:121][web:123][web:125]
