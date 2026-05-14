# Lead Intelligence — Status Dashboard (Leadership)

Date: 2026-05-09  
Source of truth: `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` + `docs/LEAD_INTELLIGENCE_DATA_WORKFLOW_SPEC.md`
Operator handoff: `docs/LEAD_INTELLIGENCE_M1_HANDOFF_RUNBOOK.md`  
Browser QA: `docs/LEAD_INTELLIGENCE_M1_BROWSER_SMOKE_CHECKLIST.md`

## Current status (leadership quick read)

- **M1 delivery status:** Substantially complete for company-first `discover -> save -> export` in dashboard.
- **M1 evidence status:** Targeted closure tests now have passing evidence artifact.
- **Risk level:** Medium-low (M1 flow and contracts validated; M2+ scope remains the main risk).

## Scope done (shipped / wired)

- **Module separation + honest navigation**
  - Lead Intelligence lives under `/lead-intelligence/[tenantId]/…` (not a CRM subpage).
  - Legacy CRM “Lead Generator” page redirects to Lead Intelligence Home.
  - Module switcher + home grid surfaces Lead Intelligence.
- **Licensing + signup presets**
  - `lead-intelligence` is an explicit licensed module (no CRM alias).
  - Signup supports `?bundle=` presets (LI, LI+CRM, starter, growth, operations-bundle) overriding `?modules=`.
  - Marketing landing exists for LI + LI+CRM (bundle CTA).
- **Auth token sync**
  - `/api/auth/me` can return a `replacementAccessToken` when DB entitlements differ from JWT; dashboard store applies it.
- **Health + review stubs**
  - `GET /api/lead-intelligence/health` is license-gated and returns `discovery` (tenant account index mode) plus a lightweight Prisma `dataPlane` probe (latency).
  - Review queue route exists as a shell placeholder.
- **M1 discovery flow now functional (dashboard)**
  - Module **`Home`** surfaces a shipped **M1 ribbon** linking Search, Companies, Saved searches, and Exports for operator clarity alongside future-phase cards.
  - Search planner (`Step 1`) runs real tenant-scoped company discovery via `/api/lead-intelligence/discovery/companies`.
  - Companies workspace (`Step 2`) renders real results with retry and cross-step actions.
  - Saved searches (`Step 3`) persists/reopens; rename, archive/restore (`LeadSegmentStatus.ARCHIVED`), and delete (`LeadBrief`/`LeadSegment`).
  - Exports (`Step 4`) generates downloadable CSV and logs `LeadExportJob` history (including failed runs).
  - Shared step indicator with completion state + reset action is wired across all 4 pages.
- **M1 observability + safety**
  - LI audit actions wired (`search_started`, `search_saved`, `search_renamed`, `search_archived`, `search_unarchived`, `search_deleted`, `export_requested`, `export_failed`, history/list viewed).
  - Product telemetry counters mirrored for the same verbs via `trackLeadIntelligenceEvent` (`lib/lead-intelligence/telemetry.ts`) with optional StatsD; discovery and export add **non-empty vs empty** outcome counters for funnel views; in-process totals can appear on `/api/lead-intelligence/health` when `LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH=1`.
  - Export failure contract now returns retryable error and records failed job state.
- **Ops migration executed**
  - Backfill ran successfully and granted `lead-intelligence` to 7 CRM-licensed tenants that were missing it.
  - Post-check dry-runs now return `count=0`.

## In progress (built in other app/packages; still needs product integration)

These exist as “Lead Intelligence platform work” but are not yet integrated into the dashboard LI UX:

- **Core data/workflow foundations** (entities, orchestration, provider adapters, job-style APIs)
- **Activation review + CRM sync execution path** (draft-first preview → explicit confirm → worker execution)
- **Activation sets + history + lifecycle controls** (save/load, archive/delete, sorting, pagination)
- **Bulk ops and governance** (bulk actions, export reports, retention controls, scheduler health evidence)

## Blocked / risks

- **End-to-end LI product loop not yet live in dashboard:** `discover → enrich → qualify → export/activate`
  - Discovery/save/export path is now wired; enrichment/scoring/activation remain pending.
- **Source connectors + credentials + metering/credits** not fully productized for leadership sign-off (billing + limits + audit expectations).
- **Activation into CRM/Comms**: must remain draft-first and approval-safe; needs entitlement-aware upsell paths and telemetry.
- **Runner stability risk:** local Jest has previously hung pre-output in this workspace; closure check now uses per-suite timeout wrappers and artifact capture.

## Next milestones (what to do next)

- **M1 closeout**
  - Dedicated GitHub Actions workflow **`lead-intelligence-m1-closure`** runs LI closure checks on path-filtered PRs/pushes (`develop`/`main`).
  - Run `docs/LEAD_INTELLIGENCE_M1_BROWSER_SMOKE_CHECKLIST.md` before sign-off where applicable.
  - Optional provider-specific health once external connectors ship; refine StatsD/cardinality policy if tagging expands beyond named actions.
- **M2: Enrichment + provenance**
  - Enrichment jobs with field-level evidence/provenance and confidence surfaced in UI.
- **M3: Scoring + qualification**
  - ICP builder → scoring rules → fit score + explainability; block activation until qualified.
- **M4: Activation + upsell**
  - Activation queue that can (a) export CSV, (b) activate into CRM when licensed, (c) upsell CRM/Comms when not.
- **M5: Observability + governance**
  - Usage metering, audit logs, retry/error UX, and operational health dashboards (jobs + schedulers).

## Acceptance checklist (leadership-ready)

Use this as a ship/no-ship gate for the “Lead Intelligence standalone product”:

- [ ] **Standalone positioning**: Lead Intelligence is not framed as “CRM leads”; it is a separate module with its own value loop.
- [ ] **Live discovery**: at least one real source produces repeatable results; no “table-only/manual entry” experience.
- [ ] **Enrichment**: missing fields can be enriched, with provenance + confidence.
- [ ] **Qualification**: scoring exists and activation is blocked until qualification rules pass.
- [x] **Export-first**: CSV export (and/or other export targets) works without requiring CRM.
- [ ] **Activation safety**: activation is draft-first with dedupe/suppression warnings and explicit confirmation.
- [ ] **Entitlements**: module gates are enforced server-side; upsell paths exist when a destination module isn’t licensed.
- [x] **Auditability**: key actions are logged (discovery, enrichment, export, activation).
- [ ] **Operational health**: job/status visibility for schedulers and external providers (health endpoint now includes DB readiness for M1 scope).

