# Specialist First Run — Live Ticket (Queue #14)

Reference template: `docs/ai/specialist-execution-template.md`

## 1) Ticket intake (filled)

- Ticket ID: CRM-GA-QUEUE-14-AUTH-SPEED-BASELINE
- Date: 2026-04-15
- Owner: Phani
- Scope summary: Unblock Queue #14 by validating deployed `/api/crm/tasks` behavior, completing authenticated speed baseline sampling, and closing deploy/runtime blockers for final CRM GA evidence capture.
- Modules touched: CRM, Platform/Deploy
- New route/button/page in scope: No (route handler parity and deployment validation only)
- Performance-sensitive: Yes
- Compliance/outbound flow: No

## 2) Required specialist routing (executed)

1. Product Strategist
2. Platform Architect (required; 2+ modules touched)
3. Domain specialists: CRM Specialist + Speed Auditor
4. No-404 QA Specialist (route runtime safety gate for `/api/tasks` and `/api/crm/tasks`)
5. Code Review Specialist

## 3) Specialist invocation outputs

### A) Product Strategist

Input prompt:
"Act as PayAid Product Strategist. For this ticket, produce: (1) problem framing, (2) user outcome, (3) in-scope/out-of-scope, (4) acceptance criteria as pass/fail checks, (5) rollout risk notes. Keep it implementation-ready."

Output:

- Problem framing:
  - CRM GA closeout is blocked because authenticated baseline evidence is incomplete.
  - Runtime parity between `/api/tasks` and `/api/crm/tasks` is inconsistent in deployed environments.
- User outcome:
  - Operators can run `collect:crm-auth-baseline` and obtain complete p95 evidence (contacts, deals, tasks) without manual retries.
- In scope:
  - Deployed route health validation for tasks endpoints.
  - Auth baseline rerun with stable credentials.
  - Evidence capture into closure docs.
- Out of scope:
  - New product UX features.
  - Non-CRM module functional changes.
- Acceptance criteria (pass/fail):
  - PASS if `/api/crm/tasks` responds with valid JSON in target deployment.
  - PASS if baseline artifact includes tasks latency metrics and no parser/runtime failure.
  - PASS if closure log and launch checklist include new evidence links.
  - FAIL if any endpoint remains 404/500 in deployed baseline run.
- Rollout risks:
  - Deploy pipeline instability can block verification despite code-level fix.
  - Environment credential drift can create false negatives.

### B) Platform Architect

Input prompt:
"Act as Platform Architect. Validate cross-module impact for this ticket. Provide: (1) touched modules and contracts, (2) data/API consistency risks, (3) dependency/sequence plan, (4) rollback strategy."

Output:

- Touched modules and contracts:
  - CRM API contract for task list/create parity.
  - Platform deployment contract (Vercel build/deploy completion).
- Data/API consistency risks:
  - Dual endpoints (`/api/tasks`, `/api/crm/tasks`) can drift and produce inconsistent auth/status behavior.
  - Deploy fallback paths (Turbopack -> Webpack) may alter runtime packaging behavior.
- Dependency/sequence plan:
  1. Confirm latest deployment includes route handler parity fix.
  2. Validate endpoint health (`/api/contacts`, `/api/deals`, `/api/crm/tasks`) with authenticated token.
  3. Run `collect:crm-auth-baseline`.
  4. Publish evidence and update closure logs/checklists.
- Rollback strategy:
  - If tasks endpoint regresses, keep Queue #14 blocked and revert to last known good deployment while preserving evidence of failing build/runtime state.

### C1) CRM Specialist

Input prompt:
"Act as [SPECIALIST NAME]. For this ticket provide: (1) implementation checklist by file area, (2) edge cases and business rules, (3) validation tests to run, (4) known pitfalls."

Output:

- Implementation checklist by file area:
  - `apps/dashboard/app/api/crm/tasks/route.ts`: ensure native handler parity with expected task payload/auth behavior.
  - `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md`: record blocker shift and verification status.
  - `docs/LAUNCH_CHECKLIST.md`: attach fresh speed evidence outcome.
- Edge cases/business rules:
  - Must preserve tenant-scoped authorization behavior for task queries.
  - Must return JSON payload on all error paths (avoid HTML upstream parse failures).
- Validation tests:
  - Run baseline collector against deployed environment with valid tenant user.
  - Verify endpoint response format and status under auth.
- Known pitfalls:
  - Testing against localhost while runtime issue exists only in deployment can mislead status.

### C2) Speed Auditor

Input prompt:
"Act as [SPECIALIST NAME]. For this ticket provide: (1) implementation checklist by file area, (2) edge cases and business rules, (3) validation tests to run, (4) known pitfalls."

Output:

- Implementation checklist by file area:
  - `scripts/run-crm-auth-baseline.mjs`: ensure sampler captures p50/p95/p99 for all required endpoints.
  - Closure evidence docs under `docs/evidence/closure/`: ensure metrics are present and parseable.
- Edge cases/business rules:
  - A missing tasks metric invalidates queue completion, even if contacts/deals pass.
  - Keep same environment for all sampled endpoints in one run.
- Validation tests:
  - `npm run collect:crm-auth-baseline`
  - Confirm artifact includes tasks stats and no aborted probe status.
- Known pitfalls:
  - Health probe aborts can masquerade as app-level performance regression.

### D) No-404 QA Specialist

Input prompt:
"Act as No-404 QA Specialist. Build a runtime QA script for this ticket that verifies all touched routes/buttons/pages. Return explicit pass/fail steps including auth, empty/error states, and navigation safety."

Output:

- Runtime checklist:
  1. Login with valid tenant user.
  2. Hit `/api/contacts` and `/api/deals` with bearer token -> expect 200 JSON.
  3. Hit `/api/tasks` and `/api/crm/tasks` with same token:
     - Accept either canonical route for success, but no 404/500 on intended route.
     - Response must be valid JSON.
  4. Trigger baseline run and verify artifact has all endpoint metrics.
  5. Confirm no broken navigation links from CRM tasks surfaces.
- Explicit regression checks:
  - Fail if any route returns HTML body where JSON expected.
  - Fail if auth-denied path returns wrong status semantics.
  - Fail if tasks route behavior differs by environment without documented reason.

### E) Code Review Specialist

Input prompt:
"Act as Code Review Specialist. Review this change for regressions, policy/security risks, and missing tests. Return findings ordered by severity, then residual risks."

Output:

- Findings (severity ordered):
  - Medium: route parity risk persists if both `/api/tasks` and `/api/crm/tasks` are not kept contract-aligned post-deploy.
  - Medium: deploy validation is still an external blocker; without hosted success evidence, queue closure is premature.
  - Low: runtime log capture should remain standardized to prevent ambiguous blocker causes.
- Residual risks:
  - Build-system instability may reintroduce non-code regressions during final closeout.
  - Queue #13 flake watch can distract closure focus if not clearly separated from Queue #14 completion criteria.

## 4) Evidence capture block

- Specialist: Product Strategist
- Run timestamp: 2026-04-15
- Input prompt: template prompt A
- Output artifact path: `docs/ai/specialist-first-run-2026-04-15-queue14.md`
- Decision: pass
- Follow-up actions: use acceptance criteria as queue closure gates

- Specialist: Platform Architect
- Run timestamp: 2026-04-15
- Input prompt: template prompt B
- Output artifact path: `docs/ai/specialist-first-run-2026-04-15-queue14.md`
- Decision: pass
- Follow-up actions: execute dependency sequence before baseline rerun

- Specialist: CRM Specialist
- Run timestamp: 2026-04-15
- Input prompt: template prompt C
- Output artifact path: `docs/ai/specialist-first-run-2026-04-15-queue14.md`
- Decision: pass
- Follow-up actions: confirm `route.ts` parity in hosted deploy and capture evidence

- Specialist: Speed Auditor
- Run timestamp: 2026-04-15
- Input prompt: template prompt C
- Output artifact path: `docs/ai/specialist-first-run-2026-04-15-queue14.md`
- Decision: needs follow-up
- Follow-up actions: rerun collector after stable deploy and verify tasks metrics included

- Specialist: No-404 QA Specialist
- Run timestamp: 2026-04-15
- Input prompt: template prompt D
- Output artifact path: `docs/ai/specialist-first-run-2026-04-15-queue14.md`
- Decision: needs follow-up
- Follow-up actions: execute route script in deployed target and log pass/fail outcomes

- Specialist: Code Review Specialist
- Run timestamp: 2026-04-15
- Input prompt: template prompt E
- Output artifact path: `docs/ai/specialist-first-run-2026-04-15-queue14.md`
- Decision: pass with residual risk
- Follow-up actions: keep queue blocked until hosted evidence is green

## 5) Ship gate (status for this run)

- Product acceptance criteria satisfied: No
- Platform impact validated (or N/A): Partial
- Domain specialist checks complete: Partial
- No-404 QA pass: No
- Code review findings resolved or accepted: Partial
- Checklist/doc updates done: Yes

Result: Do not ship. Queue #14 remains blocked pending hosted deploy validation + complete baseline metrics artifact.

## 6) 30-minute smoke drill outcome

- Drill result: PASS (workflow execution)
- Reason:
  - All 5 required specialist gates were executed with concrete outputs.
  - Evidence artifact captured in `docs/ai/`.
  - Decision gates clearly indicate non-shippable state until runtime blockers are cleared.

## 7) Operational verdict for this first run

AGENTS workflow is functioning for this ticket because routing compliance and artifact capture are complete.  
Release readiness is not yet complete because runtime/deploy evidence for Queue #14 is still blocked.
