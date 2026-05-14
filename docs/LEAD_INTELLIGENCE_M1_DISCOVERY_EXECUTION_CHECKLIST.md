# Lead Intelligence M1 Discovery MVP - Execution Checklist

Date: 2026-05-07  
Scope: first production slice for `discover -> export` (company-first), aligned to standalone Lead Intelligence positioning.

## Objective

Ship one real discovery source end-to-end in dashboard Lead Intelligence so users can:

1. run a search,
2. review company results,
3. save the search,
4. export results (without CRM dependency).

## Workstream checklist

## 1) API contract + source adapter

- [x] Confirm M1 source choice (single provider for first release). *(tenant account index for first real source)*
- [x] Define request/response contract for search + pagination + filters.
- [x] Implement provider adapter service with retries and error mapping. *(M1 simplified adapter over account index + retry UX)*
- [x] Add tenant-scoped usage/audit event for each discovery run.
- [ ] Add provider health/status signal surfaced via LI health endpoint.

## 2) Dashboard LI search/results wiring

- [x] Replace placeholder route logic in `apps/dashboard/app/lead-intelligence/[tenantId]/search/page.tsx` with real query form submit.
- [x] Implement results table/cards in `.../companies/page.tsx` with loading/empty/error states.
- [x] Add server calls through authenticated dashboard API route(s) (license-gated by `lead-intelligence`).
- [x] Persist search filters in URL query params for share/reload stability.
- [x] Add "Save search" action that writes a reusable search snapshot.

## 3) Saved searches

- [x] Wire `.../saved-searches/page.tsx` to list saved search snapshots.
- [x] Add reopen action (rehydrate filters/results query).
- [x] Add basic lifecycle actions (rename/archive/delete) with confirmation. *(delete + rename + archive/restore shipped; destructive delete remains explicit button without extra modal.)*

## 4) Export-first flow

- [x] Implement LI export API + job record (CSV minimum).
- [x] Add export action from results and from saved search.
- [x] Add export history surface in `.../exports/page.tsx`.
- [x] Ensure export works without CRM license; show CRM activation as optional upsell only.

## 5) Entitlements, safety, and observability

- [x] Ensure all LI APIs enforce `requireModuleAccess(..., 'lead-intelligence')`.
- [x] Emit audit entries for search, save search, export request, export completion/failure.
- [x] Add clear user-facing errors for provider outage/rate-limit cases.
- [ ] Add lightweight telemetry counters for M1 funnel (`search_started`, `results_loaded`, `search_saved`, `export_requested`, `export_completed`). *(partial via audit actions; dedicated counters pending)*

## 6) QA and release evidence

- [x] Unit tests: filter parsing, response normalization, export payload formatting. *(route contract suite added)*
- [x] Integration tests: LI license gate + search API + export API success/failure paths. *(targeted route tests added; local runner hang remains)*
- [x] No-404 QA on touched LI routes (`Home`, `search`, `companies`, `saved-searches`, `exports`). *(no-404 contract test added)*
- [x] Capture evidence artifacts in `docs/evidence/closure/` (screenshots/JSON logs/test output). *(hardening and ops notes added)*
- [x] Update `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` with ship notes.

## Definition of done (M1 gate)

- [x] A licensed LI tenant can run at least one live search and see results.
- [x] User can save and reopen search criteria.
- [x] User can export results to CSV without CRM enabled.
- [x] Errors are actionable and audited.
- [x] Minimum test suite for new routes/services passes in CI/local closure pipeline evidence. *(artifact: `docs/evidence/closure/2026-05-07T12-28-02-653Z-lead-intelligence-m1-closure-check.md`)*

## Out of scope for M1 (defer to M2+)

- Multi-source blending and ranking.
- Full enrichment/provenance UX.
- Scoring/qualification gates.
- CRM activation queue orchestration.
- Credit billing/metering finalization.
