# Next Steps Roadmap – HR Phase 2 & Finance

**Status:** Living document  
**Last updated:** Feb 2025

This doc tracks planning and deliverables for the next steps from `PENDING_MODULES_404_SUMMARY.md`.

---

## 1. HR Phase 2 (4–6 months)

| Deliverable | Scope | Priority | Status |
|-------------|--------|----------|--------|
| **Mobile app** | React Native / PWA for HR: leave, attendance, payslips, approvals | High | Planned |
| **Resume screening AI** | Score candidates vs JD, shortlist suggestions | High | **Done** (scoring API + UI) |
| **Tally integration** | Sync chart of accounts, invoices, payments with Tally | Medium | **Done** (export) |
| **Compliance automation** | PF/ESI/TDS filing reminders, checklist, document due dates | Medium | **Done** (alerts + reminders API) |

### Phase 2 – Suggested order

1. **Compliance automation** – Alerts and checklists (no new app; extend existing HR/Finance). **Done:** Statutory-Compliance page shows “Due soon / Overdue” alerts from `GET /api/hr/compliance/reminders`; reminders API fixed for TDS 24Q due dates.
2. **Resume screening AI** – Use existing recruitment pipeline; add scoring API + UI. **Done:** `GET /api/hr/recruitment/candidates/[id]/match-score`, `POST /api/hr/recruitment/jobs/[id]/rank-candidates`; Job Requisition detail has “Rank by AI”; Candidates list has “Score for job” dropdown and Match column.
3. **Tally integration** – **Done:** Finance Tally Export page (CoA + transactions CSV/JSON). APIs: `GET /api/finance/tally/export/coa`, `GET /api/finance/tally/export/transactions`. HR payroll export at Statutory Compliance.
4. **Mobile app** – PWA: app manifest added (installable); HR Mobile Hub at `/hr/[tenantId]/mobile` (leave, attendance, payslips, reimbursements); linked from HR dashboard Quick Actions as “HR on the go”. Native/React Native planned.

---

## 2. Finance / Accounting

| Deliverable | Scope | Priority | Status |
|-------------|--------|----------|--------|
| **Trial Balance** | Report and UI: accounts with debit/credit totals as of date | High | **Done** |
| **Enhanced P&L** | Deeper report: breakdown by account/category, use Expense + FinancialTransaction | High | **Done** |
| **Enhanced Balance Sheet** | Deeper report: assets/liabilities/equity from ChartOfAccounts + transactions | High | **Done** |
| **CA Assistant** | Move from stub to real: GST summary, bank recon help, expense classification | High | **Done** |

### Implemented

- **Trial Balance** – `GET /api/accounting/reports/trial-balance?asOfDate=`; Reports page: “Trial Balance” option, as-of date, table (Account, Type, Debit, Credit, totals, isBalanced). UI polished (slate theme, blueprint alignment).
- **P&L (enhanced)** – Revenue from paid invoices + ledger revenue accounts; expenses from Expense table (by category) + ledger expense accounts; breakdown shown in UI. Styling aligned to unified layout.
- **Balance Sheet (enhanced)** – Built from ChartOfAccounts + FinancialTransaction; assets/liabilities/equity by accountType; `totals` used in UI; balance check displayed (Assets − Liabilities − Equity) with warning when non-zero.
- **CA Assistant** – GST tab: links to GST Reports and E-Invoicing; Bank tab: unreconciled count + link to Bank Reconciliation; Expense tab: link to Expenses; Compliance tab: TDS reminders (next 30 days) + link to TDS; Tax tab: link to Financial Reports. Added to Finance top nav; slate styling; PageAIAssistant via AppShell.

---

## 3. Cross-cutting

- **API consistency** – Prefer `requireModuleAccess(request, 'finance')` and tenant-scoped queries. **Done:** Trial Balance, P&L, Balance Sheet, accounting expenses (list/approve/reject/summary), finance bank-reconcile, TDS reminders, e-invoice, chart-of-accounts, journal-entries all use requireModuleAccess and tenant-scoped queries.
- **Currency** – `formatINR()` / INR only per project rules.
- **Unified layout** – All new pages follow the global layout (top nav, sidebar, PageAIAssistant). **Done:** `app/finance/[tenantId]/layout.tsx` and `app/hr/[tenantId]/layout.tsx` wrap all module pages with AppShell + PageAIAssistant.
- **PWA** – `app/manifest.ts` added; app is installable.
- **HR quick wins:** **Done:** Flight Risk Alerts on HR dashboard (from summary API); WhatsApp Leave CTA on Leave Apply page (card + link to HR Settings); Report Builder link in Quick Actions; E-Invoicing note (connect GSTIN/IRN in Settings) on E-Invoicing page.

---

## 4. Mandatory & optional steps (done)

- **Mandatory – Deployment:** `docs/DEPLOYMENT_VERIFICATION.md` – Vercel `DATABASE_URL` and running `scripts/verify-deployment.ps1`.
- **Mandatory – Mobile:** HR Mobile Hub page + PWA manifest (orientation); “HR on the go” in Quick Actions.
- **Optional – Performance monitoring:** `docs/PERFORMANCE_MONITORING.md` – how to run `scripts/setup-performance-monitoring.ts`.
- **Optional – Productivity APIs:** `requireModuleAccess(request, 'productivity')` and tenant-scoped queries added to `/api/productivity/projects` and `/api/productivity/tasks`.
- **Optional – Env vars:** `.env.example` – `DATABASE_URL`, `CRON_SECRET`, `NEXT_PUBLIC_MEET_BASE_URL`, `DOCUMENT_BUILDER_URL`.

## 5. References

- `PENDING_MODULES_404_SUMMARY.md` – Source of “next step” items.
- `docs/PRODUCTIVITY_MODULE.md` – Productivity tools and env.
- `docs/DEPLOYMENT_VERIFICATION.md` – Mandatory deployment verification.
- `docs/PERFORMANCE_MONITORING.md` – Optional financial dashboard monitoring.
- `.cursor/rules/unified-layout-ai-blueprint.mdc` – UI/layout contract.
