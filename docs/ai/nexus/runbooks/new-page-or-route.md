# Runbook: `new-page-or-route`

**Mode:** NEXUS-Sprint  
**Use when:** adding or changing a route, button, page, or nav entry.

## Roster

| Order | Agent | Activation |
|---|---|---|
| 0 | Agents Orchestrator | always |
| 1 | Product Strategist | always |
| 2 | Platform Architect | if 2+ modules |
| 3 | Domain specialist | as needed |
| 4 | Evidence Collector | always |
| 5 | No-404 QA | always |
| 6 | Code Review Specialist | always |

## Ship blocked without

`product-strategist`, `no-404-qa`, `code-reviewer`

## Steps

1. **Orchestrator** records runbook slug, modules, and whether Platform Architect is required.
2. **Product Strategist** writes acceptance criteria for the page/route outcome.
3. **Platform Architect** (if 2+ modules) confirms contracts, tenant paths, and rollback.
4. **Domain specialist** implements against module rules (no new `/dashboard/*` feature homes).
5. **Evidence Collector** captures before/after routes and command output.
6. **No-404 QA** verifies every touched route/button/page including auth/empty/error.
7. **Code Review** returns approve / approve-with-followups / block.

## Architecture hygiene reminders

- Decoupled `/{module}/{tenant}/…` paths only
- Incomplete shells stay `navVisibility: 'hidden'` / coming-soon
- Update checklist update-log for significant work

## Exit

Ship only when ship-gate checklist is all Yes/N/A and No-404 + Code Review are `pass`.
