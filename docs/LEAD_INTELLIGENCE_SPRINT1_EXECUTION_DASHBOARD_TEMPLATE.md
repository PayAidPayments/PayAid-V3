# PayAid V3 Lead Intelligence - Sprint 1 Execution Dashboard Template

## 1) How to use

- Duplicate this template for each Sprint 1 day update (or maintain one rolling file).
- Update status once at standup start and once at day close.
- Keep evidence links mandatory for any status change to `Done` or `Blocked -> Unblocked`.

Related planning docs:

- `docs/LEAD_INTELLIGENCE_IMPLEMENTATION_TICKETS.md`
- `docs/LEAD_INTELLIGENCE_SPRINT1_EXECUTION_PLAN.md`

## 2) Sprint metadata

- Sprint: `Lead Intelligence Sprint 1`
- Sprint window: `YYYY-MM-DD` to `YYYY-MM-DD`
- Sprint owner: `<PM name>`
- Team lanes: `BE-DATA`, `BE-PLATFORM`, `FE-APP`, `QA-AUTO`, `DEVOPS`
- Daily update timestamp: `YYYY-MM-DD HH:mm`

## 3) Ticket progress board (Sprint 1 scope)

| Ticket | Owner | Status (`Not started`/`In progress`/`Blocked`/`Done`) | % | Dependency ready? | Current focus | Evidence link | Notes |
|---|---|---|---:|---|---|---|---|
| LI-001 | FE-APP | Not started | 0 | Yes |  |  |  |
| LI-002 | BE-DATA | Not started | 0 | Yes |  |  |  |
| LI-003 | BE-PLATFORM | Not started | 0 | No (LI-002) |  |  |  |
| LI-004 | BE-PLATFORM | Not started | 0 | No (LI-002) |  |  |  |
| LI-005 | FE-APP | Not started | 0 | No (LI-001, LI-004) |  |  |  |
| LI-007 | BE-PLATFORM | Not started | 0 | No (LI-002, LI-004) |  |  |  |

## 4) Daily lane status

| Lane | Owner | Today’s plan | Current state | Risk level (`Low`/`Med`/`High`) | Help needed |
|---|---|---|---|---|---|
| BE-DATA |  |  |  | Low |  |
| BE-PLATFORM |  |  |  | Low |  |
| FE-APP |  |  |  | Low |  |
| QA-AUTO |  |  |  | Low |  |
| DEVOPS |  |  |  | Low |  |

## 5) Blocker log

| ID | Raised on | Ticket(s) affected | Blocker summary | Owner | ETA to resolve | Resolution evidence | Status |
|---|---|---|---|---|---|---|---|
| B-001 |  |  |  |  |  |  | Open |
| B-002 |  |  |  |  |  |  | Open |

## 6) Dependency and critical-path tracker

Critical chain: `LI-002 -> LI-004 -> LI-007`

| Dependency | Upstream status | Downstream impact | Action owner | Next check |
|---|---|---|---|---|
| LI-002 -> LI-004 | Not started | ICP API start blocked | BE-DATA |  |
| LI-004 -> LI-005 | Not started | ICP UI lifecycle wiring blocked | BE-PLATFORM |  |
| LI-004 -> LI-007 | Not started | Search planning blocked | BE-PLATFORM |  |

## 7) Acceptance gate tracker

| Gate | Definition | Current status | Evidence | Owner |
|---|---|---|---|---|
| Gate A | LI-001 + LI-002 complete and verified | Not started |  | PM |
| Gate B | LI-004 API routes pass contract tests | Not started |  | QA-AUTO |
| Gate C | LI-005 UI flows pass smoke + lint/tests | Not started |  | FE-APP |
| Gate D | LI-007 planning transitions tested + audited | Not started |  | BE-PLATFORM |
| Gate E | Sprint closure note + carry-over prepared | Not started |  | PM |

## 8) Evidence ledger

Use one row per meaningful execution artifact.

| Date | Ticket | Artifact type (`PR`/`test`/`doc`/`run log`) | Link/path | Result summary |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |

## 9) Daily summary snapshot

### Standup snapshot

- Done yesterday:
  - 
- Planned today:
  - 
- Active blockers:
  - 
- Top risk:
  - 

### End-of-day snapshot

- Completed today:
  - 
- Carryover to tomorrow:
  - 
- Newly raised risks:
  - 
- Decisions made:
  - 

## 10) Change log (append only)

- `YYYY-MM-DD HH:mm` - `<update summary>` - `<owner>`
