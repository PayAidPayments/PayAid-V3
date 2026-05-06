# Projects & Service — Full Delivery Operating Module

**Status:** Functional specification (implementation blueprint)  
**Audience:** Product, engineering, QA  
**Principle:** Time is one signal inside **tasks → milestones → phases → projects → clients → revenue**, not an isolated list.

**External references (user-provided):** [Resource Guru — project time tracking](https://resourceguruapp.com/blog/time-management/project-time-tracking), [Teamwork — professional services PM](https://www.teamwork.com/blog/professional-services-project-management/), [ProjectManager — acceptance criteria](https://www.projectmanager.com/blog/acceptance-criteria-project-management), [Toggl](https://toggl.com), [monday.com — time tracking](https://monday.com/blog/project-management/time-tracking/), [TWProject](https://twproject.com/blog/the-best-time-tracking-software/).

---

## 0. Current state (PayAid V3 codebase)

| Area | Today |
|------|--------|
| **Schema** | `Project`, `ProjectTask`, `ProjectMember`, `ProjectBudget`, `TimeEntry`, **`ProjectPhase`**, **`ProjectMilestone`** ([`prisma/schema.prisma`](../prisma/schema.prisma)). **P0 fields shipped:** `Project` — `health`, `billingModel`, `currency`, `dealId`, `deliveryType`, `serviceCategory`; `ProjectTask` — `phaseId`, `milestoneId` (FKs); `TimeEntry` — `approvalStatus`, `source`, `isAdhoc`, `costRate`. **P2 partial:** plan phases + milestones persisted; APIs + Plan tab CRUD; migration `20260503193000_project_phases_milestones`. |
| **Routes** | Dashboard: `apps/dashboard/app/projects/[tenantId]/` — Home, Projects, Tasks, Time, Gantt, Kanban, Reports (shared `AppShell` nav; Time last). |
| **Gaps vs target** | No `Deliverable`, `ChangeRequest`, `ServicePackage`, `ProjectRisk`; milestone **draft** invoice is **₹0 placeholder** (not line-item time / project rates); no structured **line-item** time ↔ invoice; `Project.contractId` / normalized **`type`** enum not wired end-to-end. **Phases/milestones + plan links:** DB, APIs, Plan tab, Kanban + list; **Gantt** (single project). **Shipped in app/API:** deal→project (CRM CTA + create), time submit/approve/reject + **mark invoiced** (PATCH) with optional **`invoiceId`** (Finance picker + paste on Time), `approvableByViewer` / `markInvoicedByViewer`, portfolio stats + at-risk + **`?atRisk=1`**, **Reports → billable pipeline** (approved unbilled vs invoiced), project detail + CRM + Finance deep link, **PATCH** `/api/projects/[id]` (delivery + core fields + audit), overview editors, `AuditLog` on project create / time flows. |

This spec treats the **target model** as normative and sequences delivery in **phases** so schema and UI can evolve without a single “big bang”.

---

## 1. Functional specification

### 1.1 Purpose

**Projects & Service** is the tenant-scoped system where **won commercial work becomes a measurable delivery plan** that connects:

- **CRM** (account, deal, proposal) → **Project** (scope, timeline, budget, billing model)  
- **Execution** (phases, milestones, tasks, blockers) → **Time & utilization** → **Approvals** → **Finance** (invoices, margin, overages)

It must serve **software delivery**, **agency / consulting**, and **outsourcing / managed services** without separate “modes”; behavior is driven by **project type**, **billing model**, and **templates**.

### 1.2 Every row is a “work object”

| Object | Role |
|--------|------|
| **Project** | Delivery container: client, owner, billing, timeline, health |
| **Project phase** | Planning structure (e.g. Discovery → Build → UAT → Close) |
| **Milestone** | Checkpoint; may require approval; may **trigger billing** |
| **Task** | Unit of execution; holds estimates, dependencies, time rollups |
| **Time entry** | Effort signal; **must** resolve project (+ task unless ad hoc policy) |
| **Deliverable** | Client-visible outcome (doc, release, sign-off pack) |
| **Change request** | Controlled scope / time / cost delta |
| **Service package** | Retainer / recurring capacity model (outsourcing) |
| **Project risk** | Risk / blocker with severity and mitigation |

**Inheritance:** Child objects display and store **resolved context** (client name, project code, billing flags) for list views and APIs; authoritative FKs remain on parents.

### 1.3 Four questions (every surfaced row)

1. **What is this work?** — Name, type, scope snippet, linked deal/deliverable/milestone.  
2. **Who owns it?** — Owner, assignee, approver (role-based).  
3. **What should happen next?** — Status, due date, dependency gate, approval step.  
4. **How does it affect revenue, delivery, capacity?** — Budget consumed, billable hours, margin hint, SLA clock, overrun flags.

### 1.4 Non-functional

- **Multi-tenant:** All entities `tenantId`; RLS / API guards consistent with CRM.  
- **Audit:** Create/update on project, milestone completion, time approval, invoice trigger.  
- **Performance:** Portfolio dashboard paginated; rollups via materialized summaries or incremental aggregates where needed.

---

## 2. Object model (target)

### 2.1 Canonical entities (logical)

Names use **snake_case** for spec; Prisma typically **camelCase** — map in migrations.

#### `project`

| Field | Type | Notes |
|-------|------|--------|
| `id` | uuid | |
| `tenant_id` | uuid | |
| `client_id` | uuid | FK → Account/Contact (existing `clientId`) |
| `deal_id` | uuid? | **Won** deal that created or linked this project |
| `type` | enum | e.g. `software_delivery`, `agency`, `outsourcing`, `internal` |
| `service_category` | string? | Service line / practice |
| `name`, `description` | text | |
| `status` | enum | Align with UI: planning, active, on_hold, completed, cancelled |
| `health` | enum | `green`, `amber`, `red` (+ rules in §8) |
| `start_date`, `end_date` | date | |
| `owner_id` | uuid | |
| `budget` | decimal? | Optional top-line; detail in `project_budget_lines` |
| `currency` | string | ISO 4217 |
| `billing_model` | enum | `time_materials`, `fixed_fee`, `milestone`, `retainer`, `hybrid`, `non_billable` |
| `contract_id` | uuid? | FK → contract / SOW record when exists |
| `created_from_deal_id` | uuid? | Same as `deal_id` or template run id |
| `code` | string? | Human-readable project code |
| `created_at`, `updated_at` | timestamptz | |

**Today:** Partially covered by `Project`; add missing columns or `ProjectExtension` JSON until normalized.

#### `project_phase`

| Field | Type |
|-------|------|
| `id`, `tenant_id`, `project_id` | uuid |
| `name` | string |
| `sort_order` | int |
| `status` | enum |
| `start_date`, `end_date` | date? |

#### `milestone`

| Field | Type |
|-------|------|
| `id`, `tenant_id`, `project_id`, `phase_id`? | uuid |
| `name` | string |
| `due_date` | date |
| `status` | enum |
| `approval_required` | bool |
| `billing_trigger` | enum? | `none`, `on_complete`, `on_approve`, `percent_complete` |
| `billing_amount` / link to **invoice milestone** | optional |

#### `task` (extends current `ProjectTask`)

| Field | Type |
|-------|------|
| Existing + `phase_id`, `milestone_id` | uuid? |
| `title` / `name` | unified naming in API |
| `estimate_hours`, `actual_hours` | decimal | Roll `TimeEntry` into `actual_hours` or computed |
| `dependency_ids` | many-to-many or keep single `dependsOnTaskId` + phase 2 for graph |
| `checklist_json` | jsonb | |
| `is_blocked` / `blocker_reason` | optional |

#### `time_entry` (extends current `TimeEntry`)

| Field | Type |
|-------|------|
| Existing + `duration_minutes` | int | Derive from `hours` for migration compatibility |
| `approval_status` | enum | `draft`, `submitted`, `approved`, `rejected`, `corrected` |
| `cost_rate` | decimal? | For margin |
| `source` | enum | `timer`, `manual`, `import`, `adhoc` |
| `is_adhoc` | bool | If true: **no task** allowed only with policy + approver |
| `submitted_at`, `approved_by_id`, `approved_at` | optional |

#### `deliverable`

| Field | Type |
|-------|------|
| `id`, `tenant_id`, `project_id` | uuid |
| `name`, `file_asset_id`? | |
| `version` | string? |
| `status`, `client_approval_status` | enum |

#### `change_request`

| Field | Type |
|-------|------|
| `id`, `tenant_id`, `project_id` | uuid |
| `title`, `scope_impact`, `time_impact`, `cost_impact` | text / decimal |
| `approval_status` | enum |

#### `service_package`

| Field | Type |
|-------|------|
| `id`, `tenant_id`, `client_id` | uuid |
| `name`, `billing_type`, `monthly_hours`, `sla`, `renewal_date`, `overage_rules` | mixed |

*Link projects to packages via `project.service_package_id` or join table if many-to-many.*

#### `project_risk`

| Field | Type |
|-------|------|
| `id`, `tenant_id`, `project_id` | uuid |
| `type`, `severity`, `description`, `mitigation`, `status` | |

### 2.2 Relationships (summary)

```
Deal (won) ──► Project ◄──► ServicePackage
     │
     ├── phases ──► milestones ──► tasks ◄──► time_entries
     ├── deliverables
     ├── change_requests
     ├── risks
     └── budgets / billing triggers ──► Invoice (draft)
```

---

## 3. Workflow map

### Workflow A — Deal → project

1. Deal **won** (or user selects template + client).  
2. **Create project** wizard: type, billing model, currency, owner, dates.  
3. **Apply service template** → phases, milestones, default tasks, checklist seeds.  
4. **Team**: add `project_member` rows; notify.  
5. **Billing**: attach contract/SOW ref or milestone schedule.  
6. **Time**: enabled; optional “first week” tasks pre-assigned.

### Workflow B — Execution

1. Tasks move **planned → active → review → done** (configurable).  
2. Time logged **on task** (or ad hoc with approval path).  
3. **Health** recalculated (schedule slip, budget %, open blockers, SLA breach).  
4. **Escalations** (optional): overdue milestone → notify owner + PM.

### Workflow C — Time approval

1. User **submits** week (or entries auto-submit per policy).  
2. Manager filters **billable / non-billable**, disputes → **correction request**.  
3. **Approved** entries lock for billing; feed **utilization** and **margin** rollups.

### Workflow D — Billing trigger

1. **Milestone** completed + approved **or** hours threshold / retainer burn rate.  
2. Create **invoice draft** (Finance module) with line items from project rules.  
3. Finance sends; **actual revenue** linked back for project margin.

---

## 4. Screen-by-screen UI spec

### 4.1 Projects Home (landing)

**Purpose:** Portfolio command center, not empty charts.

**Sections:**  
- **KPI strip:** active count, at-risk, over-budget, due this week, billable MTD, non-billable MTD, utilization snapshot.  
- **At-risk / overdue:** table or cards (project, reason, owner, CTA **Open**).  
- **Upcoming milestones** (7 days).  
- **Unapproved time** (count + hours + **Review**).  
- **Next actions** (assigned to current user across projects).  
- **Recent projects** (rich rows: client, health, progress, budget %).  
- **Primary CTAs:** Create project, Browse templates.

**Interactions:** Every row **navigates**; KPIs drill down to filtered **All Projects**.

### 4.2 All Projects

**Table / card toggle.** Columns: client, name, status, **health**, due, owner, progress, **hours spent / remaining** (from rollups), **budget %**, next milestone, **blockers** (icon + tooltip).

**Filters:** client, owner, type, service line, status, billable focus, overdue, health, date range, value band.

### 4.3 Project detail (tabbed shell)

| Tab | Contents |
|-----|-----------|
| **Overview** | Summary, health rationale, key dates, client, deal link, billing model, KPI strip |
| **Plan** | Phases + milestones (timeline mini) |
| **Tasks** | Embedded list/board filtered to this project |
| **Time** | Task-linked log + filters; sum by week |
| **Budget** | Budget vs actual vs forecast; categories (`ProjectBudget` + new lines) |
| **Billing** | Milestone schedule, invoice drafts, retainer burn |
| **Files** | Links to Drive / attachments (reuse platform doc patterns) |
| **Activity** | Audit + comments feed |
| **Risks** | Risk register + blockers |
| **Clients** | Stakeholders, sign-off contacts |
| **Approvals** | Pending milestone + time approvals |

**Empty states:** Guided CTAs (add phase, apply template, link deal).

### 4.4 Tasks (global + project-scoped)

Board / list / table: assignee, due, priority, status, **estimate**, **actuals**, dependency indicator, **comments count**, **time logged** column.

**Row actions:** Open, Log time, Reassign, Mark blocked.

### 4.5 Time tracking (reworked)

**Not** a bare list. **Layout:**

- **Left context:** project + task tree or picker (required unless ad hoc).  
- **Main:** entries table with **approval status**, billable, rate, duration, who, when, notes.  
- **Right / top:** week navigator, **timer** (start/stop → creates draft entry on selected task).  
- **Sub-views:** Approval queue, Weekly timesheet, Utilization summary (links to reporting).

**Row actions:** Edit (if permitted), Submit, Approve/Reject (role), **Open task** / **Open project**.

### 4.6 Gantt / timeline

Phases + milestones + tasks; dependencies; **slippage** vs baseline; critical path (phase 2 if full CPM deferred).

### 4.7 Budget & billing

Retainers, milestone schedule, TM rates, **overages**, **unbilled approved hours**, CTA **Create invoice draft**.

### 4.8 Deliverables

List/version/approval status; upload or link asset.

### 4.9 Change requests

CR list with impact columns; approval workflow.

### 4.10 Service templates

Library of **blueprints** (JSON or DB): phases, milestones, tasks, default billing. **Apply to new project** wizard.

### 4.11 Risks & blockers

Unified register: severity, owner, mitigation, status; sync **task blocked** flag.

### 4.12 Client view / status report

Read-only or share-link: milestones, deliverables, green/amber/red, **no internal rates** unless policy allows.

---

## 5. Role permissions (baseline matrix)

| Capability | Owner / Admin | PM | Contributor | Client (portal) | Finance |
|------------|---------------|-----|---------------|-----------------|---------|
| Create / archive project | ✓ | ✓ | — | — | view |
| Edit scope / billing model | ✓ | ✓ | — | — | view |
| Manage phases / milestones | ✓ | ✓ | limited | — | — |
| CRUD tasks | ✓ | ✓ | own tasks | — | — |
| Log time (self) | ✓ | ✓ | ✓ | — | — |
| Approve time | ✓ | ✓ | — | — | view |
| Approve milestones / CRs | ✓ | ✓ | — | approve (limited) | — |
| Trigger / view invoices | ✓ | — | — | — | ✓ |
| Client status report | ✓ | ✓ | — | view | — |

Map to PayAid **Role** + **moduleAccess** (`projects` module); refine per-tenant.

---

## 6. Service templates (catalog)

| Template id | Audience | Phases (example) | Billing default |
|-------------|----------|------------------|-------------------|
| `software_product` | Software co | Discovery → Build → QA → Release → Hypercare | TM + milestone release |
| `website_agency` | Agency | Kickoff → Design → Dev → UAT → Launch | Fixed + change orders |
| `marketing_retainer` | Agency | Strategy → Production → Reporting | Retainer + overage |
| `outsourcing_msp` | MSP / outsourcing | Onboard → Run → Review → Renew | Retainer + SLA |
| `support_package` | All | Intake → Triage → Resolve → Close | Per-ticket or bucket hours |

Each template: ordered **phases**, **milestones** with optional `billing_trigger`, **task** seeds, default **checklists** (e.g. UAT sign-off).

---

## 7. Reporting model

**Grain:** time_entry (approved), task_actuals, project_monthly_snapshot (optional materialization).

**Standard reports:**

| Report | Metrics |
|--------|---------|
| Utilization by person / role | Approved billable + non-billable vs capacity |
| Margin by project | Revenue (invoiced) − cost (hours × cost rate) − expenses |
| WIP / unbilled | Approved unbilled hours × rate |
| SLA compliance | Ticket / milestone SLA breaches (service packages) |
| Forecast | Remaining hours × burn rate vs budget |

**APIs:** Reuse tenant scope; expose `/api/projects/reports/*` or embed in existing analytics module.

---

## 8. Acceptance criteria (module “acceptable”)

- [x] Every **project** has **owner**, **client** (or **`deliveryType: internal`** / optional internal contact), **billing model**, and **timeline** — **owner** defaulted on **`POST /api/projects`**; commercial creates require **`clientId`** or a deal-linked **contact** (see **`resolveCreateProjectClientId`** in [`project-create-policy.ts`](../lib/api/projects/project-create-policy.ts)), or **`deliveryType: internal`**; **`billingModel`** defaults to **`NON_BILLABLE`** when internal and **`TIME_AND_MATERIALS`** otherwise unless the body sets it; **create now enforces timeline** via **`resolveCreateProjectTimeline`** (`startDate` + `endDate`, end >= start) and **Create project** UI requires both date fields.  
- [x] Every **task** belongs to a **project** (**`projectId`** on **`ProjectTask`**); phase/milestone links where plan exists.  
- [x] Every **time entry** has **project**; **task** required for contributors unless **owner / PM / admin** (adhoc lane); **`approvalStatus`** on model + list + PATCH workflow.  
- [x] **Health** + **budget / actual cost** surfaced on overview and portfolio (**Home** KPIs / **Reports**).  
- [~] **Milestones** on Plan tab + APIs; task **dependencies** (**`dependsOnTaskId`**) — **PATCH** enforces same-project predecessor, rejects self-deps + **transitive cycles** (**`taskDependsWouldCloseCycle`** [`task-dependency-validation.ts`](../lib/api/projects/task-dependency-validation.ts)); **task detail** + global **Tasks** list show blocker/downstream links; **GET** [`/api/projects/[id]/tasks`](../apps/dashboard/app/api/projects/[id]/tasks/route.ts) embeds **`dependsOnTask`**; full graph / multi-predecessors still deferred.  
- [x] **Project → billing** — milestone handoff Finance **draft** + **`billable_pipeline`** / time **invoiced** markers.  
- [~] **Software** vs **outsourcing** “flows” via **delivery type + billing model + templates** — §6 ids implemented: **`GET /api/projects/service-templates`**, **`POST /api/projects`** accepts **`serviceTemplateId`** (+ optional **`seedServiceTemplate`**) to merge defaults and seed **phases / milestones / starter tasks**; template milestone seeds carry default **`billingTrigger`** + **`approvalRequired`** by profile; **Create project** uses a lightweight stepper (**Delivery Profile → Commercial Setup → Timeline → Review**) with guided branching, milestone-default preview, profile-specific guards, review summary, one-click profile defaults, and dynamic profile fields (outsourcing SLA/cadence, software release/UAT owner, agency reporting/channel) persisted via tags + `[Profile Metadata]` notes block. Project detail **Overview** consumes this metadata in an **Operational Profile** card, and **POST /api/projects** now auto-seeds profile-driven operational tasks (renewal/reporting/release/SLA/UAT) from that metadata, **idempotently**: each seeded row carries tags **`profile_automation`** + **`pa_profile_auto:<stableKey>`** so a repeat seed (or future re-entry) skips duplicates for the same project/key. **Service template seeding now also creates milestone “approve billing” checklist tasks** for milestones with **`billingTrigger=ON_APPROVE`** and **`approvalRequired=true`** (tags `milestone_approval_script` + `pa_milestone_approval_auto:<templateId>:<slug>`), to close the first slice of deeper approval scripting automation. Remaining gap is multi-step approval scripting beyond milestone billing checklists (e.g., dependencies + full wizard orchestration).
- [x] **Time** is **not** the Projects default landing (**Home** primary; Time secondary with composite layout).  
- [x] Rows generally **deep-link** to project/task/Finance; global **Tasks** table rows deep-link **`/projects/{tenant}/Tasks/[id]?projectId=`**; **Time** rows expose **Open project / Open task / View billing pipeline**; project detail **Tasks/Time** tab rows include task + finance links; task detail side panel includes **Open Project** + **Open Billing Pipeline** shortcuts.

---

## 9. Phased rollout plan

| Phase | Scope | Outcome |
|-------|--------|---------|
| **P0 — Foundation** | Schema: `Project` (`health`, `billingModel`, `currency`, `dealId`, `deliveryType`, `serviceCategory`), `TimeEntry` (`approvalStatus`, `source`, `isAdhoc`, `costRate`), `ProjectTask` (`phaseId`, `milestoneId` placeholders), FK `Project.dealId` → `Deal` | **Shipped:** migration `20260503183000_projects_delivery_p0`, demo seed fills delivery fields + `APPROVED` / `SEED` time rows |
| **P1 — Navigation & shell** | Projects Home redesign; project detail **tabs**; make Time **secondary** route; global actions | Correct IA |
| **P2 — Phases & milestones** | `ProjectPhase`, `Milestone` CRUD + Gantt read + plan tab | Planning visible |
| **P3 — Time workflow** | Timer, submit/approve, weekly sheet, ad hoc policy | Time embedded in workflow |
| **P4 — Commercial** | Deal→project wizard; invoice draft trigger (Finance handoff) | Revenue connection |
| **P5 — Service ops** | `ServicePackage`, SLA fields, outsourcing dashboards | Multi-segment |
| **P6 — Deliverables & CRs** | `Deliverable`, `ChangeRequest` + approvals | Scope control |
| **P7 — Polish** | Client report, AI summary on project, reporting APIs | Differentiation |

Each phase ships behind **feature flags** if needed.

---

## 10. QA checklist

### 10.1 Data integrity

- [x] Cannot save time entry without `projectId` — Zod **`createTimeEntryBodySchema`** requires non-empty **`projectId`**; Jest: [`projects-time-entry-contracts.test.ts`](../__tests__/projects/projects-time-entry-contracts.test.ts).  
- [x] Task `projectId` matches time entry’s project — enforced in **`POST`** [`/api/projects/time-entries`](../apps/dashboard/app/api/projects/time-entries/route.ts) (`task` **`findFirst`** with `projectId`).  
- [x] Ad hoc entry (no **`taskId`**) blocked for normal contributors — must be workspace admin-like, **project owner**, or **project manager** on that project; see **`mayCreateTaskOptionalTimeEntry`** [`time-adhoc-policy.ts`](../lib/api/projects/time-adhoc-policy.ts).  
- [x] Deleting **project**: no public **`DELETE`** project route yet; DB uses **`TimeEntry.project` → `onDelete: Cascade`** (see **`schema.prisma`**); introduce soft-delete API when policy is defined.

### 10.2 Permissions

- [x] Contributor cannot approve own time if policy forbids — shared helper **`canApproveOrRejectProjectsTimeEntry`** [`time-approval-permissions.ts`](../lib/api/projects/time-approval-permissions.ts) + Jest scenarios.  
- [x] Client role cannot see cost rates unless flag on — **`shouldRedactProjectsCostRatesForViewer`** strips **`billingRate`** / **`costRate`** (+ rate-derived aggregates) on **`GET`** [`/api/projects/time-entries`](../apps/dashboard/app/api/projects/time-entries/route.ts) and relevant [**`/api/projects/reports`**](../apps/dashboard/app/api/projects/reports/route.ts) payloads; tenant opt-in: **`invoiceSettings.showCostRatesToClientRoles`** or **`invoiceSettings.projects.showCostRatesToClientRoles`**. See [`projects-viewer-rate-policy.ts`](../lib/api/projects/projects-viewer-rate-policy.ts).  
- [x] Cross-tenant access — Projects APIs resolve **`tenantId`** from **`requireModuleAccess`** and scope **`findMany` / `findFirst`** queries to that tenant (e.g. project list ∩ time rows). Spot-check new routes on add.

### 10.3 Workflows

- [x] Won deal → create project → starter template tasks — CRM **Create project** (`/projects/.../Projects/new?dealId=`) + **`POST /api/projects`** with optional **`seedDealStarterTasks`**; **`undefined`** defaults to seed when **`deal.stage`** is **`won`** (`resolveSeedDealStarterTasks` [`deal-starter-tasks.ts`](../lib/api/projects/deal-starter-tasks.ts)).  
- [x] Milestone **`billing_trigger`** creates finance artifact — **`applyMilestoneBillingHandoffInTx`** creates Finance **draft invoice** when licensed + limit room; **`AuditLog`** on milestone + **`invoice`**.  
- [x] Approved time appears in unbilled / WIP — **`reports?type=billable_pipeline`** rolls **approved unbilled** vs **invoiced** billable hours.

### 10.4 UX

- [x] From Projects Home, ≤2 clicks to **log time on a task** (Home portfolio / Recent **`Log time`** with `projectId`; Quick actions).  
- [x] Time page shows **project + task + client** on every row (labeled row; client links to CRM when known).  
- [x] Portfolio shows **at-risk** with explicit reason tooltip (Home strip; **All Projects** Health **`title`**).

### 10.5 Non-functional

- [x] Portfolio stats performance baseline — **`GET`** [`/api/projects/dashboard/stats`](../apps/dashboard/app/api/projects/dashboard/stats/route.ts) loads tenant **`projectId`** list once then aggregates **tasks / time / milestones** with **`projectId: { in: … }`** (avoids repeated **`project → tenant`** joins); response **`Cache-Control: private, max-age=15, stale-while-revalidate=60`**; **`DEBUG_PROJECTS_DASHBOARD=1`** enables verbose logs. Formal **p95 vs N projects** remains an ops load-test deliverable (very large **`IN`** lists may need rollups later).  
- [x] Audit log on approval and invoice trigger (time PATCH approval/invoicing; milestone handoff + **`invoice`** row when milestone draft is created).

---

## 11. Implementation notes (for Cursor / eng)

1. **Prefer extending** existing `Project`, `ProjectTask`, `TimeEntry` before parallel tables.  
2. **Deal → project:** reuse `Deal` + `Contact`; add `project.dealId` and UI entry from deal detail (“Create project”).  
3. **Invoice:** integrate with existing `Invoice` / orders patterns; start with **draft + deep link** rather than full automation.  
4. **Time list page:** refactor [`Time/page.tsx`](../apps/dashboard/app/projects/[tenantId]/Time/page.tsx) to composite layout (context + actions), not removal of list — **done:** left **Working context** + main search/entries.  
5. Align enums with existing API expectations (`IN_PROGRESS` vs `in_progress`) — normalize in API layer once.  
6. **Projects DB chain (apply in order via `prisma migrate deploy`):** `20260503183000_projects_delivery_p0` → `20260503193000_project_phases_milestones` → `20260503194500_project_task_plan_fks` → `20260503200000_time_entry_invoice_link` → `20260603104500_project_milestone_approval_draft_invoice` → `20260604100000_project_billing_is_inter_state`. After deploy, run **`npm run db:migrate:status`** (or **`npm run db:migrate:status:local`**) and confirm no pending migrations. Composite **`TimeEntry`** indexes (**§11.7**) may require **`npm run db:generate`** after **`schema.prisma`** pull — or run the **`manual_add_time_entry_project_filter_indexes.sql`** script on Postgres.  
7. **Portfolio dashboard API** — Prefer **`projectId` IN‑list** aggregation over nested relation filters where possible (**§10.5**); cache headers are **private** (user JWT). **Composite `TimeEntry` indexes** (**`projectId` + `approvalStatus`**, **`projectId` + `date`**) added in **`prisma/schema.prisma`**; ops can apply existing DBs via [`manual_add_time_entry_project_filter_indexes.sql`](../prisma/migrations/manual_add_time_entry_project_filter_indexes.sql) if not using **`prisma db push`** for drift pickup.  
8. **`POST /api/projects`** (**§8**) — **`resolveCreateProjectClientId`** [`project-create-policy.ts`](../lib/api/projects/project-create-policy.ts): commercial rows need **`body.clientId`** or the linked deal’s **`contactId`** (**`Contact`** must belong to **`tenantId`**); **`deliveryType: internal`** waives inherited deal contact (**`body.clientId`** still allowed). **`billingModel`** via **`defaultBillingModelForCreate`** after **`clientId`** resolution (**§6** **`serviceTemplateId`** fills **`deliveryType`** / **`billingModel`** / **`serviceCategory`** when omitted; rejects **`deliveryType` internal** combined with **`serviceTemplateId`**).  
9. **§6 Service templates** — [`service-templates.ts`](../lib/api/projects/service-templates.ts) + **`GET`** [`/api/projects/service-templates`](../apps/dashboard/app/api/projects/service-templates/route.ts): **`seedServiceTemplatePlan`** seeds **`ProjectPhase`** + one **`ProjectTask`** per phase (tags **`service_template_seed`** + template id); deal **`seedDealStarterTasks`** skips when **`serviceTemplateId`** is set.  
10. Task **dependsOn** — Jest [**`task-dependency-validation.test.ts`**](../__tests__/projects/task-dependency-validation.test.ts); Prisma **`ProjectTask.dependsOnTaskId`** is a single FK (not a DAG engine); **`GET`** [`/api/projects/[id]/tasks`](../apps/dashboard/app/api/projects/[id]/tasks/route.ts) includes **`dependsOnTask`** preview for Kanban/list consumers.  
11. **Profile metadata → operational tasks** — [`project-profile-automation.ts`](../lib/api/projects/project-profile-automation.ts) **`seedOperationalTasksFromProfileMetadata`**: **`POST /api/projects`** runs it inside create; **`PATCH /api/projects/[id]`** runs it when **`notes`** is patched or when the body sends **`resyncProfileAutomation: true`** (reload row, idempotent keyed **`findFirst`** + **`create`**). Response includes **`profileAutomationTasksSeeded`** when that pass ran. Operational Profile UI exposes **Sync profile tasks** for the resync path.
12. **Milestone billing approval checklists** — [`seedServiceTemplatePlan`](../lib/api/projects/service-templates.ts) creates operator `ProjectTask` checklist rows for template milestones with **`billingTrigger=ON_APPROVE`** + **`approvalRequired=true`**. Runtime milestone APIs also enforce this scripting: [`POST /api/projects/[id]/milestones`](../apps/dashboard/app/api/projects/[id]/milestones/route.ts) and [`PATCH /api/projects/[id]/milestones/[milestoneId]`](../apps/dashboard/app/api/projects/[id]/milestones/[milestoneId]/route.ts) call `ensureMilestoneApprovalChecklistTask` so checklist tasks appear even for manually created/edited milestones. `GET /api/projects/[id]` now annotates each milestone with `approvalChecklistTaskExists` by scanning checklist tags, and `PATCH /api/projects/[id]` accepts `resyncMilestoneApprovalChecklists: true` to auto-heal missing rows in bulk (response: `approvalChecklistTasksSeeded`); Overview card surfaces ready/missing plus one-click sync.

---

*Document owner: engineering. **P0:** schema + migrations (run **`npm run db:generate`** then **`npm run db:migrate:deploy`** on each env), including the **Projects chain** in note **11.6** above. **Shipped (P1–P4 partial + P2 plan):** contextual Time list + approvals + **invoiced** markers; **PATCH** `/api/projects/time-entries/[id]` (approval **or** invoicing body); **GET** + **PATCH** `/api/projects/[id]` (delivery / portfolio + core fields + audit); **GET** project embeds **`phases`** + **`milestones`**; **POST/PATCH/DELETE** `/api/projects/[id]/phases` and `/milestones`; Plan tab CRUD; linked deal on GET; portfolio strip + stats + Home → Reports `#billable-pipeline`; overview editors; invalidates `['projects', tenantId]` after PATCH; Billing → Finance invoice deep link; CRM “Create project”; Reports `billable_pipeline` with **unbilled vs invoiced** rollups; `?atRisk=1` list.*

*Next (ops):* **`npm run db:generate`** → **`npm run db:migrate:deploy`** (or **`db:migrate:deploy:local`**). Then **`npm run db:migrate:status`** (same `DATABASE_URL`) — expect no pending migrations. The two newest Projects-related folders are **`20260603104500_project_milestone_approval_draft_invoice`** and **`20260604100000_project_billing_is_inter_state`**; they require the rest of the chain in **§11.6**. SQL uses **`IF NOT EXISTS`** on some alters; **`db push`**-only envs: baseline or align with **`npm run db:local:baseline-migrations`** (`scripts/baseline-local-prisma-migrations.mjs`) plus **`npm run db:migrate:status`** before deploy.*

*Shipped this step:* **Milestone** **`approvedAt`** / **`approvedById`** / **`billingDraftInvoiceId`** + migration; **POST** [`/api/projects/[id]/milestones/[milestoneId]/approve`](../apps/dashboard/app/api/projects/[id]/milestones/[milestoneId]/approve/route.ts) (gates **`ON_APPROVE`** + **`approvalRequired`**); Plan tab **Billing gate** + **Approve billing** + **`Draft invoice`** links; auto **Finance draft** via [`create-milestone-handoff-draft-invoice`](../lib/api/projects/create-milestone-handoff-draft-invoice.ts) + [`milestone-handoff-gst-resolve`](../lib/api/projects/milestone-handoff-gst-resolve.ts): GST **%** / tenant default **inter-state** from **`invoiceSettings.projectsMilestoneHandoff`**, edited in **Settings → Workspace** (UI card + **GET/PATCH** [`/api/settings/tenant`](../apps/dashboard/app/api/settings/tenant/route.ts)); **IGST vs CGST/SGST** from **`Project.billingIsInterState`** (nullable → tenant default) + migration **`20260604100000_project_billing_is_inter_state`**; project **PATCH** + Overview **Milestone handoff GST** control; `Invoice.items.projectsMilestoneHandoff` stores **`gstRatePercent`** / **`isInterState`**. [`applyMilestoneBillingHandoffInTx`](../lib/api/projects/milestone-billing-handoff-run.ts); invoice status sync + **`AuditLog`** as before.*

---

## 12. Immediate execution checklist

Use this as the runbook for the next cycle.

1. **DB rollout**
   - Run **`npm run db:generate`**
   - Run **`npm run db:migrate:deploy`** (or local equivalent)
   - Verify with **`npm run db:migrate:status`** (expect no pending)

2. **Tenant settings validation**
   - In **Settings → Workspace**, confirm milestone handoff defaults:
     - `projectsMilestoneHandoff.gstRatePercent`
     - `projectsMilestoneHandoff.isInterState`
   - Confirm API roundtrip on **`GET/PATCH /api/settings/tenant`**

3. **Milestone billing handoff UAT**
   - Create project with milestones using `ON_APPROVE` trigger
   - Approve milestone via Plan tab and API endpoint
   - Verify Finance draft invoice is created and linked back (`billingDraftInvoiceId`)
   - Verify `AuditLog` events for approval + invoice handoff

4. **Time/billing reconciliation**
   - Submit and approve billable entries
   - Mark entries invoiced with and without `invoiceId`
   - Validate Reports billable pipeline: approved unbilled vs invoiced

5. **Deferred scope to schedule next**
   - Multi-predecessor task dependency graph (beyond single `dependsOnTaskId`)
   - Full Deal→Project multi-step wizard
   - Deliverables + Change Requests domain entities
   - ServicePackage + SLA dashboards

---

## 13. Release QA test matrix

Use this matrix during staging/UAT signoff. Keep evidence links in the final column.

| ID | Area | Owner | Environment | Test steps | Expected result | Evidence |
|----|------|-------|-------------|------------|-----------------|----------|
| Q1 | DB rollout | Platform / BE | Staging + Prod | Run `npm run db:generate` → `npm run db:migrate:deploy` → `npm run db:migrate:status` | No pending migrations; schema includes milestone handoff + billing inter-state columns | Migration logs + status output |
| Q2 | Tenant settings | PM + QA | Staging | Open Settings → Workspace; set `projectsMilestoneHandoff.gstRatePercent` and `isInterState`; verify via `GET /api/settings/tenant` | UI values and API payload match; PATCH persists without drift | Screenshot + API response JSON |
| Q3 | Milestone approval gate | QA | Staging | Create project with milestone `billingTrigger=ON_APPROVE` + `approvalRequired=true`; approve from Plan tab and via API | Approval succeeds only for authorized role; milestone stores `approvedAt`/`approvedById` | UI screenshot + API payload |
| Q4 | Finance draft handoff | QA + Finance | Staging | Approve milestone from Q3 and open generated Finance draft | Draft invoice created and linked (`billingDraftInvoiceId`), with expected GST/inter-state line metadata | Invoice link + payload snippet |
| Q5 | Audit trail | QA | Staging | Perform milestone approval + time approval + mark invoiced | `AuditLog` rows exist for approval and billing/invoicing events with actor + timestamps | AuditLog query output |
| Q6 | Time approval flow | QA + PM | Staging | Log time, submit, approve, reject/correct, re-approve | `approvalStatus` transitions are enforced; permissions block unauthorized approvals | Time entries before/after snapshots |
| Q7 | Invoiced marker flow | QA + Finance | Staging | Mark approved entries invoiced with and without `invoiceId` | PATCH succeeds; entries reflect invoiced state; linkage retained when `invoiceId` provided | API response + UI row state |
| Q8 | Billable pipeline report | QA | Staging | Open Reports → billable pipeline after Q6/Q7 | Approved unbilled and invoiced totals reconcile with entry set | Report screenshot + reconciliation sheet |
| Q9 | Portfolio health + risk drilldown | QA + PM | Staging | Visit Projects Home and filtered list `?atRisk=1` | At-risk projects surface with reasons/tooltips and deep-link correctly | Home/list screenshots |
| Q10 | Deal→project path | QA + Sales Ops | Staging | Create project from won deal CTA using template seed | Project contains expected linked deal fields + seeded phases/milestones/tasks | Created project JSON + UI screenshot |

---

## 14. Definition of Done for release

### 14.1 Staging DoD (must pass before release approval)

- **Mandatory matrix rows:** `Q1` through `Q10` all executed with evidence attached.
- **Blocking defects:** zero open Sev-1/Sev-2 issues in Projects, Time, Billing handoff flows.
- **Data integrity checks:** no orphaned milestone billing links; no approved time missing required project linkage.
- **Auditability:** milestone approval, invoice draft handoff, and time approval/invoicing actions visible in `AuditLog`.
- **Signoff owners:** QA lead, PM owner, and one Finance approver.

### 14.2 Production cutover DoD (must pass for go-live)

- **Re-run required checks in prod-like window:** `Q1`, `Q2`, `Q4`, `Q5`, `Q8` (minimum).
- **Migration status:** `npm run db:migrate:status` shows no pending migrations on production `DATABASE_URL`.
- **Operational readiness:** monitoring/alerts enabled for project APIs and invoice handoff failures.
- **Rollback readiness:** documented rollback path for latest migrations and feature-flag fallback (if enabled).
- **Business signoff:** PM + Engineering + Finance confirm go-live in release thread/ticket.

---

## 15. Build stall signature and triage

### 15.1 Observed signature (May 5, 2026)

- `apps/dashboard` and `apps/crm` both stall during production build and then hit the timeout guard.
- The stall persists even when all major compile-pressure toggles are enabled:
  - `PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS=1`
  - `PAYAID_DISABLE_TRANSPILE_PACKAGES=1`
  - `NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1`
- Representative logs:
  - `docs/evidence/closure/2026-05-05T13-14-57-113Z-next-build-diagnose-dashboard.log`
  - `docs/evidence/closure/2026-05-05T15-28-44-929Z-next-build-diagnose-crm.log`

### 15.2 Fast reproduce commands

```bash
# Dashboard (webpack phase only)
NEXT_BUILD_TIMEOUT_MS=600000 PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS=1 PAYAID_DISABLE_TRANSPILE_PACKAGES=1 NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1 node scripts/diagnose-next-build.mjs --app apps/dashboard --skip-tsc

# CRM (webpack phase only)
NEXT_BUILD_TIMEOUT_MS=600000 PAYAID_DISABLE_OPTIMIZE_PACKAGE_IMPORTS=1 PAYAID_DISABLE_TRANSPILE_PACKAGES=1 NEXT_BUILD_TRIAGE_DISABLE_OUTPUT_FILE_TRACING=1 node scripts/diagnose-next-build.mjs --app apps/crm --skip-tsc
```

Repo aliases (same env as above, **no** process kill on webpack — use for long local captures): `npm run diagnose:dashboard:build:deep`, `npm run diagnose:crm:build:deep`. Both set **`NODE_OPTIONS=--max-old-space-size=8192`** for spawn stability on large webpack graphs (override externally if needed).

### 15.3 Practical safeguards

- `apps/dashboard/scripts/next-build.cjs` supports `NEXT_BUILD_TIMEOUT_MS=0` to disable kill during deep diagnostics.
- `npm run diagnose:dashboard:build` / `diagnose:crm:build` use **`NODE_OPTIONS=--max-old-space-size=8192`** so long webpack phases are less likely to die with **FATAL ERROR: … heap out of memory** (exit **134**) like unbounded manual runs without a heap flag (see `2026-05-05T21-01-24-438Z-next-build-diagnose-dashboard.log`).
- Prefer `npm run diagnose:dashboard:build:deep` / `diagnose:crm:build:deep` when webpack must be allowed to run without the `next-build.cjs` timeout kill. Each run’s evidence log **meta** section echoes key env (`NODE_OPTIONS`, `PAYAID_WEBPACK_PROGRESS`, triage flags, `VERCEL_*`) so closures are self-describing without cross-referencing shell history.
- **Node for spawned builds:** `scripts/payaid-node-executable.cjs` picks the Node binary for `next build` / `tsc` spawned from diagnose and from `apps/*/scripts/next-build.cjs`. Override with `PAYAID_NODE_EXECUTABLE` (must exist). Otherwise, on Windows the resolver prefers `Program Files\\nodejs\\node.exe` when present so tooling is not stuck on an IDE-bundled Node. Legacy: `PAYAID_PROFILE_NODE_EXE` is honored as a second explicit override candidate (used by webpack CPU profiling historically).
- **Webpack progress (long silent compiles):** `PAYAID_WEBPACK_PROGRESS=1` adds a throttled `webpack.ProgressPlugin` logger (`[payaid-webpack-progress] …`) in both apps’ `next.config.mjs`. Deep diagnose scripts enable it automatically. Lines usually begin after Next prints `Creating an optimized production build ...`.
- **Webpack parallelism:** set `PAYAID_WEBPACK_PARALLELISM` to a positive integer to cap module parallelism on both apps (default on Vercel remains `2` when unset; local default is Next/webpack’s own). Use a lower value if the machine is memory-bound; try a moderate value if the compile is CPU-bound and idle.
- **Node heap (local):** for very large graphs, `NODE_OPTIONS=--max-old-space-size=8192` (or higher, if RAM allows) reduces OOM risk during `next build`. For CRM `tsc`, `npm run typecheck:crm:heap8192` applies the same default as dashboard typecheck heap sizing.
- **Windows:** `npm run diagnose:dashboard:build:metrics` / `diagnose:crm:build:metrics` run the same diagnose flow while appending top `node.exe` working-set samples to `docs/evidence/closure/*-metrics.ndjson` (see `scripts/run-diagnose-with-build-metrics.mjs`).
- **Bundle budgets (post-build):** `npm run perf:bundle:check` (hard fail) or `perf:bundle:check:soft` (always exit 0); opt-in release gate `npm run release:gate:performance-bundle-budgets` runs the soft check and writes `docs/evidence/release-gates/*-release-gate-suite.json`.
- Use a bounded diagnose first (`600000`), then escalate to `0` only when collecting long-running evidence.
- **Concurrent builds:** if `next build` fails with **Unable to acquire lock** at `apps/<app>/.next/lock`, stop every other `next build` / dev server using that `distDir`, then delete the stale **`lock`** file only after confirming no Node process is still compiling (see evidence: `2026-05-05T22-11-40-138Z-next-build-diagnose-dashboard.log` exiting `1` for this reason).

### 15.4 Next investigation step

- Capture a reliable child-process CPU profile from a normal terminal session (outside agent shell wrappers), then rank hot call frames and correlate with resolver/trace/transform hotspots before changing architecture-level build config.
