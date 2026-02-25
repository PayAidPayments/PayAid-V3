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
4. **Mobile app** – PWA: app manifest added (installable). Native/React Native planned.

---

## 2. Finance / Accounting

| Deliverable | Scope | Priority | Status |
|-------------|--------|----------|--------|
| **Trial Balance** | Report and UI: accounts with debit/credit totals as of date | High | In progress |
| **Enhanced P&L** | Deeper report: breakdown by account/category, use Expense + FinancialTransaction | High | In progress |
| **Enhanced Balance Sheet** | Deeper report: assets/liabilities/equity from ChartOfAccounts + transactions | High | In progress |
| **CA Assistant** | Move from stub to real: GST summary, bank recon help, expense classification | High | In progress |

### Implemented

- **Trial Balance** – `GET /api/accounting/reports/trial-balance?asOfDate=`; Reports page: “Trial Balance” option, as-of date, table (Account, Type, Debit, Credit, totals, isBalanced).
- **P&L (enhanced)** – Revenue from paid invoices + ledger revenue accounts; expenses from Expense table (by category) + ledger expense accounts; breakdown shown in UI.
- **Balance Sheet (enhanced)** – Built from ChartOfAccounts + FinancialTransaction; assets/liabilities/equity by accountType; `totals` used in UI.
- **CA Assistant** – GST tab: links to GST Reports and E-Invoicing; Bank tab: unreconciled count + link to Bank Reconciliation; Expense tab: link to Expenses; Compliance tab: TDS reminders (next 30 days) + link to TDS; Tax tab: link to Financial Reports.

---

## 3. Cross-cutting

- **API consistency** – Prefer `requireModuleAccess(request, 'finance')` and tenant-scoped queries.
- **Currency** – `formatINR()` / INR only per project rules.
- **Unified layout** – All new pages follow the global layout (top nav, sidebar, PageAIAssistant). **Done:** `app/finance/[tenantId]/layout.tsx` and `app/hr/[tenantId]/layout.tsx` wrap all module pages with AppShell + PageAIAssistant.
- **PWA** – `app/manifest.ts` added; app is installable.
- **HR quick wins:** Flight Risk Alerts on dashboard (from summary API); WhatsApp Leave CTA on Leave Apply page; Report Builder link in Quick Actions; E-Invoicing note (connect GSTIN/IRN in Settings).

---

## 4. References

- `PENDING_MODULES_404_SUMMARY.md` – Source of “next step” items.
- `docs/PRODUCTIVITY_MODULE.md` – Productivity tools and env.
- `.cursor/rules/unified-layout-ai-blueprint.mdc` – UI/layout contract.
