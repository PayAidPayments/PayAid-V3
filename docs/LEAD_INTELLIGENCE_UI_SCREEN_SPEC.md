# PayAid V3 Lead Intelligence - Screen-by-Screen UI Specification

## 1) Purpose

This document defines the implementation-ready UI contract for Lead Intelligence, aligned to:

- `docs/LEAD_INTELLIGENCE_DATA_WORKFLOW_SPEC.md`

It translates object and workflow contracts into screen behavior, component responsibilities, state handling, and acceptance-level UI rules.

## 2) UX principles

- Lead Intelligence is a standalone workspace, not a CRM tab.
- Primary user path is always `discover -> enrich -> qualify -> activate`.
- Every row must expose confidence + provenance.
- No activation UI path is allowed for unqualified rows.
- All long-running jobs must be observable, cancellable, and retryable.

## 3) Global navigation and shell

## Top-level module nav

- `Lead Intelligence Home`
- `ICP Builder`
- `Industry Explorer`
- `Company Discovery`
- `People Discovery`
- `Data Enrichment`
- `Web Scraping Research`
- `Qualification & Scoring`
- `Activation Queue`
- `Saved Searches`
- `Export Center`

## Persistent shell components

- Global search bar (searches saved searches, companies, contacts, jobs).
- Active jobs tray (discovery/enrichment/scrape/export statuses).
- Notification center (success/failure/retry events).
- Tenant scope badge and connector health indicator.

## Global job status taxonomy (UI labels)

- `Queued`, `Planning`, `Running`, `Retrying`, `Partial`, `Completed`, `Failed`, `Cancelled`

## 4) Screen specs

## Screen 1: Lead Intelligence Home

### Goal

Entry dashboard for creation, monitoring, and continuation of lead workflows.

### Primary UI blocks

- Hero CTA: `Create New Search`
- `Saved Searches` list (recent + pinned)
- `Recent Discoveries` panel
- `Active Research Jobs` panel
- `Qualified Prospects` snapshot
- `Enrichment Queue` snapshot
- `Activation Queue` snapshot
- `Export History` snapshot

### Mandatory copy

- One-sentence explainer: `Find, enrich, and activate high-fit prospects from live sources.`

### Object mapping

- `lead_search`, `discovery_job`, `scrape_job`, `fit_score`, `export_job`

### Key interactions

- New search modal opens (`lead_search` create).
- Resume saved search restores filter/query context.
- Clicking a job opens detail drawer with logs and retries.
- Quick actions: retry failed job, cancel running job.

### Empty states

- No searches: show onboarding quick-start cards (prompt, industry, CSV, URL).
- No active jobs: show connector health and recommended first actions.

---

## Screen 2: ICP Builder

### Goal

Define targeting logic that powers planning and scoring.

### Form sections

- Industries and sub-industries
- Geography and serviceable area
- Company size and revenue bands
- Titles and decision roles
- Technographic requirements
- Buying signals
- Exclusions
- Lead source preferences
- Compliance restrictions

### Object mapping

- `icp_profile`

### Key interactions

- Save draft / activate / archive profile.
- Clone existing profile.
- Preview score impact by showing estimated fit distribution sample.

### Validation rules

- Must define at least one targeting anchor (industry/geo/title/size).
- Exclusions cannot fully negate all targeting rules.

---

## Screen 3: Industry Explorer

### Goal

Provide vertical-first entry points for discovery.

### UI structure

- Searchable tile grid (100+ verticals)
- Tile cards with:
  - industry name
  - sub-vertical chips
  - sample queries
  - common buying signals
  - common decision-makers
- Right-side panel: `Use this playbook`

### Object mapping

- Preset templates feeding `icp_profile` and `lead_search`

### Key interactions

- Selecting a tile pre-fills discovery query + ICP defaults.
- Save as custom playbook for tenant reuse.
- Launch directly into Company Discovery or People Discovery.

---

## Screen 4: Company Discovery

### Goal

Run live-source company discovery and produce canonical company rows.

### Top controls

- Prompt input (natural language)
- Structured filters (industry, geo, size, revenue, tech stack, signals)
- Source scope selector (multi-select connectors)
- Run search button

### Results grid (required columns)

- Company name
- Website
- Industry
- Location
- Employee count
- Revenue band
- Tech stack
- Phone
- Email domain
- Confidence
- Source count
- Signals
- Last verified
- Fit score

### Object mapping

- `lead_search`, `discovery_job`, `company_record`, `source_connector`

### Key interactions

- Expand row -> provenance timeline and source evidence.
- Add/remove enrichment columns inline.
- Send selected companies to People Discovery.
- Save search and schedule refresh.

### Job visibility

- Per-source status chips with attempts and failures.
- Partial result banner if any source fails.

---

## Screen 5: People Discovery

### Goal

Resolve decision-makers and outreach-ready contacts for selected companies.

### Input modes

- From selected companies
- Direct person search prompt
- Role-first search (title/seniority/department)

### Results grid (required columns)

- Full name
- Title
- Company
- Department
- Email + verification status
- Phone + verification status
- LinkedIn URL
- Location
- Seniority
- Decision role
- Confidence
- Source trace

### Object mapping

- `contact_record`, `company_record`, `discovery_job`

### Key interactions

- Resolve missing contact points.
- Promote candidates to enrichment queue.
- Mark invalid matches and suppress from future merges.

---

## Screen 6: Data Enrichment

### Goal

Fill missing firmographic/technographic/contact fields at scale.

### Entry options

- Enrich current search results
- Enrich uploaded CSV
- Enrich selected records from previous runs

### Configuration

- Column selector (standard + custom fields)
- Priority mode (contactability-first, fit-first, full-pass)
- Source preferences and max credits/time budget

### Progress view

- Overall batch status
- Field completion progress
- Per-source contribution summary
- Error/retry queue

### Object mapping

- `enrichment_field`, `company_record`, `contact_record`, `lead_search`

### Key interactions

- Retry failed fields only.
- Lock trusted fields against overwrite.
- Compare before/after row snapshots.

---

## Screen 7: Web Scraping Research

### Goal

Convert public URLs into structured prospect data.

### Input

- Single URL
- Bulk URL paste/upload
- Template selection (`team_page`, `directory`, `conference`, `pricing`, `service_listing`, `custom`)

### Output panels

- Extraction status list
- Parsed entities preview
- Confidence and parser notes
- Merge actions (`create new`, `merge existing`, `needs review`)

### Object mapping

- `scrape_job`, `company_record`, `contact_record`, `enrichment_field`

### Key interactions

- Run/stop scrape jobs.
- Retry failed URLs with fallback parser.
- Promote extracted rows to discovery results for scoring.

---

## Screen 8: Qualification & Scoring

### Goal

Rank prospects and enforce qualification thresholding.

### Views

- Score distribution chart
- Qualified vs disqualified split
- Breakdown table with component scores:
  - fit
  - intent
  - completeness
  - freshness
  - source reliability

### Object mapping

- `fit_score`, `intent_signal`, `icp_profile`, `company_record`, `contact_record`

### Key interactions

- Change threshold (within permission limits).
- Re-score selected/all rows.
- Inspect reason text and score inputs per row.
- Create qualification segments (high-fit/high-intent, etc.).

### Gating behavior

- Only rows with `qualified=true` display activation actions.
- Others show `Improve data` recommendations.

---

## Screen 9: Activation Queue

### Goal

Route qualified prospects into operational systems.

### Queue columns

- Record type (company/contact)
- Qualification status
- Recommended destination
- Assigned owner
- Activation actions available
- Last action state
- Audit reference

### Action panel

- Create/update CRM account/contact/lead/opportunity
- Start email sequence
- Start WhatsApp outreach
- Create call task
- Create appointment task
- Add to campaign audience

### Object mapping

- `activation_rule`, `fit_score`, `audit_log`

### Key interactions

- Bulk activate with idempotency safeguard.
- Dry-run preview (shows records that will be created/updated).
- Handle partial success with retryable failed subset.

### Guardrails

- UI must block action if score or confidence policy fails.
- Must log each destination write with source row references.

---

## Screen 10: Saved Searches

### Goal

Manage reusable discovery configurations.

### Features

- Saved `lead_search` list and tags
- Clone, rename, archive
- Scheduled rerun setup
- Delta mode (`new since last run`)

### Object mapping

- `lead_search`, `discovery_job`

### Key interactions

- Compare run-to-run result deltas.
- Open historical run artifacts (jobs, errors, exports).

---

## Screen 11: Export Center

### Goal

Export segmented datasets and CRM-ready payloads.

### Export options

- CSV
- XLSX
- CRM-ready import format

### Filters

- By industry
- By score band
- By role
- By enrichment completeness
- By activation readiness

### Object mapping

- `export_job`, `lead_search`, `fit_score`

### Key interactions

- Create export job with progress tracking.
- Download artifact and copy audit reference.
- Re-run previous export definition.

## 5) Cross-screen interaction contracts

### Discovery to enrichment handoff

- Selected rows from discovery must carry canonical IDs.
- Enrichment screen receives scope as record set + field priorities.

### Enrichment to scoring handoff

- Re-score trigger auto-fires for updated records.
- Scoring screen highlights rows changed since last score run.

### Scoring to activation handoff

- Activation queue imports only rows with `qualified=true`.
- For disqualified rows, show explicit blocker reasons.

## 6) Shared component requirements

## Required shared components

- `ProvenanceBadge` (source count + confidence)
- `JobStatusChip` (all job states)
- `QualificationPill` (`Qualified` / `Not qualified` / `Needs data`)
- `ScoreBreakdownPopover`
- `RecordMergeDrawer`
- `ActivationPreviewModal`
- `ConnectorHealthBadge`

## 7) Permissions and role behavior

- View-only users can inspect all rows/jobs but cannot run discovery/enrichment/activation.
- Analyst users can run discovery, enrichment, scoring, exports.
- Manager users can modify thresholds and activation rules.
- Admin users can manage source connectors and module settings.

## 8) Error and edge-state UX rules

- Every failed async action must show:
  - concise reason
  - retry option (if retriable)
  - audit/event reference id
- Partial completion must not hide successful rows.
- Bulk actions must provide per-row failure details and downloadable failure report.

## 9) Telemetry events (UI)

- `lead_intel.search_created`
- `lead_intel.discovery_started`
- `lead_intel.discovery_completed`
- `lead_intel.enrichment_started`
- `lead_intel.enrichment_completed`
- `lead_intel.scoring_completed`
- `lead_intel.activation_attempted`
- `lead_intel.activation_completed`
- `lead_intel.export_requested`
- `lead_intel.export_completed`

Each event should include `tenant_id`, `user_id`, `screen`, `record_count` (when applicable), and `lead_search_id` if present.

## 10) UI acceptance checklist

### Navigation and structure

- [ ] Lead Intelligence appears as standalone module in module switcher/nav.
- [ ] All required screens exist and are reachable without entering CRM routes.

### Workflow continuity

- [ ] User can complete full flow from discovery to activation without context loss.
- [ ] Handoffs preserve selected rows, filters, and search context.

### Data trust

- [ ] Every result row exposes confidence and provenance.
- [ ] Dedupe/merge decisions are visible and reversible by authorized roles.

### Qualification and governance

- [ ] Activation actions are blocked for unqualified rows.
- [ ] Score reasons are visible for each row.

### Operational reliability

- [ ] Long-running jobs show live status and retries.
- [ ] Failures provide actionable recovery steps.

### Export and downstream readiness

- [ ] Export formats produce correct segmented output.
- [ ] Activation preview accurately reflects create/update behavior before write.

## 11) Suggested implementation order

1. Global shell + Home + Saved Searches
2. ICP Builder + Industry Explorer
3. Company Discovery + People Discovery
4. Data Enrichment + Web Scraping Research
5. Qualification & Scoring
6. Activation Queue + Export Center
7. Shared components + telemetry + hardening
