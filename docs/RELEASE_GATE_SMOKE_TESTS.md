# Release Gate Smoke Tests (M0/M1/M2)

Use this as the canonical smoke-test entrypoint per milestone gate.

---

## M0 Gate Smoke

- Command: `npm run test:m0`
- Purpose: validates M0 idempotency, signals/workflows/sequences paths, outbox operations, and M0 exit-metrics route behavior.
- Current status: active and used in local CI checks.

## M1 Gate Smoke

- Command: `npm run test:m0`
- Purpose: validates M1 Unibox + Revenue Intelligence route/contract/reconciliation coverage currently bundled in the M0 test config.
- Current status: active and used in local CI checks.

## M2 Gate Smoke

- Command: `npm run test:m2:smoke`
- Purpose: minimal smoke runner for M2; start by adding route tests for marketplace, voice, CPQ, and SDR endpoints as they ship.
- Current status: scaffolded (placeholder test) — add real M2 tests under `__tests__/m2/`.

---

## Operator Checklist

- [ ] Run smoke command for target gate.
- [ ] Capture command output (suites/tests totals + exit code).
- [ ] Archive output with release notes / deployment ticket.
- [ ] If failing, log blocking tests and owning module.
