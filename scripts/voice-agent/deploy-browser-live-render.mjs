#!/usr/bin/env node
/**
 * Deploy / redeploy browser-live WSS sidecar on Render.com.
 *
 * First-time (Dashboard):
 *   1. Render → New → Blueprint → connect GitHub repo
 *   2. Blueprint path: deployment/browser-live-ws/render.yaml
 *   3. Set DATABASE_URL, JWT_SECRET, GROQ_API_KEY when prompted
 *
 * Redeploy (API):
 *   RENDER_API_KEY=rnd_… RENDER_BROWSER_LIVE_SERVICE_ID=srv-… \
 *     node scripts/voice-agent/deploy-browser-live-render.mjs
 *
 * After deploy:
 *   NEXT_PUBLIC_VOICE_LIVE_WS_URL=wss://payaid-browser-live-ws.onrender.com \
 *     npm run voice-agent:wire-browser-live-production -- --deploy
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const serviceId = process.env.RENDER_BROWSER_LIVE_SERVICE_ID || process.env.RENDER_SERVICE_ID
const apiKey = process.env.RENDER_API_KEY
const serviceName = process.env.RENDER_BROWSER_LIVE_SERVICE_NAME || 'payaid-browser-live-ws'
const wsUrl = `wss://${serviceName}.onrender.com`

if (!apiKey || !serviceId) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'manual-blueprint',
        blueprint: 'deployment/browser-live-ws/render.yaml',
        serviceName,
        expectedWsUrl: wsUrl,
        health: `https://${serviceName}.onrender.com/health`,
        steps: [
          'Render Dashboard → New → Blueprint → connect this repo',
          'Blueprint path: deployment/browser-live-ws/render.yaml',
          'Set secrets: DATABASE_URL, JWT_SECRET, GROQ_API_KEY (same as voice Vercel app)',
          'After deploy succeeds, add to .env.local:',
          `  NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl}`,
          'npm run voice-agent:wire-browser-live-production -- --deploy',
        ],
        apiRedeploy: {
          hint: 'After first deploy, copy service ID from Render URL',
          env: 'RENDER_API_KEY, RENDER_BROWSER_LIVE_SERVICE_ID',
          command: 'npm run voice-agent:deploy-browser-live-render',
        },
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ clearCache: false }),
})
const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error(JSON.stringify({ ok: false, status: res.status, body }, null, 2))
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'api-redeploy',
      serviceId,
      deployId: body.id,
      wsUrl,
      next: [
        `Wait for Render deploy, then: NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl} npm run voice-agent:wire-browser-live-production -- --deploy`,
      ],
    },
    null,
    2,
  ),
)
