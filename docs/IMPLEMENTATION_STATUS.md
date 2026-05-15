# PayAid V3 — implementation status (founder-facing)

**Last updated:** 2026-05-15 (UTC)  
**Operational pass (production + UTF-8 evidence):** **`origin/main`** is at **`d7cc86746`** (cherry-pick **`8628505e0`** = same tree as **`4bcf754ad`**, plus merge **`d7cc86746`** with **`-s ours`** so **`git merge-base --is-ancestor 4bcf754ad origin/main`** returns **0**). Active **`main`** worktree: **`D:\Cursor Projects\PayAid-V3-main-sync`** — **clean** after push. **Chore** worktree (`d:\Cursor Projects\PayAid V3`): branch **`chore/dashboard-main-build-sync`**; **`4bcf754ad`** remains the canonical LI commit object. **`docs/evidence/typecheck-dashboard-latest.txt`:** refreshed after **B4-R02** batch — **`ERROR_TS_COUNT: 22`** (was **33** before **`packages/leads-core`** `InputJsonValue` persistence fix). **Vercel production:** **not verified** in-session — latest GitHub **Deployments** API entries still pointed at **`ad7feeb`** ~45s after push (Vercel may lag); re-check dashboard deployment for SHA **`d7cc86746`** before closing production verification.  
**Execution contract:** Blockers first (Prisma → build integrity → nav → placeholders → core OS → LI M1 → …). **No** Lead Intelligence / CRM / Sales / Email / Finance **feature** work until **(a)** **A10** is closed *or* a **reachable staging / clone DB path is explicitly approved**, **and (b)** **typecheck remediation** has an **explicit plan** (§12 batches + owner), even though **B3 is now evidenced as red** with a full artifact (`docs/evidence/typecheck-dashboard-latest.txt`).

---

## Blocker summary (quick)

| Blocker | ID | Status |
|---------|-----|--------|
| Prisma canonical schema + migrations + generate | A1–A9 | **Approved / done** |
| Prisma migrate on real DB + `_prisma_migrations` audit | **A10** | **Open** — see §10 |
| TS-ignore policy (strict by default on Vercel) | B1–B2 | **Approved / done** |
| `typecheck:dashboard` (artifact + green gate) | **B3** | **Open** — **red**; **`ERROR_TS_COUNT: 22`** in `docs/evidence/typecheck-dashboard-latest.txt` (2026-05-15, post **B4-R02** `leads-core` batch) — see §11 |
| Typecheck remediation **execution queue** | **B4** | **Open** — §12 **collapse + repair**; **B4-C04 deferred**; next waves **B4-C03** (done) → **R06** → **R07** → **R08** — **no** nav/UI-only in this phase. |

---

## 1. Blocker A — Prisma unification

| Check | Status | Notes / proof |
|-------|--------|----------------|
| **A1** Canonical schema path | **Done** | `packages/db/prisma/schema.prisma` |
| **A2** Canonical migrations path | **Done** | `packages/db/prisma/migrations/` |
| **A3** Root `package.json` scripts use `--schema` | **Done** | **Re-verified 2026-05-14:** all `db:*`, `build:with-prisma`, `build:with-db`, `db:local:setup`, `db:studio*` include `--schema packages/db/prisma/schema.prisma` (a brief regression without `--schema` on `db:migrate:*` / `db:push` was corrected the same day). |
| **A4** `scripts/prisma-generate-with-retry.js` | **Done** | Local Prisma CLI + `shell: false` + absolute `--schema` |
| **A5** `packages/db/package.json` generate | **Done** | `prisma generate --schema prisma/schema.prisma` (cwd = `packages/db`) |
| **A6** `scripts/run-migrations-vercel.ts` | **Done** | Canonical schema + `packages/db/prisma/migrations` probe |
| **A7** Duplicate root schema | **Removed** | Archive: `docs/archive/prisma-schema.root.pre-canonical-2026-05-14.prisma` |
| **A8** Duplicate root migrations | **Removed** | Merged under `packages/db/prisma/migrations/` |
| **A9** `prisma generate` | **Done (local)** | `npm run db:generate:loose` → client in `node_modules/@prisma/client` |
| **A10** Runtime migrate proof | **Open** | **Not** satisfied in this environment — see **§10**. |

**Non-canonical Prisma files (informational only):**  
`prisma/schema-additional-models.prisma`, `prisma/proposals/*.prisma`, `prisma/phase3-schema-additions.prisma`, `prisma/industry-models-addition.prisma` — not loaded by CLI until merged into canonical schema.

---

## 2. Blocker B — build integrity

| Check | Status | Notes |
|-------|--------|--------|
| **B1** TS-ignore | **Done** | `apps/dashboard/next.config.mjs`: ignore only if `VERCEL=1` **and** `PAYAID_VERCEL_IGNORE_TS_ERRORS=1`. |
| **B2** Deadline | **Tracked** | **2026-06-15** or 14 days after green `typecheck:dashboard` on Vercel. |
| **B3** `typecheck:dashboard` | **Open** | **Fail** — **`ERROR_TS_COUNT: 22`** (`docs/evidence/typecheck-dashboard-latest.txt`, 2026-05-15); historical **76**-line capture: `docs/evidence/typecheck-dashboard-b4c01.txt` — **§11**. |
| **B4** Remediation | **Open** | **§12** execution queue (collapse **B4-C01–C03, C05–C08**; **defer B4-C04**; repair waves **R06–R08** per §12); assign owners + dates. |

---

## 10. A10 — Prisma runtime proof (staging / clone) — **required**

### A10 environment plan (do **not** retry the unreachable pooler on a loop)

| Step | Action |
|------|--------|
| **1. Pick a reachable target** | Use **one** of: Supabase **direct** (non-pooler) `DATABASE_URL`, **staging clone** with credentials your network can reach, **corporate VPN** to the network that can reach the existing pooler, or **local Docker** Postgres (`npm run db:migrate:status:local` / `db:migrate:deploy:local` after `db:local:up`). |
| **2. Point `.env` once** | Set `DATABASE_URL` (and `DATABASE_DIRECT_URL` if your runbook requires it for migrate) **only** for that session or a dedicated `.env.staging.local` you load explicitly — avoid hammering the same **P1001** host from CI/agents. |
| **3. Run migrate** | From repo root: `npm run db:migrate:status` then `npm run db:migrate:deploy` (both use `--schema packages/db/prisma/schema.prisma`). |
| **4. Verify history** | SQL against `_prisma_migrations` (below); confirm no unexpected duplicate migration names / checksum surprises after path unification. |
| **5. Record proof** | Paste CLI tail + migration summary into **this §** and optionally `docs/evidence/prisma-migrate-staging-<date>.txt`. |

**Until then:** treat prior **P1001** attempts against `*.pooler.supabase.com` as **environment-blocked**, not schema bugs.

**Commands (from repo root, with `.env` pointing at target DB):**

```bash
npm run db:migrate:status
npm run db:migrate:deploy
```

**Evidence captured (2026-05-14) — blocked only on reachability:**

- **Canonical script (current `package.json`):** `npm run db:migrate:status` → `prisma migrate status --schema packages/db/prisma/schema.prisma`.
- **Recorded run (task `431802`, exit 1):** Env loaded from `.env`; schema from `packages\db\prisma\schema.prisma`; datasource PostgreSQL at Supabase pooler `aws-1-ap-northeast-1.pooler.supabase.com:5432` → **`P1001: Can't reach database server`** — no `migrate deploy`, no `_prisma_migrations` inspection.
- **Re-run (`946965`, exit 1, ~6m):** Same **P1001** after connection timeout — confirms blocker is reachability (VPN / firewall / pooler vs direct URL), not schema discovery.
- **Historical note:** An older run without `--schema` on the npm script (`853744`) failed with *Could not find Prisma Schema* and defaulted to missing `prisma/schema.prisma`. **Current** root scripts include `--schema` for all migrate/push/studio paths — do not run bare `prisma migrate status` from repo root without the flag.

**Operator checklist (per environment):**

1. Re-run the two commands above when the DB is reachable.  
2. Confirm deploy exits **0** and logs show only expected pending migrations applied.  
3. Query `_prisma_migrations` (no duplicate **folder names** applied twice from different paths — names are unified; if a DB had divergent manual history, compare checksums):

```sql
SELECT migration_name, finished_at, success
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 50;
```

4. Paste a **short** summary (last lines of CLI + row count / “all applied”) into this section or `docs/evidence/prisma-migrate-staging-<date>.txt` and set **A10 → Done** in the summary table.

---

## Prisma safety note (read before closing A10)

- Migrations were **unified by filesystem path** under `packages/db/prisma/migrations/` (including former root SQL folders). **Prisma tracks history by migration folder name** in `_prisma_migrations`, not by repo path.
- **Each** production/staging database still needs **`migrate deploy`** validation after cutover — pooler-only hosts may require **direct** URL for migrate (documented in `scripts/run-migrations-vercel.ts` header).
- **Before marking A10 fully closed:** confirm no environment has **orphaned** or **re-applied** migrations (checksum / errors). If a database was partially migrated with an old tool path, resolve with DBA review — do not assume.

---

## 11. B3 — Typecheck proof (source of truth: `docs/evidence/typecheck-dashboard-latest.txt`)

**Command:** `npm run typecheck:dashboard`  
**Strict Vercel-equivalent:** `ignoreBuildErrors` is **false** unless `PAYAID_VERCEL_IGNORE_TS_ERRORS=1`.

**Current UTF-8 capture (2026-05-15):** **`ERROR_TS_COUNT: 22`** in `docs/evidence/typecheck-dashboard-latest.txt` — down from **33** after **B4-R02** (`packages/leads-core`: `src/prisma-json.ts` + `toInputJson()` at Prisma JSON persistence boundaries). **Next batch (B4-R03):** **website builder / `site-schema` exports / `WebsiteSiteSchemaJson.canvas` + public LP `WebsiteSettingsPublicLayoutProps`** (largest remaining cluster).

**Before / after (B4-C01):** baseline full dashboard `tsc` had **~193** `error TS` lines. **After B4-C01** (schema + `prisma generate` + full `tsc`, exit **2**): **76** `error TS` lines — authoritative line count in **`docs/evidence/typecheck-dashboard-b4c01.txt`** (UTF-16 LE capture from the same run).

**Projects cluster (important):** remaining **`app/api/projects/**`** issues in that artifact are **mostly `select` / `include` shape repair** and inferred `project` payload typing — **not** “missing `Project` model / delegate” in the sense of absent Prisma models after **B4-C01**.

### Post–B4-C01 — top 10 error **groups** (76-line artifact)

| # | Group | ~Lines | Notes |
|---|--------|--------|--------|
| 1 | **LI Prisma delegates missing** (`leadActivationDraft`, `leadReviewItem`, `leadDiscoveryJob`) | **~21** | Next **schema collapse** (B4-C03-style) or trim routes. |
| 2 | **`packages/leads-core` JSON → `InputJsonValue`** | **~14** | **B4-R01** repair batch. |
| 3 | **Project `GET` select / include shape** (`timeEntries`, `milestones`, `servicePackage`, task includes on inferred `project`) | **~5–8** | **App repair** on `prisma.project.*` queries — **not** missing `Project` / milestone models post–C01. |
| 4 | **Website builder / `site-schema` / public LP** | **~9** | **B4-R03** (exports + `WebsiteSiteSchemaJson`). |
| 5 | **Finance `@/lib/url/query-state` missing** | **4** | **B4-R04**. |
| 6 | **`web-vitals` + `instrumentation-client`** | **1** | **B4-R04**. |
| 7 | **`framer-motion` stub JSX** | **4** | **B4-R05**. |
| 8 | **`lib/lead-intelligence`** (JSON audit + `LeadAccount`/`LeadContact` composite keys) | **~5** | Mix schema + repair (`@@unique` / field names). |
| 9 | **LI telemetry literal vs enum** | **2** | **B4-R02** / **G5**. |
| 10 | **Misc** (`ai/image/status` arity, `Projects/new` cast, SLA route select edge) | **~6** | Small **B4-R** items. |

### Top 20 errors (post–B4-C01 artifact — first 20 lines)

| # | Location | Code | Summary |
|---|----------|------|---------|
| 1 | `app/api/ai/image/status/route.ts:45` | TS2554 | Expected **0** args, got **1**. |
| 2 | `app/api/inventory/stock-movements/route.ts:248` | TS2353 | **`reason`** not on `StockTransferCreateInput` *(add `reason` field — done in schema micro-patch; re-run `tsc`)*. |
| 3–13 | `app/api/lead-intelligence/activation/**`, `review/**` | TS2339 / TS2724 | **`leadActivationDraft`**, **`leadReviewItem`**, missing `LeadActivationDraftWhereInput`. |
| 14–15 | `app/api/lead-intelligence/discovery/jobs/**` | TS2339 | **`leadDiscoveryJob`** missing on client. |
| 16–17 | `app/api/lead-intelligence/discovery/people/route.ts` | TS2345 | Telemetry strings vs **`LeadIntelligenceTelemetryAction`**. |
| 18–24 | `app/api/lead-intelligence/review/items/**` | TS2339 / TS2724 | **`leadReviewItem`** / **`LeadReviewItemWhereInput`**. |
| 25 | `app/api/projects/.../milestones/.../approve/route.ts:137` | TS2353 | **`approvedById`** on milestone update *(field added in micro-patch; re-run `tsc`)*. |
| … | *(see full artifact)* | — | Remaining rows in **`typecheck-dashboard-latest.txt`**. |

### Grouped root causes (B3)

| Group | Root cause | Typical codes |
|-------|------------|---------------|
| **G1 — Prisma model / delegate gap** | Code calls **`prisma.<model>`** or transaction APIs for models **not** on generated `PrismaClient` (milestones, phases, service packages, SLA, inbound logs, unibox, specialist log, etc.). | TS2339, TS2724 |
| **G2 — Prisma field / shape drift** | **Create/update/select** use fields Prisma types say are invalid (`providerAvatarUrl`, `leadRouting`, `movementType`, `currency`, `phaseId`, `replyStatus`, `linkedLandingPageId`, `internalNotes`, time-entry billing fields, …). | TS2353, TS2551 |
| **G3 — Prisma JSON (`InputJsonValue`)** | Plain objects / **`unknown[]`** / domain records passed where Prisma expects **`InputJsonObject`**-compatible JSON. | TS2322 |
| **G4 — App typing / modules** | Missing **`@/lib/url/query-state`**, missing **`web-vitals`**, **`WebsiteSiteSchemaJson` / canvas** exports, **`framer-motion` stub** JSX namespace, **`Promise<any>`** misuse in projects UI. | TS2307, TS2305, TS2339, TS2503, TS2352 |
| **G5 — Domain enums / literals** | Telemetry / action strings **not** assignable to declared union types (`LeadIntelligenceTelemetryAction`). | TS2345 |

### Error taxonomy (post–B4-C01, **76** lines)

| Layer | ~Count | Notes |
|-------|--------|--------|
| **Prisma / schema gaps (LI drafts/review/discovery)** | **~26** | Remaining **delegate** names + `Lead*` where inputs. |
| **Prisma JSON / leads-core** | **~14** | `packages/leads-core` services. |
| **App selects / includes (projects GET)** | **~5** | Route typing, not missing `Project` model. |
| **Deps / UI typing (finance, web-vitals, website-builder, stub)** | **~22** | **B4-R04–R05**, **B4-R03**. |
| **Shared `lib/lead-intelligence`** | **~5** | Composite unique / field drift. |
| **Tests** | **0** | — |

*(Approximate; grep `error TS` in latest artifact for authoritative list.)*

### After **B4-C03** (Lead Intelligence Prisma surface — **executed 2026-05-14**)

**Schema:** `LeadReviewItem`, `LeadActivationDraft`, `LeadDiscoveryJob` (+ enums and `Tenant` / `LeadSegment` / `LeadAccount` / `LeadContact` wiring) — see **B4-C03** row in §12 for the exact field list.

**Typecheck:** run **`npm run db:generate`** (only when `packages/db/prisma/schema.prisma` changes) then **`npm run typecheck:dashboard`**, capturing **`docs/evidence/typecheck-dashboard-latest.txt` in UTF-8** (avoid default `Tee-Object` encoding; prefer `Set-Content -Encoding utf8` or the repo runbook). A definitive post–C03 `error TS` line count was **not finalized** in the agent session (long `tsc` + prior evidence encoding drift).

**Expected effect:** the **~21**-line **LI Prisma delegate / `Prisma.*WhereInput`** cluster from the post–B4-C01 artifact should **collapse** once the generated client matches the canonical schema. **Indicative** remaining count after that collapse: **~55** `error TS` lines (76 − ~21) — **re-verify** with a completed local `tsc`.

**Expected top clusters after C03** (until the next UTF-8 artifact replaces this list): **`packages/leads-core` JSON / `InputJsonValue`**, **projects `select` / `include`**, **`lib/lead-intelligence`** (JSON + upsert input shapes), **website-builder / `site-schema` / layout props**, **finance `query-state`**, **`web-vitals`**, **`framer-motion` stub**, **misc** (e.g. `ai/image/status`, instrumentation, SLA edges if any remain).

**Repair batches B4-R06 → R08 (code landed 2026-05-14):** LI telemetry union extended (`people_*`), `lib/lead-intelligence` audit + discovery-job Prisma JSON casts, activation drafts `payload` cast, `@payaid/leads-core` services JSON helpers + **`@prisma/client`** devDependency, **`lib/website-builder/site-schema`** canvas model + merge + **`WebsiteSettingsPublicLayout` / `homeCanvasBlocks`**, new **`lib/url/query-state`**, **`web-vitals`** on dashboard package, **`framer-motion` stub** `React.JSX`, **`app/api/projects/[id]`** include cleanup + time-entry JSON mapping, **`stock-movements`** reference folded into **`notes`**, **`checkSelfHostedImageHealth(signal?)`**, **`Projects/new`** `useQuery` return typing. **Authoritative post-wave `error TS` count** = next completed **`npm run typecheck:dashboard`** with UTF-8 evidence (prior stable dashboard-only count before this wave: **~48** lines).

**Still required for strict B3 “green”:** `tsc` **exit 0** + refreshed UTF-8 evidence file.

| Field | Value |
|-------|--------|
| Pass / fail | **Fail** |
| Error count | **~48** `error TS` (last stable full-dashboard count **before** R06→R08 patches; **replace** after next UTF-8 `typecheck-dashboard-latest.txt`) — **76** still on record for post–**B4-C01** (`docs/evidence/typecheck-dashboard-b4c01.txt`) |
| Artifact | `docs/evidence/typecheck-dashboard-latest.txt` (UTF-8 after each run) |

---

## 12. B4 — Execution queue (typecheck remediation)

**Source of truth:** `docs/evidence/typecheck-dashboard-latest.txt` — **re-count `error TS` after each batch** (UTF-8 capture). **Scope:** A10 environment proof + Prisma/schema + typecheck remediation only — **no** feature work, **no** nav/route/UI cleanup until this queue advances.

**Owners:** assign a human next to each role in your tracker (`Platform` = schema/migrate/generate; `Dashboard` = `apps/dashboard`; `Shared` = repo-root `lib/`; `Workspace` = `packages/*`).

**Re-run rule:** after each **collapse** or **repair** batch, run **`npm run typecheck:dashboard`**, then overwrite the evidence file using **UTF-8**; update §11 counts. **`prisma generate`** only when **`packages/db/prisma/schema.prisma`** changes.

**Next execution order (approved 2026-05-14):** **B4-C03** (done) → **B4-R06** → **B4-R07** → **B4-R08**. **Do not** continue **B4-C04** in this sequence (projects errors are handled as **app `select` / `include` repairs** and related batches, not an immediate C04 collapse).

| Wave | Scope (this plan) | Maps to existing batch IDs |
|------|-------------------|----------------------------|
| **B4-R06** | Lead Intelligence routes + **`packages/leads-core`** JSON / telemetry / Prisma `select` issues | **B4-R01**, **B4-R02**, and remaining LI-specific repairs |
| **B4-R07** | Website-builder / **`site-schema`** / layout props | **B4-R03** |
| **B4-R08** | `@/lib/url/query-state`, **`web-vitals`**, **`framer-motion` stub**, misc small fixes | **B4-R04**, **B4-R05**, plus stragglers from §11 |

**Status (2026-05-14):** **B4-R06 → R08** repair code is **landed** in-repo; **next gate** = complete **`npm run typecheck:dashboard`** + UTF-8 evidence, then **re-triage** remaining lines (expect shrink vs **~48** baseline; SLA / milestone / other routes may still lead).

**Next commit scope:** limit diffs to files touched by **B4-C03** and the **direct repair batches** that follow it in the order above; **regenerate Prisma only if the schema changes**; **full `typecheck:dashboard` after each collapse batch**.

---

### A — Error-collapsing work (schema / generate / single structural fixes)

#### B4-C01

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C01 |
| **Type** | **collapse** |
| **Primary cause** | Generated `PrismaClient` and `Prisma.*` types are **missing models, delegates, and fields** that API + `lib/**` already call (G1/G2 bulk). |
| **Likely files / folders** | `packages/db/prisma/schema.prisma`; then **consumers** (grep-driven): `apps/dashboard/app/api/**`, `lib/**` (esp. `lib/api/projects/`, `lib/crm/`, `lib/ai-native/`, `lib/website-builder/`), `packages/leads-core/` — *edits mainly in schema for collapse*. |
| **Approx TS errors affected** | **~110–150** of ~193 pre-batch; **observed −117** (193 → **76**) after first full `tsc` post-generate. |
| **Depends on** | None for **`prisma generate`** — **no DB required**. (Applying **migrations** to a real DB is **A10**, separate.) |
| **Owner** | **Platform (Prisma)** — assign engineer. |
| **Done when** | **`EXECUTED 2026-05-14`:** `schema.prisma` updated (see repo diff); `prisma generate` **OK** (Prisma Client v5.22.0 → `node_modules/@prisma/client`); full `typecheck:dashboard` **exit 2** with **76** errors logged to evidence file; remaining errors re-triaged in §11. **Follow-up micro-patch** same day: `ProjectMilestone.approvedById`, `ProjectTask.milestoneId` + relation, `StockTransfer.reason`, `ServiceSlaIncident.acknowledgedAt` — **re-run `prisma generate` + `tsc`** locally to refresh counts. |

#### B4-C02

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C02 |
| **Type** | **collapse** |
| **Primary cause** | `OAuthIntegration` type lacks **`providerAvatarUrl`** used everywhere in OAuth flows. |
| **Likely files / folders** | `packages/db/prisma/schema.prisma` (`OAuthIntegration`); `apps/dashboard/app/api/integrations/{facebook,instagram,linkedin,twitter,youtube}/callback/route.ts`; `apps/dashboard/app/api/settings/social/connect/route.ts`; `apps/dashboard/app/api/settings/social/route.ts` |
| **Approx TS errors affected** | **~14–16** (artifact grep `providerAvatarUrl`). |
| **Depends on** | **B4-C01** client regenerated after schema change. |
| **Owner** | **Platform** (+ **Dashboard** if product chooses “remove field from code” instead — then flip to **repair** path B4-R-OAuth). |
| **Done when** | Either column exists in schema **and** generate **or** field removed from all selects/creates/updates; **zero** `providerAvatarUrl` errors in typecheck. |

#### B4-C03

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C03 |
| **Type** | **collapse** |
| **Primary cause** | Lead Intelligence **delegate + model surface** missing on `PrismaClient`: **`leadActivationDraft`**, **`leadReviewItem`**, **`leadDiscoveryJob`** and related `Prisma.*WhereInput` / upsert types; plus **CRM link fields** on lead rows for canonical discovery sync. |
| **Likely files / folders** | `packages/db/prisma/schema.prisma` (**only** file for collapse); consumers: `apps/dashboard/app/api/lead-intelligence/**`, `lib/lead-intelligence/**` |
| **Approx TS errors affected** | **~21** LI delegate / where-input lines in post–B4-C01 artifact (plus downstream LI typing). |
| **Depends on** | **B4-C01** (regen). |
| **Owner** | **Platform (Prisma)** + **Dashboard / Shared (LI)** reviewer. |
| **Done when** | **`EXECUTED 2026-05-14`:** canonical schema includes **models** `LeadReviewItem`, `LeadActivationDraft`, `LeadDiscoveryJob`; **enums** `LeadReviewRecordType`, `LeadReviewDisposition`, `LeadActivationDraftStatus`, `LeadDiscoveryJobStatus`; **Tenant** relations `leadActivationDrafts`, `leadReviewItems`, `leadDiscoveryJobs`; **LeadSegment** `discoveryJobs`; **LeadAccount** optional `crmAccountId`, relation `reviewItems`, `@@unique([tenantId, crmAccountId])`; **LeadContact** optional `crmContactId`, relation `reviewItems`, `@@unique([tenantId, crmContactId])`; **LeadReviewItem** ↔ **LeadActivationDraft** link via `activationDrafts` / `leadReviewItem`. Then **`prisma generate`** and full **`typecheck:dashboard`** — expect LI delegate cluster to clear; **re-triage** §11. |

#### B4-C04

**Status:** **DEFERRED** — do **not** execute next in the approved queue. Post–B4-C01 **projects** errors are **primarily `select` / `include` / inferred payload** repairs on existing models, not missing `Project` delegates.

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C04 |
| **Type** | **collapse** |
| **Primary cause** | Projects domain missing on client: **`projectMilestone`**, **`projectPhase`**, **`servicePackage`**, **`serviceSlaIncident`**, **`TimeEntry`** billing fields, **`Project`** relations / scalar fields (`currency`, `servicePackageId`, …). |
| **Likely files / folders** | `packages/db/prisma/schema.prisma`; `apps/dashboard/app/api/projects/**` (~62 lines in artifact); `lib/api/projects/**` (~22 lines) |
| **Approx TS errors affected** | **~75–90** (combined projects API + lib clusters; overlaps C01). |
| **Depends on** | **B4-C01**. |
| **Owner** | **Platform** + **Shared (projects lib)**. |
| **Done when** | `servicePackage`, `projectMilestone`, `projectPhase`, `serviceSlaIncident` resolve on `prisma`; `TS2615` aggregate errors in `service-packages/route.ts` gone or reduced to follow-up. |

#### B4-C05

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C05 |
| **Type** | **collapse** |
| **Primary cause** | **`WorkflowExecution`** missing **`replyStatus`**, **`repliedAt`** (or equivalent) used by sequences reply route. |
| **Likely files / folders** | `packages/db/prisma/schema.prisma`; `apps/dashboard/app/api/v1/sequences/[id]/enrollments/[enrollmentId]/reply/route.ts` |
| **Approx TS errors affected** | **~6** |
| **Depends on** | **B4-C01**. |
| **Owner** | **Platform** + **Dashboard** (sequences). |
| **Done when** | No `replyStatus` / `repliedAt` Prisma select/update errors in that route. |

#### B4-C06

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C06 |
| **Type** | **collapse** |
| **Primary cause** | **`Website`** model missing **`linkedLandingPageId`** used by legacy bridges. |
| **Likely files / folders** | `packages/db/prisma/schema.prisma`; `lib/website-builder/landing-legacy-bridge.ts`; `lib/website-builder/legacy-page-tree-bridge.ts`; `lib/website-builder/published-lp-load.ts` |
| **Approx TS errors affected** | **~10** |
| **Depends on** | **B4-C01**. |
| **Owner** | **Platform** + **Shared (website-builder)**. |
| **Done when** | Zero `linkedLandingPageId` Prisma where/update errors in typecheck. |

#### B4-C07

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C07 |
| **Type** | **collapse** |
| **Primary cause** | **`StockTransfer`** / inventory API expects **`movementType`** not on generated type. |
| **Likely files / folders** | `packages/db/prisma/schema.prisma`; `apps/dashboard/app/api/inventory/stock-movements/route.ts` |
| **Approx TS errors affected** | **~2** |
| **Depends on** | **B4-C01**. |
| **Owner** | **Platform** + **Dashboard**. |
| **Done when** | `movementType` errors cleared in stock-movements route. |

#### B4-C08

| Field | Value |
|--------|--------|
| **Batch ID** | B4-C08 |
| **Type** | **collapse** |
| **Primary cause** | **Unibox** + **specialist** models missing: `uniboxConversation`, `uniboxMessage`, `specialistActivityLog`. |
| **Likely files / folders** | `packages/db/prisma/schema.prisma`; `lib/ai-native/m1-conversation-service.ts`; `lib/ai/specialists/audit.ts` |
| **Approx TS errors affected** | **~13** |
| **Depends on** | **B4-C01**. |
| **Owner** | **Platform** + **Shared (ai-native)**. |
| **Done when** | No `PrismaClient` errors for those delegates in listed files. |

---

### B — Error-repair work (code / types / deps; minimal schema)

#### B4-R01

| Field | Value |
|--------|--------|
| **Batch ID** | B4-R01 |
| **Type** | **repair** |
| **Primary cause** | **`InputJsonValue`** / Prisma JSON: domain objects and `unknown[]` not assignable without mappers. |
| **Likely files / folders** | `packages/leads-core/src/services/**` (~14 errors); optionally shared `lib/lead-intelligence/**` JSON writes |
| **Approx TS errors affected** | **~14** (leads-core cluster) + **shared LI** if still red. |
| **Depends on** | **B4-C01** complete (so JSON target types are stable). |
| **Owner** | **Workspace (leads-core)** + **Shared (LI)**. |
| **Done when** | All `TS2322` in `packages/leads-core/src/services/*` cleared; add small `toJsonInput()` helpers if needed. |

#### B4-R02

| Field | Value |
|--------|--------|
| **Batch ID** | B4-R02 |
| **Type** | **repair** |
| **Primary cause** | LI **API** uses wrong `Contact` fields / **`Record<string, unknown>`** for JSON / telemetry **string literals** vs `LeadIntelligenceTelemetryAction`. |
| **Likely files / folders** | `apps/dashboard/app/api/lead-intelligence/**`; `lib/lead-intelligence/**` |
| **Approx TS errors affected** | **~10–14** |
| **Depends on** | **B4-C01**; coordinate with **B4-R01** if same records cross packages. |
| **Owner** | **Dashboard** + **Shared**. |
| **Done when** | No errors on `people/route.ts` telemetry lines; activation drafts JSON; discovery-job audit types. |

#### B4-R03

| Field | Value |
|--------|--------|
| **Batch ID** | B4-R03 |
| **Type** | **repair** |
| **Primary cause** | **Website builder UI** out of sync with **`site-schema`** exports and **`WebsiteSiteSchemaJson`** (`canvas`, block kinds); public LP layout props. |
| **Likely files / folders** | `apps/dashboard/lib/website-builder/site-schema.ts` (or canonical in `apps/dashboard/lib/**`); `apps/dashboard/app/website-builder/**/WebsiteCanvasBlocksPanel.tsx`; `apps/dashboard/app/sites/lp/[slug]/page.tsx` |
| **Approx TS errors affected** | **~8–10** |
| **Depends on** | **B4-C06** if schema drove `Website` shape; else can start after **B4-C01**. |
| **Owner** | **Dashboard** (website-builder). |
| **Done when** | Exports consumed by panel exist; `WebsiteSiteSchemaJson` matches runtime shape **or** callsites narrowed; LP page passes `WebsiteSettingsPublicLayoutProps`. |

#### B4-R04

| Field | Value |
|--------|--------|
| **Batch ID** | B4-R04 |
| **Type** | **repair** |
| **Primary cause** | **Missing modules / deps:** `@/lib/url/query-state`, `web-vitals`. |
| **Likely files / folders** | `apps/dashboard/app/finance/**/page.tsx` (imports); `apps/dashboard/package.json` or root workspace deps; add `apps/dashboard/lib/url/query-state.ts` (or fix path alias); `apps/dashboard/app/instrumentation-client.ts` |
| **Approx TS errors affected** | **~5** |
| **Depends on** | None (can parallelize after **B4-C01**). |
| **Owner** | **Dashboard** + **Platform** (dependency policy). |
| **Done when** | `TS2307` gone for those modules; `web-vitals` resolves. |

#### B4-R05

| Field | Value |
|--------|--------|
| **Batch ID** | B4-R05 |
| **Type** | **repair** |
| **Primary cause** | **Framer-motion stub** JSX typing; **AI image status** handler arity. |
| **Likely files / folders** | `apps/dashboard/lib/build-triage/framer-motion-stub.tsx`; `apps/dashboard/app/api/ai/image/status/route.ts` |
| **Approx TS errors affected** | **~5** |
| **Depends on** | None. |
| **Owner** | **Dashboard**. |
| **Done when** | Stub compiles with React 18 JSX types; image status route matches callee signature. |

#### B4-R06

| Field | Value |
|--------|--------|
| **Batch ID** | B4-R06 |
| **Type** | **repair** |
| **Primary cause** | **`Projects/new/page.tsx`** bad cast **`Promise<any>`** → DTO type. |
| **Likely files / folders** | `apps/dashboard/app/projects/[tenantId]/Projects/new/page.tsx` |
| **Approx TS errors affected** | **~1** |
| **Depends on** | **B4-C04** optional if project Prisma DTOs are still unstable; otherwise can follow **B4-R06** wave. |
| **Owner** | **Dashboard**. |
| **Done when** | `TS2352` cleared; uses proper async/await + typed response. |

---

### Queue meta (approved remediation map → execution)

**1. Collapse batches executed / queued:** **B4-C01** (done) → **B4-C03** (done). **B4-C04** is **deferred** (projects = **`select` / `include` repairs**, not next collapse).

**2. Next repair waves (see §12 header):** **B4-R06** → **B4-R07** → **B4-R08** (mapped to **R01–R05** batch IDs as listed in the §12 table above).

**3. Expected post-batch typecheck re-run points:** (a) after **every** schema change + **`prisma generate`**; (b) after **each collapse batch**; (c) after **each repair wave** if you need incremental signal.

**4. Does B4-C01 require DB reachability?** **No.** **`prisma generate`** uses only `schema.prisma` on disk. **A10** (`migrate status/deploy`, `_prisma_migrations`) **does** require a reachable DB — keep that separate.

**5. Exact next commit scope (this phase only):** files touched by **B4-C03** and **direct repair batches** after it (**R06→R07→R08**); **`packages/db/prisma/schema.prisma`** only when collapsing; **`prisma generate`** only when schema changes; **`docs/IMPLEMENTATION_STATUS.md`** (§10–12); **UTF-8** `docs/evidence/typecheck-dashboard-latest.txt` after each **`typecheck:dashboard`**; **no** nav/route/UI-only PRs; **no** LI/CRM/Sales/Email/Finance **feature** commits until execution contract + A10/staging policy satisfied.

**Execution-contract sign-off:** assign owners to **B4-C01, B4-C03, B4-C05–C08**, **repair waves R06–R08**, and **A10** path in the same planning note (names/dates), not only this table.

## 3. Canonical paths (quick reference)

| Asset | Path |
|-------|------|
| Schema | `packages/db/prisma/schema.prisma` |
| Migrations | `packages/db/prisma/migrations/` |
| Seeds | `prisma/seed.ts`, `prisma/seeds/**` |
| Deprecation log | `docs/ROUTE_DEPRECATION_LOG.md` |

---

## 4–9. (unchanged intent)

- **§4** Revenue Desk modules; defer verticals / Support implementation.  
- **§5** Honest LI M1 (import / manual / forms / optional CRM import — no “live market” copy).  
- **§6** Release gates: update when `test:m0` + typecheck evidence exist.  
- **§7** Next 3 tasks: (1) **A10** reachable DB proof (§10) **or** approved staging path, (2) **B4-C01** + **B4-C03** + regen + UTF-8 typecheck evidence, (3) **B4-R06→R07→R08** repair waves — **defer B4-C04** and **defer** nav/route/UI cleanup.  
- **§8** Performance table: fill during performance pass.  
- **§9** New route hard rule.

---

## Next commit scope (A10 + B3/B4 only)

1. **`packages/db/prisma/schema.prisma`** — changes for **B4-C01–C08** as implemented (no feature flags for product scope expansion).  
2. **Generated Prisma client** — commit if repo policy includes `node_modules/.prisma` / client output; otherwise schema-only PR + CI `db:generate`.  
3. **`docs/IMPLEMENTATION_STATUS.md`** — §10–12 (this execution queue).  
4. **`docs/evidence/typecheck-dashboard-latest.txt`** — refresh after first **B4-C01** re-run.  

**Deferred (not in this phase):** `docs/ROUTE_DEPRECATION_LOG.md` nav-only edits; LI/CRM/Sales/Email/Finance **feature** PRs.

**Do not** ship LI/CRM/Sales/Email/Finance **feature** work until the **execution contract** at the top of this doc is satisfied (A10 or approved DB path **and** remediation plan sign-off per §12).
