# Specialist Execution Template (AGENTS in Action)

This template turns `AGENTS.md` into a repeatable execution workflow you can run on every meaningful ticket.

## 1) Ticket intake (fill first)

- Ticket ID:
- Date:
- Owner:
- Scope summary:
- Modules touched:
- New route/button/page in scope: Yes/No
- Performance-sensitive: Yes/No
- Compliance/outbound flow: Yes/No

## 2) Required specialist routing

Use this routing exactly as written:

1. Product Strategist (always for meaningful work)
2. Platform Architect (required if 2+ modules)
3. Domain specialist (CRM, Marketing, Finance/GST, Workflow, UX, Speed)
4. No-404 QA Specialist (required for any new route/button/page)
5. Code Review Specialist (required before shipping)

## 3) Copy-paste invocation prompts

Use these prompts in order and paste outputs under "Evidence".

### A) Product Strategist

Prompt:
"Act as PayAid Product Strategist. For this ticket, produce: (1) problem framing, (2) user outcome, (3) in-scope/out-of-scope, (4) acceptance criteria as pass/fail checks, (5) rollout risk notes. Keep it implementation-ready."

Expected output:
- Clear scope boundary
- Testable acceptance criteria

### B) Platform Architect (if 2+ modules)

Prompt:
"Act as Platform Architect. Validate cross-module impact for this ticket. Provide: (1) touched modules and contracts, (2) data/API consistency risks, (3) dependency/sequence plan, (4) rollback strategy."

Expected output:
- Cross-module contract safety plan
- Dependency order and rollback path

### C) Domain Specialist (pick one or more)

Prompt:
"Act as [SPECIALIST NAME]. For this ticket provide: (1) implementation checklist by file area, (2) edge cases and business rules, (3) validation tests to run, (4) known pitfalls."

Expected output:
- Domain-specific implementation/validation notes

### D) No-404 QA Specialist

Prompt:
"Act as No-404 QA Specialist. Build a runtime QA script for this ticket that verifies all touched routes/buttons/pages. Return explicit pass/fail steps including auth, empty/error states, and navigation safety."

Expected output:
- Browser/runtime checklist with route-level coverage
- Explicit regression checks for missing/broken routes

### E) Code Review Specialist

Prompt:
"Act as Code Review Specialist. Review this change for regressions, policy/security risks, and missing tests. Return findings ordered by severity, then residual risks."

Expected output:
- Findings-first review
- Residual risk list

## 4) Evidence capture block

Fill this in for each specialist run.

- Specialist:
- Run timestamp:
- Input prompt:
- Output artifact path:
- Decision: pass / needs follow-up
- Follow-up actions:

## 5) Ship gate (all must be Yes)

- Product acceptance criteria satisfied:
- Platform impact validated (or N/A):
- Domain specialist checks complete:
- No-404 QA pass:
- Code review findings resolved or accepted:
- Checklist/doc updates done:

If any item is "No", do not ship.

## 6) 30-minute smoke drill (to prove AGENTS is working)

Run once weekly on a real ticket:

1. Pick one ticket touching 2 modules and one new route/button.
2. Execute all 5 specialists using the prompts above.
3. Record artifacts in `docs/ai/`.
4. Log outcome in `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` Update log.
5. Mark drill result:
   - PASS: all five gates complete with evidence.
   - FAIL: any missing artifact, generic output, or unresolved high-severity finding.

## 7) Definition of "specialists are really working"

You can call the AGENTS system operational when, across 3 to 5 consecutive tickets:

- Routing compliance is 100%.
- Each required specialist has a concrete artifact.
- No-404 QA catches route regressions before release.
- Code Review Specialist findings are tracked to closure.
- Update log is kept current for each significant step.
