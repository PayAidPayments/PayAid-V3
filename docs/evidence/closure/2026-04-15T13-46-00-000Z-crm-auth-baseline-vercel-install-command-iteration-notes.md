# CRM auth baseline queue #14 - install command iteration evidence (2026-04-15)

## Context

- Goal: unblock queue `#14` deployment path after install-stage `idealTree` failures.
- Approach: iterate Vercel `installCommand` in `apps/dashboard/vercel.json` and verify with production deploy attempts.

## Attempt 1 - switch to npm ci

Config tested:

```json
"installCommand": "cd ../.. && npm ci --legacy-peer-deps --no-audit --no-fund"
```

Deploy inspected:

- URL: `https://dashboard-b7e1jnuil-payaid-projects-a67c6b27.vercel.app`
- Deployment ID: `dpl_8eAdGuXFeQ8hot5nUfVzoMu7N5xC`

Observed failure:

- `npm error code EUSAGE`
- `The npm ci command can only install with an existing package-lock.json or npm-shrinkwrap.json`

Conclusion:

- `npm ci` is not currently viable in this repository's Vercel install context because the required lockfile is not available in the build environment.

## Attempt 2 - revert to npm install without legacy flag

Config tested:

```json
"installCommand": "cd ../.. && npm install --no-audit --no-fund"
```

Deploy command:

```powershell
vercel --prod --yes --archive=tgz --cwd apps/dashboard --debug
```

Observed behavior:

- Local CLI run progressed to `Packing tarball` and then stalled in this environment before deployment creation (no new deployment URL emitted during the run window).
- Process was terminated locally after prolonged stall.

Conclusion:

- Install command change removes the explicit `legacy-peer-deps` path but does not yet prove successful deploy completion from this workstation due local CLI packaging stall.

## Queue #14 impact

- Queue `#14` remains **Blocked**.
- Current evidence now includes:
  1. prior install-stage `idealTree` failures (with legacy flag),
  2. `npm ci` lockfile (`EUSAGE`) failure,
  3. local CLI tarball-pack stall during follow-up `npm install` retry.

## Recommended next action

1. Execute the latest deploy from a deployment-capable environment with stable CLI network/storage path.
2. Confirm first `Ready` dashboard deployment.
3. Run `npm run collect:crm-auth-baseline` against that deployment and capture 3/3 endpoint p95 output.
