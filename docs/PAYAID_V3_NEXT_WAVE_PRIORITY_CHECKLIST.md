# PayAid V3 - Next Wave Priority Checklist (P1/P2/P3)

**Purpose:** prioritized enhancement backlog after M0-M3 delivery completion.
**How to use:** keep this list as the active next-wave tracker; mark `[x]` on ship and add an update-log line.

---

## P1 - High-value product enhancements

- [x] **Integration observability dashboard (Settings > Integrations home)**  
  Add cross-integration health summary cards (Email/OAuth, WAHA, Telephony, Social) with readiness and signal counts using live settings endpoints.
- [x] **Integration incident alerts**  
  Add alerting hooks for repeated test failures, webhook verification failures, and OAuth token expiry windows.
- [x] **Guided integration diagnostics**  
  Add "Diagnose/Fix" flows for common SMTP, WAHA, telephony, and OAuth issues with actionable remediation.

---

## P2 - Operational excellence and platform trust

- [x] **Nightly evidence automation**  
  Run M0/M2 evidence collectors nightly and archive signed artifacts for release readiness.
- [x] **Permission posture scanner**  
  Build tenant RBAC posture checks that detect over-privileged role/permission assignments.
- [x] **Integration SLA dashboards**  
  Add trend views (7/30/90-day) for integration uptime, failure rates, and mean recovery time.

---

## P3 - Expansion and intelligence

- [x] **KPI benchmark overlays**  
  Show tenant KPI movement vs baseline and explain variance drivers.
- [x] **Proactive AI recommendations**  
  Suggest best-next-actions based on integration failures, SDR outcomes, and revenue risk patterns.
- [x] **Admin change impact simulator**  
  Preview likely downstream impact before changing feature flags/integration configs at scale.

---

## Update log (append-only)

- `YYYY-MM-DD` - **Item** - status change - evidence link (if available)
- `2026-04-09` - **P1 Integration observability dashboard** - completed - Added live health summary cards on `settings/[tenantId]/Integrations/page.tsx` using `/api/settings/smtp`, `/api/settings/email/oauth/status`, `/api/settings/waha`, `/api/settings/telephony`, and `/api/settings/social`.
- `2026-04-09` - **P1 Integration incident alerts** - completed - Added `GET /api/settings/integrations/alerts` to emit prioritized incident signals (repeated integration errors, stale telephony webhook, failed integration tests, OAuth expiry/expired windows) and surfaced alert summary + top incidents on `settings/[tenantId]/Integrations/page.tsx`.
- `2026-04-09` - **P1 Guided integration diagnostics** - completed - Added `GET /api/settings/integrations/diagnostics` with module-level checks + recommended next actions (SMTP/WAHA/Telephony/Social), and shipped a guided diagnostics panel with one-click navigation to relevant integration settings pages.
- `2026-04-09` - **P2 Nightly evidence automation** - completed - Added nightly archive runner `scripts/run-nightly-evidence-archive.mjs`, npm script `nightly:evidence:archive`, and scheduled GitHub workflow `.github/workflows/nightly-evidence.yml` (daily cron + manual dispatch) to run M0/M2 evidence collectors and upload `docs/evidence/nightly/` artifacts with run index metadata.
- `2026-04-09` - **P2 Permission posture scanner** - completed - Added SUPER_ADMIN API `GET /api/v1/admin/tenants/[id]/permission-posture` for tenant-level RBAC risk findings (direct admin grants, broad role permissions, multi-role stacking, expansive module scopes) and offline scanner `npm run scan:permission-posture` (`scripts/scan-permission-posture.mjs`) writing evidence JSON under `docs/evidence/security/permission-posture/`.
- `2026-04-09` - **P2 Integration SLA dashboards** - completed - Added `GET /api/settings/integrations/sla?window_days=7|30|90` to compute uptime/failure/MTTR from integration audit streams and surfaced a 7/30/90-day SLA panel on `settings/[tenantId]/Integrations/page.tsx` with per-module uptime and recovery metrics.
- `2026-04-09` - **P3 KPI benchmark overlays** - completed - Extended `crm/[tenantId]/Analytics/page.tsx` with a benchmark overlay that compares current window KPIs against a 90-day baseline (win rate, automation failure, signal latency, quote conversion time) and highlights top variance drivers with directional guidance.
- `2026-04-09` - **P3 Proactive AI recommendations** - completed - Added `GET /api/v1/kpi/recommendations` (rule-driven next-best actions based on KPI scorecard thresholds) and surfaced a "Proactive AI Recommendations" panel on `crm/[tenantId]/Analytics/page.tsx` with priority, reason, and suggested action.
- `2026-04-09` - **P3 Admin change impact simulator** - completed - Added `POST /api/v1/admin/tenants/[id]/feature-flags/simulate` to preview high/medium/low operational impacts for pending feature-flag changes and wired a live "Change impact preview" block into `settings/[tenantId]/AdminConsole/page.tsx` before Save.
- `2026-04-09` - **Post-completion hardening (simulator API)** - completed - Added smoke suite `__tests__/m3/m3-admin-feature-flag-simulate-route.test.ts` (3 tests: 200 valid simulation, 400 invalid flag, 404 tenant missing); verified green via `jest.m3.smoke.config.js`.
