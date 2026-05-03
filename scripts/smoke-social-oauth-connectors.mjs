#!/usr/bin/env node
/**
 * Authenticated smoke check for social OAuth connector routes.
 *
 * Required env:
 * - SOCIAL_SMOKE_BASE_URL (default: http://127.0.0.1:3000)
 * - SOCIAL_SMOKE_AUTH_TOKEN (Bearer JWT)
 *
 * Optional:
 * - SOCIAL_SMOKE_REFRESH=1  -> also probes refresh endpoint for twitter/youtube
 */

import { isStrictFlagEnabled } from './strict-flag.mjs'

const baseUrl = (process.env.SOCIAL_SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')
const authToken = (process.env.SOCIAL_SMOKE_AUTH_TOKEN || '').trim()
const includeRefresh = isStrictFlagEnabled(process.env.SOCIAL_SMOKE_REFRESH)

if (!authToken) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Missing SOCIAL_SMOKE_AUTH_TOKEN',
        nextSteps: [
          'Set SOCIAL_SMOKE_AUTH_TOKEN to a valid app JWT for a tenant admin/owner user.',
          'Run: node scripts/smoke-social-oauth-connectors.mjs',
        ],
      },
      null,
      2
    )
  )
  process.exit(1)
}

const routes = [
  { key: 'linkedin-auth', method: 'GET', path: '/api/integrations/linkedin/auth' },
  { key: 'youtube-auth', method: 'GET', path: '/api/integrations/youtube/auth' },
  { key: 'facebook-auth', method: 'GET', path: '/api/integrations/facebook/auth' },
  { key: 'instagram-auth', method: 'GET', path: '/api/integrations/instagram/auth' },
  { key: 'twitter-auth', method: 'GET', path: '/api/integrations/twitter/auth' },
  { key: 'settings-social', method: 'GET', path: '/api/settings/social' },
]

if (includeRefresh) {
  routes.push(
    {
      key: 'refresh-youtube',
      method: 'POST',
      path: '/api/settings/social/refresh',
      body: { provider: 'youtube' },
    },
    {
      key: 'refresh-twitter',
      method: 'POST',
      path: '/api/settings/social/refresh',
      body: { provider: 'twitter' },
    }
  )
}

function withTimeout(ms = 20_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { controller, clear: () => clearTimeout(timer) }
}

async function runOne(route) {
  const t0 = Date.now()
  const timeout = withTimeout(20_000)
  try {
    const res = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: route.body ? JSON.stringify(route.body) : undefined,
      signal: timeout.controller.signal,
    })
    const text = await res.text().catch(() => '')
    let json
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return {
      key: route.key,
      ok: res.ok,
      status: res.status,
      elapsedMs: Date.now() - t0,
      error: json?.error || (!res.ok ? (text || '').slice(0, 240) : undefined),
      hasAuthUrl: Boolean(json?.data?.authUrl || json?.authUrl),
    }
  } catch (error) {
    return {
      key: route.key,
      ok: false,
      status: null,
      elapsedMs: Date.now() - t0,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    timeout.clear()
  }
}

const results = []
for (const route of routes) {
  // eslint-disable-next-line no-await-in-loop
  results.push(await runOne(route))
}

const overallOk = results.every((r) => r.ok)
const summary = {
  check: 'social-oauth-connectors-smoke',
  baseUrl,
  includeRefresh,
  overallOk,
  results,
}

console.log(JSON.stringify(summary, null, 2))
process.exit(overallOk ? 0 : 1)

