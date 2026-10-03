# PayAid Internal NEXUS (Phase 1)

Internal Cursor-facing orchestration for the Dev Specialist Pack.  
Adapted from the coordination model in [agency-agents](https://github.com/msitarzewski/agency-agents) (divisions, runbook rosters, handoffs, quality gates).  
**Not** the customer-facing Business Specialist Pack.

## What Phase 1 delivers

| Artifact | Path |
|---|---|
| Divisions catalog | `docs/ai/nexus/divisions.json` |
| Agent registry | `docs/ai/nexus/agents.json` |
| Runbook roster index | `docs/ai/nexus/runbooks.json` |
| Handoff templates | `docs/ai/nexus/handoff-templates.md` |
| Ship gate rules | `docs/ai/nexus/ship-gate.md` |
| Runbook playbooks | `docs/ai/nexus/runbooks/*.md` |
| Integrity check | `npm run check:nexus-runbooks` |

## Divisions

1. **Product** — Product Strategist, Sprint Prioritizer, Feedback Synthesizer, Orchestrator  
2. **Platform** — Platform Architect, Software Architect, Database Optimizer  
3. **Delivery** — CRM, Marketing, Finance/GST, Workflow, UX Cleanup  
4. **Quality** — No-404 QA, Evidence Collector, API Tester, Code Reviewer, Reality Checker  
5. **Reliability** — Speed Auditor, SRE, Incident Response Commander  

## Runbooks

| Slug | Use when |
|---|---|
| `new-page-or-route` | New/changed route, button, or page |
| `schema-or-billing-change` | Prisma/schema, finance, GST, billing |
| `performance-pass` | Performance-sensitive work |
| `release` | Go / no-go before production ship |
| `production-incident` | Live incident response |

## How to run a ticket

1. Intake using `docs/ai/specialist-execution-template.md`.
2. Pick one runbook slug from the table above.
3. Activate orchestrator:

```text
Act as PayAid Agents Orchestrator for runbook <slug>.
Ticket: <id>
Scope: <summary>
Modules touched: <list>
New route/button/page: Yes/No
Schema/billing: Yes/No
Performance-sensitive: Yes/No

Enforce docs/ai/nexus/runbooks.json roster order.
Require handoffs per docs/ai/nexus/handoff-templates.md.
Block ship per docs/ai/nexus/ship-gate.md when a required gate is missing.
```

4. Run each required agent. Save handoffs under `docs/evidence/nexus/<ticket-id>/`.
5. Fill the ship checklist in `docs/ai/nexus/ship-gate.md`.
6. Append one Update log line in `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` for significant work.

## Relation to existing docs

- `AGENTS.md` — pack boundary and mandatory checkpoints  
- `docs/ai/internal-workflow.md` — short daily workflow; now routes through NEXUS  
- `docs/ai/specialist-execution-template.md` — prompts and evidence blocks  
- `docs/ai/agents/*/SKILL.md` — project skills referenced by runbooks  

## Related packs

- Customer specialists (Phase 2): `docs/ai/customer/README.md`

## Phase 1 out of scope

- Customer/in-product specialists (see Phase 2)  
- Installing upstream agency-agents into `.cursor/rules`  
- Autonomous outbound send or payments  
- Runtime orchestrator service (Phase 4)

## Phase 1 done criteria

- [x] Catalog + agent registry committed under `docs/ai/nexus/`
- [x] Five runbooks with roster, activation, handoffs, and ship blockers
- [x] Missing required gate blocks ship (documented + checklist)
- [x] Ticket can be started from a runbook slug via the orchestrator prompt
- [x] `npm run check:nexus-runbooks` validates slug integrity
