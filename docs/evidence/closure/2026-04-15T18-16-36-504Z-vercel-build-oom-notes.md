# Vercel Build OOM Notes (Queue #14)

- Date: 2026-04-15
- Region: `iad1`
- Machine: 2 cores / 8 GB RAM
- Context: deploy validation for `/api/crm/tasks` runtime fix

## Observed runs

### Run A (reduced upload payload)
- Deployment extraction: `7718` files
- Build step reached: `Running "NODE_OPTIONS=--max-old-space-size=6144 npm run build"`
- Dashboard build command: `next build --webpack`
- Failure:
  - `Command "NODE_OPTIONS=--max-old-space-size=6144 npm run build" exited with SIGKILL`
  - Vercel build report: at least one OOM event detected

### Run B (older larger payload)
- Deployment extraction: `28430` files
- Same build failure signature:
  - SIGKILL during `next build --webpack`
  - Vercel OOM report

## Interpretation

- Upload-size/file-count blocker is partially improved in recent run.
- Current blocker is build memory pressure during dashboard compile in Vercel build container.
- Queue #14 remains blocked until deploy succeeds and auth baseline can be rerun on the newly deployed build.
