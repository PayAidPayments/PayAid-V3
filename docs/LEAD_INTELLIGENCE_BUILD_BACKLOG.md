# PayAid V3 Lead Intelligence - Build Backlog (Sprint-Ready)

## 1) Purpose and source of truth

This backlog converts the Lead Intelligence specs into engineering execution units:

- `docs/LEAD_INTELLIGENCE_DATA_WORKFLOW_SPEC.md`
- `docs/LEAD_INTELLIGENCE_UI_SCREEN_SPEC.md`

It is structured as:

- Epics
- Stories with acceptance criteria
- API contract set
- Test case matrix

## 2) Delivery milestones

- **M1 Foundation**: schemas, core APIs, module shell, audit/events
- **M2 Discovery Core**: ICP + discovery + people + saved searches
- **M3 Intelligence Core**: enrichment + scraping + scoring
- **M4 Activation Core**: activation queue + downstream actions + exports
- **M5 Hardening**: reliability, observability, QA closure

## 3) Epics and stories

## Epic LI-01: Standalone module foundation

### Story LI-01-01: Add standalone Lead Intelligence module navigation

- Scope: module nav entry, route tree, shell layout, route guards.
- Acceptance:
  - Lead Intelligence routes are accessible without CRM sub-navigation.
  - All required screens have route placeholders with no 404s.
  - Tenant context and role checks are enforced.

### Story LI-01-02: Implement core data schemas and migrations

- Scope: create tables/entities for all core objects.
- Acceptance:
  - All entities in spec exist with indexes and enums.
  - FK and relation constraints pass migration checks.
  - Backward-compatible migration scripts are applied.

### Story LI-01-03: Add audit/event framework for lead-intel actions

- Scope: create audit writer + event emitter for module actions.
- Acceptance:
  - Search/job/enrichment/scoring/activation/export events are logged.
  - Each event includes tenant/actor/entity context.
  - Event emission does not block primary workflows on soft failures.

---

## Epic LI-02: ICP and search planning

### Story LI-02-01: ICP Builder CRUD + lifecycle

- Scope: create/list/update/archive/activate `icp_profile`.
- Acceptance:
  - Save draft, activate, clone, archive workflows are functional.
  - Validation enforces minimum targeting anchors.
  - ICP profile is attachable to new searches.

### Story LI-02-02: Industry Explorer presets and playbooks

- Scope: vertical tile catalog, preset mapping, playbook save/reuse.
- Acceptance:
  - Tile selection pre-fills search + ICP defaults.
  - Playbooks can be saved and reused per tenant.
  - Explorer launches into company/people discovery with preserved context.

### Story LI-02-03: Search planning service

- Scope: convert natural language + filters into source query plan.
- Acceptance:
  - `lead_search` transitions draft -> planned -> running.
  - planner produces source-scoped payloads for discovery jobs.
  - invalid queries return actionable validation errors.

---

## Epic LI-03: Live discovery and canonical records

### Story LI-03-01: Source connector registry and health

- Scope: `source_connector` config, status, health checks.
- Acceptance:
  - Connectors have active/degraded/disabled state.
  - health checks update status and diagnostics.
  - source selection in discovery UI is driven by connector status.

### Story LI-03-02: Company discovery orchestration

- Scope: create/execute `discovery_job` per source; write `company_record`.
- Acceptance:
  - per-source jobs run with retries and terminal states.
  - partial failures preserve successful rows.
  - company result grid includes mandatory fields and provenance.

### Story LI-03-03: People discovery orchestration

- Scope: resolve contacts for selected companies and direct queries.
- Acceptance:
  - people discovery writes `contact_record` linked to `company_record`.
  - verification statuses are stored for email/phone.
  - source trace is visible in row details.

### Story LI-03-04: Saved searches and rerun

- Scope: save, clone, archive, rerun, delta mode.
- Acceptance:
  - saved search metadata persists and is listable.
  - rerun creates new discovery jobs under same search.
  - delta mode tags newly discovered records since last run.

---

## Epic LI-04: Dedupe, enrichment, and scraping

### Story LI-04-01: Canonical dedupe/merge engine

- Scope: company and contact dedupe keys, merge policy, lineage.
- Acceptance:
  - duplicate candidates are clustered and merged into canonical records.
  - merge rules follow verification > recency > source reliability.
  - lineage/provenance for merged fields is preserved.

### Story LI-04-02: Enrichment pipeline

- Scope: field-priority enrichment with retries and lockable fields.
- Acceptance:
  - `enrichment_field` entries store source, confidence, verified.
  - enrichment supports company/contact + CSV entry mode.
  - failed field enrichments are retryable without rerunning full batch.

### Story LI-04-03: URL scraping research jobs

- Scope: `scrape_job` lifecycle, templates, extraction mapping.
- Acceptance:
  - bulk URLs execute with status tracking and retry controls.
  - extracted entities can merge/create canonical records.
  - low-confidence output is marked for review queue.

---

## Epic LI-05: Qualification and scoring

### Story LI-05-01: Score computation service

- Scope: compute and persist score components + total.
- Acceptance:
  - breakdown includes fit/intent/completeness/freshness/reliability.
  - score reason text is generated and persisted.
  - rescoring path exists after enrichment/ICP updates.

### Story LI-05-02: Qualification gating and segments

- Scope: threshold rules and qualified/disqualified segmentation.
- Acceptance:
  - only qualified rows are marked activation-eligible.
  - threshold change is role-restricted and audited.
  - UI shows blockers for non-qualified rows.

---

## Epic LI-06: Activation and export

### Story LI-06-01: Activation queue and dry-run preview

- Scope: queue view for qualified rows + destination preview.
- Acceptance:
  - unqualified rows have no activation actions.
  - dry-run preview shows create/update outcomes.
  - partial failures produce retryable failed subset.

### Story LI-06-02: Downstream action executors

- Scope: CRM/email/WhatsApp/calls/appointments/campaign actions.
- Acceptance:
  - destination writes are idempotent.
  - owner assignment is resolved before write.
  - each action emits audit trail with source row ids.

### Story LI-06-03: Export center jobs

- Scope: export creation, status, file retrieval.
- Acceptance:
  - supports CSV/XLSX/CRM import formats.
  - supports segmented exports by score/industry/role/readiness.
  - export job statuses and row counts are visible.

---

## Epic LI-07: UX hardening and release readiness

### Story LI-07-01: Shared components implementation

- Scope: provenance/status/score/activation shared UI components.
- Acceptance:
  - required shared components are reused across screens.
  - component contracts remain consistent with object schemas.

### Story LI-07-02: Observability and telemetry

- Scope: UI + backend event instrumentation and dashboards.
- Acceptance:
  - all required telemetry events are emitted with core dimensions.
  - operators can inspect failed jobs and retries from logs.

### Story LI-07-03: QA closure and no-404 sweep

- Scope: route integrity, acceptance test pack, release checklist closure.
- Acceptance:
  - all required screens pass no-404 checks.
  - critical workflow acceptance tests pass.
  - module-level non-negotiables are validated pre-ship.

## 4) API contract set (v1)

## ICP and presets

- `POST /api/lead-intel/icp-profiles`
- `GET /api/lead-intel/icp-profiles`
- `GET /api/lead-intel/icp-profiles/:id`
- `PATCH /api/lead-intel/icp-profiles/:id`
- `POST /api/lead-intel/icp-profiles/:id/activate`
- `POST /api/lead-intel/icp-profiles/:id/archive`
- `POST /api/lead-intel/icp-profiles/:id/clone`
- `GET /api/lead-intel/industry-playbooks`
- `POST /api/lead-intel/industry-playbooks`

## Search and discovery

- `POST /api/lead-intel/searches`
- `GET /api/lead-intel/searches`
- `GET /api/lead-intel/searches/:id`
- `POST /api/lead-intel/searches/:id/plan`
- `POST /api/lead-intel/searches/:id/run`
- `POST /api/lead-intel/searches/:id/pause`
- `POST /api/lead-intel/searches/:id/cancel`
- `GET /api/lead-intel/searches/:id/results/companies`
- `GET /api/lead-intel/searches/:id/results/contacts`
- `GET /api/lead-intel/discovery-jobs/:id`
- `POST /api/lead-intel/discovery-jobs/:id/retry`

## Connectors and health

- `GET /api/lead-intel/connectors`
- `PATCH /api/lead-intel/connectors/:id`
- `POST /api/lead-intel/connectors/:id/health-check`

## Dedupe and merge

- `GET /api/lead-intel/dedupe/clusters`
- `POST /api/lead-intel/dedupe/merge`
- `POST /api/lead-intel/dedupe/suppress`

## Enrichment and scraping

- `POST /api/lead-intel/enrichment-jobs`
- `GET /api/lead-intel/enrichment-jobs/:id`
- `POST /api/lead-intel/enrichment-jobs/:id/retry`
- `POST /api/lead-intel/scrape-jobs`
- `GET /api/lead-intel/scrape-jobs/:id`
- `POST /api/lead-intel/scrape-jobs/:id/retry`

## Scoring and qualification

- `POST /api/lead-intel/scoring/run`
- `GET /api/lead-intel/scoring/results`
- `PATCH /api/lead-intel/scoring/threshold`
- `POST /api/lead-intel/scoring/rescore`

## Activation and export

- `GET /api/lead-intel/activation-queue`
- `POST /api/lead-intel/activation/preview`
- `POST /api/lead-intel/activation/run`
- `GET /api/lead-intel/activation-rules`
- `POST /api/lead-intel/activation-rules`
- `PATCH /api/lead-intel/activation-rules/:id`
- `POST /api/lead-intel/exports`
- `GET /api/lead-intel/exports/:id`

## Audit and telemetry

- `GET /api/lead-intel/audit-logs`
- `POST /api/lead-intel/events/track`

## 5) Test case matrix

## Contract tests (M0)

- Entity schema validation for all core objects.
- Enum/state transition guard tests for discovery/enrichment/scoring.
- Activation invariant tests: block unqualified rows.
- Provenance and confidence presence tests on required fields.
- API payload validation tests for each endpoint family.

## Service/integration tests (M1/M2)

- Search planning creates valid per-source discovery jobs.
- Discovery retries transient failures and terminates correctly.
- Dedupe merges duplicates and preserves lineage.
- Enrichment updates fields with merge precedence rules.
- Scrape extraction creates/merges canonical records correctly.

## API route tests (M2/M3)

- ICP CRUD and lifecycle route behavior.
- Search run/pause/cancel route behavior.
- Connector health-check route behavior.
- Scoring threshold update permissions and audit.
- Activation preview/run success/partial failure handling.
- Export creation and retrieval behavior.

## UI workflow tests (M3/M4)

- End-to-end flow: discover -> enrich -> qualify -> activate.
- Screen handoff continuity (selected rows/filters/search context).
- Job status rendering for queued/running/partial/failed/retrying/completed.
- Provenance and score reason visibility.
- Activation gating and dry-run preview correctness.

## Non-functional tests (M4/M5)

- High-volume row rendering performance in discovery/queue grids.
- Retry backoff and dead-letter behavior under dependency failure.
- No-404 route scan for all Lead Intelligence screens.
- Role/permission matrix checks for view/analyst/manager/admin.

## 6) Story sizing and sprint suggestion

- **Sprint A (Foundation):** LI-01, LI-02-01, LI-02-03
- **Sprint B (Discovery):** LI-02-02, LI-03, LI-07-01 (partial shared components)
- **Sprint C (Intelligence):** LI-04, LI-05
- **Sprint D (Activation + hardening):** LI-06, LI-07-02, LI-07-03

## 7) Definition of done for module GA

- All non-negotiable rules from data/workflow spec pass.
- All required screens from UI spec are live and no-404 verified.
- Activation path blocks unqualified rows by policy.
- Provenance/confidence is present and user-visible on records.
- End-to-end acceptance flow passes in automated and manual QA.
