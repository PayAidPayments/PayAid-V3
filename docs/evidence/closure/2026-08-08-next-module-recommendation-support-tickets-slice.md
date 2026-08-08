# Next module recommendation after Projects close (2026-08-08)

## Closed / frozen (do not reopen)

| Lane | State |
|------|--------|
| Projects delivery operator loop | **CLOSED** (demo-ready for thin loop only) |
| Finance invoice operator loop | **CLOSED** (demo-ready for thin loop only) |
| Appointments operator loop | **CLOSED + FROZEN** |
| Voice Stage 4 | **FROZEN** |
| Email/WhatsApp | **CLOSED** |
| bridge-v2 | **CLOSED** |
| Lead Intelligence | separate |
| Migration auto-deploy | controlled-reconcile only |

Projects close: `docs/evidence/closure/2026-08-05-p3-projects-delivery-operator-loop-closed-demo-ready.md`

## Roadmap scan

| Candidate | Why / why not |
|-----------|----------------|
| Projects expand (Gantt/PM) | **No** — lane closed |
| Finance expand (GST/accounting) | **No** — lane closed |
| CRM / Marketing / HR / Website Builder | Already demo-GO; lower net-new gap |
| Contracts | High shell gap, but e-sign/approval is a bigger bite |
| Inventory | Too wide (warehouses/transfers) for a thin loop |
| **Support tickets** | Create/list exist (`SupportCase`); **no status-transition API**; Tickets Create/Resolve UI stubby — highest remaining create→list→status demo gap |

## Recommended next module

**Support** — ticket operator thin slice (after P3 Finance + Projects).

## Proposed thin slice (needs Product ACCEPTED before implement)

1. Create ticket (optional CRM `contactId`)
2. List tickets for tenant
3. Status: `new → open → resolved|closed` (DB `SupportCase.status` string)
4. Contract → hosted API proof **before** any UI
5. Thin UI only if Tickets hub still stubby after API proof

Preferred surface: slim-safe `/api/support/tickets/slice` (prisma + license only).

### Explicit non-goals

- No Module Switcher promotion / Support primary-tile GA  
- No live email / WhatsApp / chat send  
- No SLA engine, assignment workflows, knowledge-base, Unibox rebuild  
- No Voice Stage 4 / Appointments / Finance / Projects reopen  
- No closed-lane reopen (bridge-v2, LI, migration auto-deploy)

## Product gate

Acceptance request: `docs/evidence/closure/2026-08-08-p4-support-tickets-thin-slice-acceptance-request.md`

**Do not implement until that note is marked ACCEPTED.**
