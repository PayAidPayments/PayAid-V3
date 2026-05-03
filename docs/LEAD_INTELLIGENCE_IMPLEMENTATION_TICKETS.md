# PayAid V3 Lead Intelligence - Implementation Tickets

## 1) Planning assumptions

- Source specs:
  - `docs/LEAD_INTELLIGENCE_DATA_WORKFLOW_SPEC.md`
  - `docs/LEAD_INTELLIGENCE_UI_SCREEN_SPEC.md`
  - `docs/LEAD_INTELLIGENCE_BUILD_BACKLOG.md`
- Estimation scale: Fibonacci story points (`1, 2, 3, 5, 8, 13`).
- Owners are role placeholders and can be remapped to team members.

## 2) Owner roles

- `BE-PLATFORM`: backend/platform engineer
- `BE-DATA`: backend/data engineer
- `FE-APP`: frontend application engineer
- `FE-DESIGN`: frontend/design systems engineer
- `QA-AUTO`: QA automation engineer
- `DEVOPS`: release/infra engineer
- `PM`: product owner / delivery lead

## 3) Ticket board

## Foundation and module shell

### LI-001 - Standalone module route tree and nav entry

- Owner: `FE-APP`
- Points: `5`
- Depends on: none
- Scope:
  - Add Lead Intelligence top-level nav entry
  - Create route skeletons for all required screens
  - Apply tenant context + role gate wrappers
- Done when:
  - All screens resolve with no 404
  - Module is not nested under CRM routes
  - Role-aware route access checks exist

### LI-002 - Core schema migrations for Lead Intelligence entities

- Owner: `BE-DATA`
- Points: `8`
- Depends on: none
- Scope:
  - Create DB entities from data/workflow spec
  - Add indexes/enums/FKs
  - Add migration and rollback notes
- Done when:
  - Migration applies cleanly in dev/staging
  - Schema includes all required objects
  - Integrity constraints validated by tests

### LI-003 - Audit/event baseline for Lead Intelligence flows

- Owner: `BE-PLATFORM`
- Points: `5`
- Depends on: `LI-002`
- Scope:
  - Add module audit event helpers
  - Emit search/job/enrichment/scoring/activation/export events
- Done when:
  - Event payloads include tenant/actor/entity references
  - Audit rows are queryable by module

---

## ICP and planning

### LI-004 - ICP Builder API (CRUD + lifecycle)

- Owner: `BE-PLATFORM`
- Points: `5`
- Depends on: `LI-002`
- Scope:
  - `icp_profile` create/list/get/update
  - activate/archive/clone flows
  - validation rules
- Done when:
  - API contract routes pass tests
  - invalid payloads fail with actionable errors

### LI-005 - ICP Builder UI

- Owner: `FE-APP`
- Points: `5`
- Depends on: `LI-001`, `LI-004`
- Scope:
  - Full ICP form sections
  - draft/activate/archive/clone actions
  - score-impact preview shell
- Done when:
  - UI maps 1:1 to `icp_profile` fields
  - lifecycle actions are functional

### LI-006 - Industry Explorer presets and playbook persistence

- Owner: `FE-APP`
- Points: `5`
- Depends on: `LI-001`, `LI-004`
- Scope:
  - Industry tile explorer
  - preset-to-query mapping
  - save/reuse playbook actions
- Done when:
  - tile click launches prefilled discovery context
  - playbooks persist per tenant

### LI-007 - Search planning service (NL + structured)

- Owner: `BE-PLATFORM`
- Points: `8`
- Depends on: `LI-002`, `LI-004`
- Scope:
  - Search create + planning routes
  - query plan output for source jobs
  - planner state transitions
- Done when:
  - draft -> planned -> running is enforced
  - per-source query payloads are generated

---

## Discovery and canonical records

### LI-008 - Source connector registry and health checks

- Owner: `BE-PLATFORM`
- Points: `5`
- Depends on: `LI-002`
- Scope:
  - connector list/update endpoints
  - health-check command endpoint
  - connector status model integration
- Done when:
  - connector status updates appear in API
  - failed checks are diagnosable

### LI-009 - Company discovery orchestration and job lifecycle

- Owner: `BE-PLATFORM`
- Points: `13`
- Depends on: `LI-002`, `LI-007`, `LI-008`
- Scope:
  - create/run/retry/cancel discovery jobs
  - write canonical company rows
  - partial/retry/fail state handling
- Done when:
  - per-source job status is persisted
  - partial failures do not drop successful records

### LI-010 - Company Discovery screen and results grid

- Owner: `FE-APP`
- Points: `8`
- Depends on: `LI-001`, `LI-009`
- Scope:
  - prompt + filter + source scope controls
  - required result columns
  - provenance drilldown drawer
- Done when:
  - required columns and job chips render correctly
  - row expansion shows source evidence

### LI-011 - People discovery orchestration and contact resolution

- Owner: `BE-PLATFORM`
- Points: `8`
- Depends on: `LI-009`
- Scope:
  - people discovery jobs
  - contact canonicalization + verification statuses
  - company linkage
- Done when:
  - contacts are linked to company records
  - verification status is persisted

### LI-012 - People Discovery screen and contact grid

- Owner: `FE-APP`
- Points: `5`
- Depends on: `LI-001`, `LI-011`
- Scope:
  - input modes + results grid + row actions
  - suppress invalid matches workflow
- Done when:
  - required contact fields and source trace are visible
  - row actions trigger backend updates

### LI-013 - Saved Searches list, clone, rerun, delta mode

- Owner: `FE-APP`
- Points: `5`
- Depends on: `LI-007`, `LI-009`, `LI-001`
- Scope:
  - saved search management UI
  - rerun + delta behavior wiring
- Done when:
  - run-to-run comparison and delta markers are available

---

## Dedupe, enrichment, scraping

### LI-014 - Canonical dedupe/merge service

- Owner: `BE-DATA`
- Points: `8`
- Depends on: `LI-009`, `LI-011`
- Scope:
  - company/contact dedupe keys
  - merge policy + lineage recording
  - suppression handling
- Done when:
  - duplicate merges preserve provenance
  - merge policy precedence is test-covered

### LI-015 - Enrichment pipeline backend

- Owner: `BE-DATA`
- Points: `13`
- Depends on: `LI-014`
- Scope:
  - enrichment jobs with field priorities
  - `enrichment_field` persistence
  - retry failed fields support
- Done when:
  - enrichment is resumable/retryable
  - verification/confidence values are persisted

### LI-016 - Data Enrichment screen

- Owner: `FE-APP`
- Points: `8`
- Depends on: `LI-001`, `LI-015`
- Scope:
  - enrichment setup UI
  - progress/error queue
  - before/after compare view
- Done when:
  - user can run, monitor, and retry enrichment batches

### LI-017 - Web scraping job service and template parser routing

- Owner: `BE-DATA`
- Points: `8`
- Depends on: `LI-014`
- Scope:
  - `scrape_job` run/retry lifecycle
  - template dispatching
  - extracted entity mapping
- Done when:
  - bulk URL jobs execute with terminal states
  - extracted rows can merge/create canonical records

### LI-018 - Web Scraping Research screen

- Owner: `FE-APP`
- Points: `5`
- Depends on: `LI-001`, `LI-017`
- Scope:
  - URL input/bulk upload/template chooser
  - extraction result + merge action UI
- Done when:
  - scraping states and merge actions are visible and functional

---

## Scoring and qualification

### LI-019 - Scoring service and qualification thresholds

- Owner: `BE-DATA`
- Points: `8`
- Depends on: `LI-015`, `LI-017`, `LI-004`
- Scope:
  - compute score components and totals
  - persist `fit_score` and reasons
  - qualification threshold enforcement
- Done when:
  - qualified/disqualified flags are reproducible by rules
  - rescore endpoint works for changed records

### LI-020 - Qualification & Scoring screen

- Owner: `FE-APP`
- Points: `5`
- Depends on: `LI-001`, `LI-019`
- Scope:
  - score distribution + breakdown table
  - threshold controls (permission-aware)
  - qualification segments
- Done when:
  - score reason and blockers are visible per row
  - threshold updates are role-gated

---

## Activation and export

### LI-021 - Activation rules API and destination executors

- Owner: `BE-PLATFORM`
- Points: `13`
- Depends on: `LI-019`, `LI-003`
- Scope:
  - activation rule CRUD
  - preview and run endpoints
  - idempotent destination writes
- Done when:
  - unqualified records are blocked by server policy
  - partial activation failures are recoverable and logged

### LI-022 - Activation Queue screen and bulk action UX

- Owner: `FE-APP`
- Points: `8`
- Depends on: `LI-001`, `LI-021`, `LI-020`
- Scope:
  - queue grid + bulk select
  - activation preview modal
  - retry failed subset flow
- Done when:
  - dry-run preview reflects create/update actions
  - bulk activation handles partial failures clearly

### LI-023 - Export job service

- Owner: `BE-PLATFORM`
- Points: `5`
- Depends on: `LI-019`
- Scope:
  - export create/status/download references
  - segmented filters
- Done when:
  - CSV/XLSX/CRM formats are generated
  - status tracking is visible to API consumers

### LI-024 - Export Center screen

- Owner: `FE-APP`
- Points: `3`
- Depends on: `LI-001`, `LI-023`
- Scope:
  - export creation form + status list
  - artifact download actions
- Done when:
  - user can create and retrieve exports by segment

---

## Shared components, QA, and release hardening

### LI-025 - Shared Lead Intelligence UI components

- Owner: `FE-DESIGN`
- Points: `5`
- Depends on: `LI-010`, `LI-012`, `LI-016`, `LI-018`, `LI-020`, `LI-022`
- Scope:
  - provenance, status chips, qualification pill, score popover
  - activation preview + merge drawer patterns
- Done when:
  - shared component usage replaces one-off variants
  - visual and behavior consistency is enforced

### LI-026 - Telemetry instrumentation and dashboards

- Owner: `BE-PLATFORM` + `FE-APP`
- Points: `5`
- Depends on: `LI-003`, `LI-022`, `LI-024`
- Scope:
  - emit all required UI/back-end events
  - add operator-visible monitoring hooks
- Done when:
  - event stream covers end-to-end funnel
  - failure/retry visibility is available

### LI-027 - API and service integration test suite

- Owner: `QA-AUTO`
- Points: `8`
- Depends on: `LI-004`..`LI-024`
- Scope:
  - contract tests, API route tests, workflow integration tests
  - activation invariants and dedupe/provenance coverage
- Done when:
  - critical path tests pass in CI
  - known edge-case regressions are pinned by tests

### LI-028 - UI E2E and no-404 release gate

- Owner: `QA-AUTO` + `DEVOPS`
- Points: `5`
- Depends on: `LI-001`, `LI-005`, `LI-006`, `LI-010`, `LI-012`, `LI-016`, `LI-018`, `LI-020`, `LI-022`, `LI-024`
- Scope:
  - E2E flow tests across required screens
  - no-404 module route gate
- Done when:
  - discover -> enrich -> qualify -> activate E2E flow passes
  - all module routes pass no-404 checks

## 4) Dependency summary

Critical chain:

`LI-002 -> LI-004 -> LI-007 -> LI-009 -> LI-014 -> LI-015/LI-017 -> LI-019 -> LI-021 -> LI-022`

Parallelizable lanes:

- UI shell/forms lane: `LI-001`, `LI-005`, `LI-006`
- Discovery UI lane: `LI-010`, `LI-012`, `LI-013`
- Enrichment/scrape UI lane: `LI-016`, `LI-018`
- Export lane: `LI-023`, `LI-024`

## 5) Suggested sprint cut

- **Sprint 1:** `LI-001`, `LI-002`, `LI-003`, `LI-004`, `LI-005`, `LI-007`
- **Sprint 2:** `LI-006`, `LI-008`, `LI-009`, `LI-010`, `LI-011`, `LI-012`, `LI-013`
- **Sprint 3:** `LI-014`, `LI-015`, `LI-016`, `LI-017`, `LI-018`, `LI-019`, `LI-020`
- **Sprint 4:** `LI-021`, `LI-022`, `LI-023`, `LI-024`, `LI-025`, `LI-026`, `LI-027`, `LI-028`

## 6) Release readiness checklist for ticket closure

- All tickets have linked tests and evidence artifacts.
- Non-negotiables from Lead Intelligence specs are explicitly validated.
- Activation policy guards are tested at API and UI layers.
- Provenance/confidence/dedupe behavior is user-visible and audited.
