# PayAid V3 — Testing Guide

## Run tests

- `npm test` — all tests
- `npm test -- __tests__/phase1a/lead-score-metrics-retail.test.ts` — Phase 1A suite
- `npm test -- --testPathPattern=phase1a` — by pattern

## Covered

- **Phase 1A:** Lead score JSON parsing, CRM conversion rate, retail INR calculation (see `__tests__/phase1a/`).
- **Other:** `__tests__/ai/customer-insights.test.ts`, tax, currency, e2e CRM, voice-agent.

## Adding tests

- Put Phase 1A/1B tests under `__tests__/phase1a/` or `__tests__/phase1b/`.
- Use `@jest/globals` (describe, it, expect). Mock `prisma` and `requireModuleAccess` for API tests if needed.
