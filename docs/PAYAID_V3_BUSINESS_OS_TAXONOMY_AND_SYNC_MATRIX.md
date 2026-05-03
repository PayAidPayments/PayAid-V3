# PayAid V3 Business OS Taxonomy and Sync Matrix

Status: Draft v1 (implementation baseline)  
Date: 2026-04-22

## 1) Canonical Top-Level Suites

1. CRM & Sales
2. Marketing
3. Finance
4. Operations
5. Projects & Service
6. HR & Workforce
7. Support
8. Documents & Contracts
9. Analytics
10. Automation
11. AI Workspace

## 2) Non-top-level Families

### Platform Capabilities
- App Store
- Communications Infrastructure
- Identity & Roles
- Tenant Settings
- Search & Command Center
- Notification Infrastructure
- Knowledge Infrastructure
- File Processing

### Workspace Tools (secondary)
- Sheets
- Docs
- Drive
- Slides
- Meet
- PDF

### Industry Solutions (overlays)
- Restaurant, Retail, Manufacturing, Healthcare, Education, Real Estate
- Service Businesses, E-Commerce, Logistics & Transportation
- Agriculture & Farming, Construction & Contracting
- Beauty & Wellness, Automotive & Repair, Hospitality & Hotels
- Legal Services, Financial Services, Event Management
- Wholesale & Distribution

## 3) Canonical Domain Ownership

| Domain record | Owner suite |
|---|---|
| Lead, Contact, Account, Deal, Activity | CRM & Sales |
| Campaign, Segment, Form Submission, Attribution | Marketing |
| Invoice, Payment, Expense, Ledger, PO | Finance |
| Inventory, Stock Movement, Supplier, Asset, Fulfillment | Operations |
| Project, Task, Timesheet, Service Job | Projects & Service |
| Employee, Attendance, Leave, Payroll, Training | HR & Workforce |
| Ticket, SLA, KB Article | Support |
| Contract, Signature, Document Version | Documents & Contracts |
| Dashboard/Metric/Forecast snapshots | Analytics |
| Workflow Run, Rule Execution, Notifications | Automation |
| Voice Call, Transcript, Disposition, AI Summary | AI Workspace |

## 4) Event Contract Minimum

Each event must include:
- `eventId`
- `eventType`
- `tenantId`
- `sourceModule`
- `entityType`
- `entityId`
- `occurredAt`
- `version`
- `correlationId`
- `actorType`
- `actorId`
- `payload`
- `idempotencyKey`

## 5) Priority Sync Flows (Phase 1)

| Event | Producer | Consumers | Result |
|---|---|---|---|
| `marketing.form.submitted` | Marketing | CRM, Automation, Analytics | Create/update lead, route owner, attribution signal |
| `finance.invoice.created` | Finance | CRM, Automation, Analytics | Link invoice to contact/account, timeline activity, follow-up trigger |
| `finance.payment.received` | Finance | CRM, Analytics | Timeline payment event + revenue refresh |
| `ai.voice_call.completed` | AI Workspace | CRM, Automation, Analytics | Attach transcript/summary/disposition, create next task |
| `ai.voice_lead.interested` | AI Workspace | CRM, Automation | Create/update lead, assign owner, SLA/task kickoff |
| `support.ticket.created` | Support | CRM, Automation, Analytics | Add support context to customer timeline + SLA timer |
| `docs.contract.signed` | Documents & Contracts | CRM, Finance, Projects, Analytics | Deal progression + invoice/project triggers |
| `ops.stock.low` | Operations | Automation, Finance, Analytics | Reorder workflow + stock risk visibility |
| `project.milestone.completed` | Projects & Service | Finance, CRM, Analytics | Billing eligibility + customer timeline update |
| `hr.payroll.completed` | HR & Workforce | Finance, Analytics | Payroll cost sync + workforce cost analytics |

## 6) Module-enabled Degradation Rules

| Flow | Target disabled behavior |
|---|---|
| Finance -> CRM (`finance.invoice.created`) | Keep invoice/customer in Finance only and write internal activity log |
| Marketing -> CRM (`marketing.form.submitted`) | Store in Marketing lead inbox until CRM is enabled |
| AI -> CRM (`ai.voice_call.completed`) | Keep transcript/outcome in AI Workspace only |
| Support -> CRM (`support.ticket.created`) | Keep customer reference in Support only |
| Documents -> Projects (`docs.contract.signed`) | Record signed contract only; do not auto-create project |

## 7) Master Record Matching Rules

Deterministic match order for cross-suite link/create:
1. existing shared `personId` / `accountId`
2. external reference id
3. normalized phone
4. normalized email
5. tenant-scoped company + person fallback to review queue

Never auto-merge on weak fuzzy matches.

## 8) Technical Guardrails

- Use transactional outbox for reliable publish-after-write
- Consumers must be idempotent by `idempotencyKey`
- Keep module ownership strict (one owner per domain record type)
- Track sync outcomes in audit logs
- Keep cross-module sync event-driven (avoid ad-hoc direct coupling)

## 9) Rollout Order

1. Taxonomy + naming baseline (labels and mapping only)
2. Event catalog and schemas (docs + typed contracts)
3. Outbox scaffolding + consumer idempotency utility
4. Priority 10 sync handlers
5. Industry overlay presets (terminology/templates/workflows)
6. Secondary tool/nav cleanup and copy polish

