# Lead Intelligence M1 — Browser smoke checklist

Audience: QA / release operators  
Replace `{origin}` with your dashboard base (for example `http://localhost:3000`) and `{tenantId}` with a tenant that has the **`lead-intelligence`** module licensed. Sign in as a user who can access that tenant.

## Prerequisites

- [ ] Tenant has `lead-intelligence` in effective entitlements (JWT or post-`/api/auth/me` token refresh if you recently changed licenses).
- [ ] At least a few `Account` rows exist for the tenant if you expect non-empty discovery (optional for empty-state checks).

## M1 route smoke (no 404)

- [ ] **`{origin}/lead-intelligence/{tenantId}/Home`** — module home loads; **Shipped today: company discovery M1** ribbon links to Search, Companies, Saved, Exports with no 404s.
- [ ] **`{origin}/lead-intelligence/{tenantId}/search`** — Step 1 planner renders; step indicator visible.
- [ ] **`{origin}/lead-intelligence/{tenantId}/companies`** — Step 2 loads (results or empty state); error path shows retry if you simulate failure.
- [ ] **`{origin}/lead-intelligence/{tenantId}/saved-searches`** — Step 3 list + save form; **Active / Archived** toggles work.
- [ ] **`{origin}/lead-intelligence/{tenantId}/exports`** — Step 4 history + export action UI.
- [ ] **`{origin}/lead-intelligence/{tenantId}/review`** — placeholder shows **Meanwhile (M1)** links to Search, Companies, Exports.

## M1 happy path (end-to-end)

1. **Search → Companies:** From Step 1, set filters and open Step 2; confirm row count matches expectations or empty state.
2. **Save:** From Step 3, save current filters with a name; confirm it appears under **Active**.
3. **Rename / archive:** Rename a saved search; **Archive** it; switch to **Archived**; **Restore**; confirm it returns under **Active**.
4. **Export:** From Step 4 (or navigation from saved search **Open Step 4**), run export; confirm CSV downloads and an entry appears in history (including `COMPLETED`).
5. **Delete:** Delete a saved search from the list; confirm removal.

## License guard (quick)

- [ ] With a user **without** LI entitlement (or revoked module), opening `/lead-intelligence/{tenantId}/search` should redirect or show entitlement messaging per product rules—not a silent 200 with full flow.

## Optional API checks (same session token as UI)

With `Authorization: Bearer <access_token>`:

- [ ] `GET /api/lead-intelligence/health` → `200`, `ok: true`, `discovery.mode` = `tenant_account_index`.
- [ ] `GET /api/lead-intelligence/discovery/companies?limit=5` → `200`, `ok: true`, `items` array present.

To include in-process telemetry counters on health (ops only): set env **`LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH=1`** on the server, then confirm `telemetry.countersSinceProcessStart` is present.

## Record results

Note environment (local/staging/prod), `tenantId`, and any failures; attach screenshots for UI defects. For automation evidence, run **`npm run check:lead-intelligence-m1-closure`** and keep the generated artifact under `docs/evidence/closure/`.
