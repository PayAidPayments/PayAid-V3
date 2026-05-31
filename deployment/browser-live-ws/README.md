# Browser live voice WSS sidecar (M1)

Always-on WebSocket server for the investor **Live voice** demo. Runs **outside** Vercel.

## Required env

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Same Supabase pooler as voice Vercel app |
| `JWT_SECRET` | Must match voice app login token signing |
| `GROQ_API_KEY` | Groq LLM for turns |
| `VOICE_LIVE_WS_PORT` | Default `3002` |
| `BROWSER_LIVE_STUB` | Optional `1` — echo replies without Groq |

## Local

```bash
npm run dev:browser-live-ws
# or full stack:
npm run dev:voice-live-local
```

## Docker

From repo root:

```bash
docker build -f deployment/browser-live-ws/Dockerfile -t payaid-browser-live-ws .
docker run --rm -p 3002:3002 \
  -e DATABASE_URL=… \
  -e JWT_SECRET=… \
  -e GROQ_API_KEY=… \
  payaid-browser-live-ws
```

## Fly.io

```bash
fly apps create payaid-browser-live-ws
fly secrets set DATABASE_URL=… JWT_SECRET=… GROQ_API_KEY=…
fly deploy --config deployment/browser-live-ws/fly.toml
```

After deploy, set on the **voice** Vercel project:

```env
NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO=1
NEXT_PUBLIC_VOICE_LIVE_WS_URL=wss://payaid-browser-live-ws.fly.dev
```

Then: `npm run voice-agent:push-browser-live-vercel-env` and `npm run deploy:voice:git-archive`.

## Vercel sync (operator)

```bash
npm run voice-agent:push-browser-live-vercel-env
npm run deploy:voice:git-archive
```

## Fly sidecar deploy (operator)

One-time: `flyctl auth login` (CLI at `%USERPROFILE%\.fly\bin\flyctl.exe` on Windows).

```bash
npm run voice-agent:deploy-browser-live-sidecar
# then push WS URL + redeploy voice UI (see Staging / production above)
```

Dry-run (checks auth + local secrets only):

```bash
node scripts/voice-agent/deploy-browser-live-sidecar.mjs --dry-run
```

## WSS smoke (local or staging)

Terminal A: `BROWSER_LIVE_STUB=1 npm run dev:browser-live-ws`

Terminal B:

```bash
npm run voice-agent:mint-validation-auth-token   # copy JWT
SMOKE_TENANT_ID=cmjptk2mw0000aocw31u48n64 SMOKE_AUTH_TOKEN=<jwt> npm run voice-agent:smoke-browser-live-wss
```

Expected: `"ok": true` with `session.ready` → `turn.complete`.

See also: `docs/VOICE_AGENT_BROWSER_LIVE_DEMO_RUNBOOK.md`
