# Dev Allocation Matrix — Phase 1B & GTM (Weeks 5–12)

**Team:** 5 devs. **Budget:** ₹15–25L (from 12-week plan).  
Use this to assign ownership and avoid overlap. Adjust names/roles to your actual team.

---

## Legend

- **P** = Primary owner (design + implementation)
- **S** = Secondary (reviews, integration, or part-time support)
- **—** = Not assigned

---

## Phase 1B (Weeks 5–8)

| Workstream | Dev 1 | Dev 2 | Dev 3 | Dev 4 | Dev 5 | Notes |
|------------|-------|-------|-------|-------|-------|--------|
| **Churn Predictor Dashboard** | P | S | — | — | — | Backend: churn-predictor.ts + API. Frontend: Churn page. Reuse HR flight-risk patterns. |
| **No-Code Agent Builder** | S | P | P | — | — | Dev 2: workflow engine + API. Dev 3: canvas UI (drag-drop). |
| **Website Builder v2** | — | — | S | P | — | Industry presets, India SMB prompts, v2 page + preview. |
| **Integration & QA** | — | — | — | S | P | Wire Churn actions (task, WhatsApp, nurture); agent templates; E2E tests. |

**Suggested focus:**

- **Dev 1:** Churn predictor (lib + API + dashboard). Secondary: Agent builder integration.
- **Dev 2:** Agent workflow engine, CRUD APIs, run API. Secondary: Churn API review.
- **Dev 3:** Agent builder UI (canvas, nodes, trigger picker). Secondary: Website v2 UI.
- **Dev 4:** Website Builder v2 (prompts, industry, page, preview). Secondary: Integration/QA.
- **Dev 5:** Integration, E2E, Churn actions (task/WhatsApp/nurture), agent run logging. Primary QA owner.

---

## GTM & Launch (Weeks 9–12)

| Workstream | Dev 1 | Dev 2 | Dev 3 | Dev 4 | Dev 5 | Notes |
|------------|-------|-------|-------|-------|-------|--------|
| **GTM Engine / Analytics** | — | S | — | P | P | Demand gen ROI, funnel (free → paid), conversion events. |
| **Soft launch prep** | P | P | P | S | P | Feature flags, pricing page, onboarding tweaks, 100 SMB target. |
| **Performance & reliability** | S | — | P | — | P | Lighthouse 95+, dashboard &lt;1.5s, error boundaries, rate limits. |
| **Support & runbooks** | — | — | — | — | P | Docs, runbooks, support playbook for launch. |

**Suggested focus:**

- **Dev 1:** Launch prep (flags, onboarding). Churn polish if needed.
- **Dev 2:** Launch prep (pricing, limits). GTM analytics support.
- **Dev 3:** Performance (Lighthouse, bundle size, agent UI perf).
- **Dev 4:** GTM engine (events, dashboards). Website v2 polish.
- **Dev 5:** GTM analytics (funnel, conversion), runbooks, support prep, E2E for launch.

---

## Capacity and dependencies

| Week | Dev 1 | Dev 2 | Dev 3 | Dev 4 | Dev 5 |
|------|--------|--------|--------|--------|--------|
| 5–6 | Churn predictor | Workflow engine | Agent canvas | Website v2 | Integration + QA |
| 7–8 | Churn UI + polish | Agent APIs + templates | Agent UI polish | Website v2 preview | E2E + Churn actions |
| 9–10 | Launch prep | Launch prep | Performance | GTM engine | GTM + runbooks |
| 11–12 | Launch + fix | Launch + fix | Launch + fix | GTM dashboards | Support + metrics |

**Dependencies:**

- Churn Predictor can start Week 5 (no dependency on Agent Builder).
- Agent Builder: engine (Dev 2) before full canvas (Dev 3); templates can follow.
- Website v2 can start Week 5 in parallel.
- GTM engine needs event schema and conversion points defined by Week 9.

---

## Quick reference — who owns what

| Deliverable | Primary | Secondary |
|-------------|---------|-----------|
| Churn Predictor (backend + dashboard) | Dev 1 | Dev 5 (actions) |
| No-Code Agent Builder (engine + API) | Dev 2 | Dev 1 |
| No-Code Agent Builder (UI/canvas) | Dev 3 | Dev 2 |
| Website Builder v2 | Dev 4 | Dev 3 |
| Integration, QA, E2E | Dev 5 | Dev 4 |
| GTM engine & analytics | Dev 4, Dev 5 | Dev 2 |
| Launch prep & performance | All | Dev 5 (coordinator) |

---

*Update names and roles in the table when you assign real team members. Copy this into your project wiki or Notion and keep it in sync with sprint planning.*
