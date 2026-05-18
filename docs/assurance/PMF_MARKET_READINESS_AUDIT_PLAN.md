# PayAid V3 — Product-Market Fit & Market-Readiness Audit Plan

**Status:** Planning and assessment only  
**Last updated:** 2026-05-17  
**Companion:** [`CROSS_MODULE_ASSURANCE_PLAN.md`](./CROSS_MODULE_ASSURANCE_PLAN.md) (security/control focus)  
**Out of scope:** New migration wave, `apps/analytics`, AI hub expansion, broad code cleanup

---

## 1. Audit framework (five lenses)

Apply **the same scorecard** to every module. Each lens produces findings tagged **P0** (blocks revenue/trust), **P1** (blocks design-partner expansion), **P2** (polish/competitive gap).

| Lens | What we judge | Primary evidence sources |
|------|----------------|---------------------------|
| **L1 — Core workflow completeness** | Can a target user finish the primary job without workarounds? | Route map, API list, staging scripts, support tickets |
| **L2 — Feature depth vs category** | Table-stakes vs differentiated vs missing vs competitors | Feature matrix, schema, marketing claims audit |
| **L3 — Security & trust controls** | AuthZ, audit, draft-first, data isolation, compliance copy honesty | Code grep, assurance SC-* checklist, pen-test items |
| **L4 — Usability & polish** | Shell consistency, empty/error states, perf, mobile, accessibility | UI walkthrough, bundle budgets, lint/UX audit |
| **L5 — Commercial / ICP fit** | Right buyer, pricing hooks, India/SMB specifics, integrator needs | Founder ICP doc, competitor teardown, win/loss notes |

**Per-module deliverable:** 1-page scorecard + ranked gap list + recommended tier (see §4).

**Audit methods key:**

| Code | Method |
|------|--------|
| **C** | Code + docs (static) |
| **S** | Staging / runtime |
| **M** | Customer / design-partner interview |
| **X** | Competitor / category benchmark |

---

## 2. Recommended audit order

Order optimizes **revenue desk credibility** (CRM + Finance + Projects), then **people ops**, then **acquisition stack**, then **voice** (narrow AI surface).

| Order | Module group | Rationale |
|-------|--------------|-----------|
| **1** | **CRM** | System of record; every other module hangs off contacts/deals |
| **2** | **Finance** | Money + GST trust; highest “market-ready” bar for India SMB |
| **3** | **Projects** | Fresh maturation batch; CRM/Finance handoffs must prove PMF story |
| **4** | **HR** | Sensitive data; enterprise buyers ask early |
| **5** | **Sales + Leads** | Acquisition loop; LI honesty gate (M1 positioning) |
| **6** | **Marketing + Social + Website Builder** | Growth surfaces; partial API split increases audit cost |
| **7** | **Voice** (not full AI hub) | Bolna path only; defer ai-studio submodules |

**Platform cross-cut (week 1, parallel):** Settings, entitlements, module launcher, billing — required for L5 on all modules.

---

## 3. Module definitions

### 3.1 CRM

| Field | Definition |
|-------|------------|
| **Primary JTBD** | “Capture and progress revenue relationships — contacts, deals, activities — so my team knows who to call and what to close.” |
| **Must-have workflow** | Contact CRUD → deal pipeline → activities/tasks → basic reporting → export → optional WhatsApp/email touchpoints |
| **Market-standard (India SMB / mid-market)** | Pipeline stages, owner assignment, deal value, contact dedupe, activity timeline, mobile-usable lists, RBAC, audit on stage changes, CRM→downstream handoff (project/invoice), inbound lead capture, basic automation |
| **Likely weak areas (repo state)** | Home bundle ~580 KB (perf perception); `@payaid/domain-crm` only started (segments/templates); many APIs still on dashboard; appointments/contracts remain dashboard SUB; AI score badges without clear “assist not autopilot” positioning; competitor depth in sequences/workflows vs HubSpot/Freshsales |

**Audit focus:** L1 pipeline E2E, L3 audit on deal mutations, L5 honest automation claims.

---

### 3.2 Finance

| Field | Definition |
|-------|------------|
| **Primary JTBD** | “Issue GST-compliant invoices, track receivables, and stay audit-ready without a separate accounting tool for day-one SMB.” |
| **Must-have workflow** | Customer master (from CRM) → draft invoice → GST lines (HSN/SAC, intra/inter state) → PDF/send → payment status → basic reports |
| **Market-standard** | GSTR-ready fields, e-invoice readiness (or clear “not yet”), credit notes, recurring invoices, multi-currency optional, role separation (creator vs approver), immutable audit trail, Tally/export bridge or documented gap |
| **Likely weak areas** | Thin `apps/finance` shell re-exporting `finance-module`; `typescript.ignoreBuildErrors` on finance app; compliance/legal still dashboard SUB; accounting/GL depth vs Zoho Books/Tally; Projects milestone handoff **new** — staging proof required; purchases/GST filing depth unknown without runtime |

**Audit focus:** L2 depth table, L3 draft-first on send, L5 “what we replace vs complement Tally.”

---

### 3.3 Projects & Service

| Field | Definition |
|-------|------------|
| **Primary JTBD** | “Deliver client work on time, track tasks/time, and bill milestones without losing CRM context.” |
| **Must-have workflow** | Project from CRM → tasks/milestones → time (optional) → milestone billing handoff → Finance draft |
| **Market-standard** | Gantt or Kanban, assignees, phases, budget vs actual, milestone billing, service packages/SLA (if ICP is agencies/IT services), client portal (often missing in SMB tools — document defer), resource utilization reports |
| **Likely weak areas** | Appointments integration **deferred**; service-packages/SLA complexity vs polish; list pages still gradient-heavy; only recent canonical app + handoffs; domain-projects minimal; B4-C04 history on Prisma shapes — verify runtime; Home was heavy (now split — confirm staging) |

**Audit focus:** L1 CRM→Project→Finance golden path, L4 shell consistency, L5 agency vs product-team ICP.

---

### 3.4 HR

| Field | Definition |
|-------|------------|
| **Primary JTBD** | “Run core HR ops — employees, attendance/leave, payroll prep — with compliance-friendly records.” |
| **Must-have workflow** | Employee master → org structure → leave/attendance → payroll run (or export) → payslips |
| **Market-standard** | Statutory India payroll fields (PF/ESI/PT where claimed), role-based access, audit on salary changes, document vault, self-service (often partial in SMB) |
| **Likely weak areas** | `ignoreBuildErrors` on HR app; Home ~603 KB; `@payaid/domain-hr` only employee list GET; training/LMS on dashboard SUB; enterprise SSO/HRIS export gaps; shallow domain package vs Keka/Zoho People |

**Audit focus:** L3 payroll audit (`lib/hr/audit-log.ts`), L2 statutory depth honesty, L5 “HR-only buyer” vs suite attach.

---

### 3.5 Sales + Leads

| Field | Definition |
|-------|------------|
| **Primary JTBD (Sales)** | “Publish landing/sales pages and convert traffic into CRM-ready leads.” |
| **Primary JTBD (Leads)** | “Import, score, and activate leads into CRM without junking the database.” |
| **Must-have workflow** | Sales page publish → form capture → CRM contact/deal; Leads import → review → activate → CRM link |
| **Market-standard** | A/B or variants, analytics on conversions, UTM capture, dedupe, consent/GDPR basics, LI enrichment with **honest** data sources (per §5 IMPLEMENTATION_STATUS: M1, no “live market” overclaim) |
| **Likely weak areas** | Sales app M2 thin shell; Leads/LI Prisma surface recently expanded — telemetry/audit verbs need consistency; discovery jobs synchronous M1; CRM sync optional — document; competitor: Apollo/ZoomInfo far ahead on enrichment |

**Audit focus:** L5 messaging honesty, L1 activate→CRM path, L3 consent + audit on activation.

---

### 3.6 Marketing + Social + Website Builder

| Field | Definition |
|-------|------------|
| **Primary JTBD** | “Plan and publish marketing across web and social from one licensed suite.” |
| **Must-have workflow** | Campaign/content calendar → WB site publish → social post schedule → basic performance view |
| **Market-standard** | OAuth connectors, post scheduling, asset library, SEO basics on WB, template gallery, approval before publish |
| **Likely weak areas** | Social **POST** APIs still on dashboard (list GET on `apps/social`); WB orphan panels under `Sites/[id]/`; marketing vs social split confusion; bundle/perf; no unified analytics (SUB only — out of scope); vs HubSpot Marketing / Webflow |

**Audit focus:** L1 publish paths, L4 connector UX, L2 depth per sub-product (treat as 3 sub-scores).

---

### 3.7 Voice (+ AI boundary)

| Field | Definition |
|-------|------------|
| **Primary JTBD** | “Run outbound/inbound voice agents that take **draft-first** actions on CRM/Finance data.” |
| **Must-have workflow** | Agent config → call → tool use → audit log → human review for sensitive tools |
| **Market-standard** | Telephony provider integration, recording consent, fallback handling, per-tenant entitlements, tool guardrails |
| **Likely weak areas** | **AI hub submodules deferred** — do not score ai-chat/insights/logo as launchable; Voice M3 strongest; Bolna bridge audit patterns exist; dashboard mirror routes; competitor: Bland/Vapi — developer-first vs SMB operator UX |

**Audit focus:** L3 tool bridge + draft-first, L5 narrow “voice agents” SKU vs “full AI workspace.”

**Explicit exclusion:** ai-studio, ai-cofounder, ai-chat, ai-insights, logo-generator, knowledge-rag — **not scored** in this audit cycle.

---

## 4. Scoring rubric

Score **each lens** 1–5, then assign **module tier** = lowest lens score unless overridden with documented risk acceptance.

| Tier | Label | Meaning | Typical go-to-market |
|------|-------|---------|----------------------|
| **1** | **Not launchable** | Core workflow broken or trust P0; would damage brand | Internal only |
| **2** | **Internal beta** | Happy path works for team; gaps in edge cases, audit, or depth | Dogfood, no paying external |
| **3** | **Design partner ready** | 2–3 reference customers with weekly support; known gaps documented | Paid pilot, tight scope |
| **4** | **Limited launch ready** | Market-standard core met; weaknesses are documented deferrals | SKU in suite with clear boundaries |
| **5** | **Market ready** | Competitive on core JTBD for ICP; security/evidence complete | General availability marketing |

**Lens scoring guide (abbreviated):**

| Score | L1 Workflow | L2 Depth | L3 Trust | L4 UX | L5 ICP |
|-------|-------------|----------|----------|-------|--------|
| 1 | Cannot complete JTBD | <50% table stakes | P0 security open | Broken shell | Wrong buyer |
| 2 | Happy path only | 50–70% | Partial audit/RBAC | Major perf/404 | Weak value prop |
| 3 | + edge cases w/ support | 70–85% | Draft-first on money | Consistent shell | Clear niche |
| 4 | Self-serve core | 85–95% | Staging evidence | Budgets met | Wins vs 1 competitor |
| 5 | Self-serve + scale | Full category core | Prod evidence | Delight polish | Repeatable wins |

**Suite rollup:** Revenue Desk (CRM+Finance+Projects) = **min(CRM, Finance, Projects)** for “Revenue SKU” tier. Do not market suite GA if any of the three is tier ≤2.

---

## 5. Three-to-five week audit schedule

### Week 1 — Foundation + Revenue graph

| Focus | Modules | C / S / M / X |
|-------|---------|---------------|
| Platform entitlements, Settings, billing hooks | PLAT | C + S |
| **CRM** full scorecard | CRM | C + S + X (Zoho CRM / Freshsales) |
| **Finance** core invoice/GST | Finance | C + S + X (Zoho Invoice / Tally complement) |

**Outputs:** CRM + Finance tier drafts; Revenue Desk risk register started.

---

### Week 2 — Delivery loop + People

| Focus | Modules | C / S / M / X |
|-------|---------|---------------|
| **Projects** maturation + handoffs | Projects | C + **S** (PR #10 checklist) + M (agency ICP) |
| **HR** payroll/employee | HR | C + S + X (Keka / Zoho People lite) |
| Cross-module golden path | CRM→Projects→Finance | **S** only |

**Outputs:** Projects tier; golden-path pass/fail; HR tier.

---

### Week 3 — Acquisition stack

| Focus | Modules | C / S / M / X |
|-------|---------|---------------|
| **Leads / LI** | Leads | C + S + **M** (honest enrichment story) |
| **Sales pages** | Sales | C + S + X (Unbounce / Leadpages lite) |
| **Marketing** | Marketing | C + S |
| **Social** | Social | C + S (connector smoke) |
| **Website Builder** | WB | C + S |

**Outputs:** Growth SKU tier = min(Marketing, Social, WB, Sales, Leads); LI messaging sign-off.

---

### Week 4 — Voice + synthesis (required if 5-week plan)

| Focus | Modules | C / S / M / X |
|-------|---------|---------------|
| **Voice / Bolna** | Voice | C + S + M (pilot customer) |
| Suite rollup + GTM boundaries | All | Workshop |
| Competitor positioning one-pager | Revenue + Growth | X |

**Outputs:** Voice tier; suite GA recommendation; module tier matrix published.

---

### Week 5 (optional) — Validation buffer

| Focus | Activity |
|-------|----------|
| Design-partner calls | 3–5 interviews using scorecard gaps |
| Staging re-runs | Fix-only P0 retest (no new features) |
| GTM | Pricing/packaging vs tier matrix |

---

### What runs where (summary)

| Activity | C | S | M | X |
|----------|---|---|---|---|
| Route/API inventory | ✓ | | | |
| `requireModuleAccess` / audit grep | ✓ | | | |
| Build + bundle budgets | ✓ | | | |
| IMPLEMENTATION_STATUS / roadmap | ✓ | | | |
| Golden-path scripts | | ✓ | | |
| GST invoice scenarios | | ✓ | | |
| OAuth/social/WAHA connectors | | ✓ | | |
| Design-partner fit | | | ✓ | |
| Category table-stakes | | | | ✓ |
| Win/loss vs named competitor | | | ✓ | ✓ |

---

## 6. Top expected risk areas by module

| Module | Top risks (PMF / market) | Tier risk (initial hypothesis) |
|--------|--------------------------|--------------------------------|
| **CRM** | Perf perception (large Home); workflow automation depth; appointments/contracts still dashboard | **3–4** |
| **Finance** | GL/accounting depth vs Tally; e-invoice; thin canonical app; handoff regression | **3** (4 if staging perfect) |
| **Projects** | Staging unproven; appointments deferred; SLA complexity vs UX; agency reporting | **3** post-maturation |
| **HR** | Statutory payroll depth; build errors ignored; domain package thin | **2–3** |
| **Sales** | Thin SPA; funnel analytics | **2–3** |
| **Leads** | Overclaiming enrichment; M1 discovery | **2** (honest pilot only) |
| **Marketing** | Fragmented vs social/WB | **3** |
| **Social** | API split incomplete | **2–3** |
| **Website Builder** | Orphan UI; publish reliability | **2–3** |
| **Voice** | Narrow but deep; AI hub confusion if bundled wrong | **3** (voice only) |
| **Suite** | Selling “full Zoho replacement” before Finance/HR tier 4 | **GTM P0** |

---

## 7. Go / no-go for market messaging (PMF gates)

| Gate | Criteria |
|------|----------|
| **Revenue Desk GA message** | CRM, Finance, Projects all ≥ **4** on L1 and L3; golden path passed on staging |
| **Growth pack message** | Sales + Leads + (Marketing or WB) ≥ **3**; LI claims match §5 IMPLEMENTATION_STATUS |
| **HR add-on** | HR ≥ **3** and payroll audit verified |
| **Voice SKU** | Voice ≥ **3**; AI hub not mentioned in GA |
| **NO-GO** | Any module at tier **1** in L3; LI “live market data” language; Finance send without draft/audit |

---

## 8. References

- `docs/IMPLEMENTATION_STATUS.md` — Wave 2 status, LI honesty, bundle baselines  
- `docs/architecture/platform-module-map.md` — maturity M0–M4  
- `docs/architecture/platform-separation-roadmap.md` — residuals  
- `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` — integration completeness  
- `docs/assurance/CROSS_MODULE_ASSURANCE_PLAN.md` — security waves  
