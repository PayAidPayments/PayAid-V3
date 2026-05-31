#!/usr/bin/env node
/**
 * Deploy / provision browser-live WSS sidecar on Render.com.
 *
 * Modes:
 *   1. No RENDER_API_KEY → print Blueprint manual steps
 *   2. RENDER_API_KEY + RENDER_BROWSER_LIVE_SERVICE_ID → trigger redeploy
 *   3. RENDER_API_KEY only → create service from GitHub repo + set secrets + deploy
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

const apiKey = process.env.RENDER_API_KEY
const serviceId = process.env.RENDER_BROWSER_LIVE_SERVICE_ID || process.env.RENDER_SERVICE_ID
const serviceName = process.env.RENDER_BROWSER_LIVE_SERVICE_NAME || 'payaid-browser-live-ws'
const wsUrl = `wss://${serviceName}.onrender.com`
const branch = process.env.RENDER_DEPLOY_BRANCH || 'main'
const repo =
  process.env.RENDER_GITHUB_REPO ||
  spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).stdout
    ?.trim()
    ?.replace(/\.git$/, '')
    ?.replace('git@github.com:', 'https://github.com/') ||
  ''

const secrets = ['DATABASE_URL', 'JWT_SECRET', 'GROQ_API_KEY'].map((key) => ({
  key,
  value: String(process.env[key] || '').trim(),
}))

async function renderFetch(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.render.com/v1${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

function manualSteps() {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'manual-blueprint',
        blueprint: 'deployment/browser-live-ws/render.yaml',
        repo: repo || null,
        serviceName,
        expectedWsUrl: wsUrl,
        health: `https://${serviceName}.onrender.com/health`,
        steps: [
          'Render Dashboard → New → Blueprint → connect GitHub repo PayAidPayments/PayAid-V3',
          'Blueprint path: deployment/browser-live-ws/render.yaml',
          'Set secrets: DATABASE_URL, JWT_SECRET, GROQ_API_KEY (same as voice Vercel app)',
          'After deploy succeeds, add to .env.local:',
          `  NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl}`,
          'npm run voice-agent:wire-browser-live-production -- --deploy',
        ],
        apiProvision: {
          hint: 'Add RENDER_API_KEY to .env.local (Render Dashboard → Account → API Keys)',
          command: 'npm run voice-agent:deploy-browser-live-render',
        },
      },
      null,
      2,
    ),
  )
}

if (!apiKey) {
  manualSteps()
  process.exit(0)
}

async function ensureSecrets(sid) {
  for (const { key, value } of secrets) {
    if (!value) continue
    const { res, data } = await renderFetch(`/services/${sid}/env-vars`, {
      method: 'POST',
      body: { envVar: { key, value } },
    })
    if (!res.ok) {
      console.error(JSON.stringify({ ok: false, step: 'set-env', key, status: res.status, data }, null, 2))
      process.exit(1)
    }
  }
}

async function triggerDeploy(sid) {
  const { res, data } = await renderFetch(`/services/${sid}/deploys`, {
    method: 'POST',
    body: { clearCache: false },
  })
  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, step: 'deploy', status: res.status, data }, null, 2))
    process.exit(1)
  }
  return data
}

if (serviceId) {
  await ensureSecrets(serviceId)
  const deploy = await triggerDeploy(serviceId)
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'api-redeploy',
        serviceId,
        deployId: deploy.id,
        wsUrl,
        next: [`NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl} npm run voice-agent:wire-browser-live-production -- --deploy`],
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const missing = secrets.filter((s) => !s.value).map((s) => s.key)
if (missing.length) {
  console.error(JSON.stringify({ ok: false, error: 'Missing local secrets for Render', missing }, null, 2))
  process.exit(1)
}

if (!repo) {
  console.error(JSON.stringify({ ok: false, error: 'GitHub repo URL required (git remote origin)' }, null, 2))
  process.exit(1)
}

const { res: ownersRes, data: ownersData } = await renderFetch('/owners?limit=20')
if (!ownersRes.ok) {
  console.error(JSON.stringify({ ok: false, step: 'owners', status: ownersRes.status, data: ownersData }, null, 2))
  process.exit(1)
}

const owners = ownersData || []
const owner = owners.find((o) => o.owner?.id)?.owner || owners[0]?.owner || owners[0]
const ownerId = owner?.id
if (!ownerId) {
  console.error(JSON.stringify({ ok: false, error: 'No Render owner found for API key' }, null, 2))
  process.exit(1)
}

const { res: createRes, data: createData } = await renderFetch('/services', {
  method: 'POST',
  body: {
    type: 'web_service',
    name: serviceName,
    ownerId,
    repo: repo.startsWith('https://') ? repo : `https://github.com/${repo}`,
    branch,
    serviceDetails: {
      env: 'docker',
      plan: 'starter',
      region: 'singapore',
      healthCheckPath: '/health',
      envSpecificDetails: {
        dockerfilePath: 'deployment/browser-live-ws/Dockerfile',
        dockerContext: '.',
      },
    },
  },
})

if (!createRes.ok) {
  const alreadyExists = createRes.status === 409 || String(createData?.message || '').includes('already')
  if (alreadyExists) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: 'Service name may already exist on Render',
          hint: 'Set RENDER_BROWSER_LIVE_SERVICE_ID from Render dashboard and re-run',
          wsUrl,
        },
        null,
        2,
      ),
    )
    process.exit(1)
  }
  console.error(JSON.stringify({ ok: false, step: 'create', status: createRes.status, data: createData }, null, 2))
  process.exit(1)
}

const newId = createData?.service?.id || createData?.id
if (!newId) {
  console.error(JSON.stringify({ ok: false, error: 'Create succeeded but no service id', data: createData }, null, 2))
  process.exit(1)
}

await ensureSecrets(newId)
const deploy = await triggerDeploy(newId)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'api-create',
      serviceId: newId,
      serviceName,
      deployId: deploy.id,
      wsUrl,
      health: `https://${serviceName}.onrender.com/health`,
      saveEnv: `RENDER_BROWSER_LIVE_SERVICE_ID=${newId}`,
      next: [
        `Add to .env.local: RENDER_BROWSER_LIVE_SERVICE_ID=${newId}`,
        `Add to .env.local: NEXT_PUBLIC_VOICE_LIVE_WS_URL=${wsUrl}`,
        'npm run voice-agent:wire-browser-live-production -- --deploy',
      ],
    },
    null,
    2,
  ),
)
