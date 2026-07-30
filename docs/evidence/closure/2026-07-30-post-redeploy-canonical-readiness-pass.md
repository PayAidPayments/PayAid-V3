# Post-redeploy closure — canonical readiness PASS (2026-07-30)

## Hosted production

| Item | Value |
| --- | --- |
| Project | `payaid-v3` (`prj_b0mffvUPCoPODjLDiqCdcJEME7D6`) |
| Alias | `https://payaid-v3.vercel.app` |
| Ready deployment | `dpl_8Srom6fjhdjDuaiZBace35Bsftxt` (`payaid-v3-1765sunlz-…`) |
| Branch / SHA | `fix/hosted-speed-auth-2026-07-29` / `2b7f42bd…` |
| Health | `200` healthy (DB + JWT configured) |
| `CANONICAL_MODULE_API_ONLY` | production plain `"1"` (API PATCH after auth restore; already effective on Ready alias) |

## Auth restore

CLI was signing in against a stale `auth.json`. Live credentials path:

`%APPDATA%\xdg.data\com.vercel.cli\auth.json` (user `phaniteja-2132`)

`scripts/voice-agent/read-vercel-cli-token.mjs` reads this path.

## Canonical probe (authenticated)

- `GET /api/modules` → keys `canonical`, `taxonomy` (no legacy top-level shims)
- `GET /api/industries/retail/modules` → `industry`, `canonical`, `suites`, `capabilities`, `optionalSuites`

## Gate: `npm run release:readiness`

**OVERALL: PASS** (PASS=5 FAIL=0 BLOCKED=0 SKIP=0)

Artifacts:

- `docs/evidence/release-gates/2026-07-30T05-55-31-204Z-release-readiness.json`
- `docs/evidence/release-gates/2026-07-30T05-55-31-204Z-release-readiness.md`
- Smoke: `docs/evidence/closure/2026-07-30T05-40-49-715Z-canonical-ui-surface-smoke.json` (`verdict: PASS`, classification `pass`)

Notes:

- First suite run timed out architecture-hygiene (180s) + bd10 (60s) on cold Windows FS; both pass solo. Suite timeouts raised (300s / 120s, env-overridable). Re-run overall PASS.
- Concurrent Hobby redeploys after env PATCH were CANCELED by rival builds; not required for green smoke because Ready alias already served canonical-only payloads.

## Next (locked)

1. **P2** Sales Pages → CRM qualify loop (+ CRM Deals reliability)
2. Keep Lead Intelligence discovery separate
3. Continue `packages/db` migrations cutover (controlled)
4. Do not reopen contract freeze / module-shell expansion
