#!/usr/bin/env node
/**
 * Hosted HTML No-404 for uniform module Home routes.
 *
 * Probes slug-first `/{module}/{tenantId}/Home` on the deployed dashboard host.
 * Pass criteria: not a Next.js 404 page. Auth redirects / login shells count as
 * route-present (route exists; auth is separate).
 *
 * Usage:
 *   PERF_BASE_URL=https://payaid-v3.vercel.app \
 *   PERF_TEST_EMAIL=admin@demo.com \
 *   PERF_TEST_PASSWORD=Test@1234 \
 *   npm run check:module-dashboard-homes-hosted
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE_URL = (process.env.PERF_BASE_URL || process.env.BASE_URL || 'https://payaid-v3.vercel.app').replace(
  /\/$/,
  ''
)
const EMAIL = process.env.PERF_TEST_EMAIL || 'admin@demo.com'
const PASSWORD = process.env.PERF_TEST_PASSWORD || 'Test@1234'
const FALLBACK_TENANT = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const bypass = process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

const CORE_MODULES = [
  'crm',
  'hr',
  'finance',
  'projects',
  'sales',
  'marketing',
  'support',
  'inventory',
  'analytics',
  'communication',
  'productivity',
  'docs',
  'spreadsheet',
  'slides',
  'meet',
  'pdf',
  'drive',
  'workflow-automation',
  'website-builder',
]

const INDUSTRY_SAMPLE = ['education', 'healthcare', 'appointments', 'contracts']

function isNotFoundPage(status, text, contentType) {
  if (status === 404) return true
  // Soft Next not-found pages sometimes return 200 with a short shell.
  // Avoid matching the phrase inside large app HTML/RSC payloads (false positives).
  const body = (text || '').slice(0, 4000)
  if (body.length < 3500 && body.includes('This page could not be found')) return true
  if (body.length < 3500 && body.includes('404: This page could not be found')) return true
  if (
    status >= 400 &&
    contentType.includes('text/html') &&
    /not found/i.test(body) &&
    body.length < 8000
  ) {
    return true
  }
  return false
}

function isVercelSso(text) {
  return (
    text.includes('Authentication Required') ||
    (text.includes('<!doctype html>') && text.includes('Vercel') && text.includes('login'))
  )
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    return { token: null, tenantId: FALLBACK_TENANT, loginOk: false, status: res.status }
  }
  const data = await res.json()
  return {
    token: data.token || null,
    tenantId: data.user?.tenantId || data.tenant?.id || FALLBACK_TENANT,
    loginOk: Boolean(data.token),
    status: res.status,
  }
}

async function probeHome(moduleId, tenantId, token) {
  const route = `/${moduleId}/${tenantId}/Home`
  const url = new URL(`${BASE_URL}${route}`)
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }

  const headers = {
    Accept: 'text/html',
    ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  })
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  const notFound = isNotFoundPage(res.status, text, contentType)
  const htmlSso = isVercelSso(text)
  const looksLikeAppShell =
    contentType.includes('text/html') &&
    (text.includes('__NEXT_DATA__') ||
      text.includes('/_next/') ||
      text.includes('PayAid') ||
      text.includes('Sign in') ||
      text.includes('Login') ||
      text.includes('ModuleDashboard') ||
      text.includes('Coming soon'))

  const ok = !notFound && !htmlSso && (res.status < 500 || looksLikeAppShell)

  return {
    moduleId,
    route,
    url: url.toString(),
    status: res.status,
    contentType,
    notFound,
    htmlSso,
    ok,
    note: htmlSso
      ? 'vercel_sso'
      : notFound
        ? 'next_404'
        : looksLikeAppShell
          ? 'html_shell'
          : `http_${res.status}`,
  }
}

async function main() {
  console.log(`Hosted module Home No-404 → ${BASE_URL}`)
  const auth = await login()
  console.log(`Login: ${auth.loginOk ? 'ok' : 'fallback'} (tenant=${auth.tenantId})`)

  const modules = [...CORE_MODULES, ...INDUSTRY_SAMPLE]
  const results = []
  for (const moduleId of modules) {
    try {
      const r = await probeHome(moduleId, auth.tenantId, auth.token)
      results.push(r)
      const mark = r.ok ? 'PASS' : 'FAIL'
      console.log(`  [${mark}] ${r.route} → ${r.status} (${r.note})`)
    } catch (err) {
      results.push({
        moduleId,
        route: `/${moduleId}/${auth.tenantId}/Home`,
        ok: false,
        note: `error:${err instanceof Error ? err.message : String(err)}`,
        status: 0,
      })
      console.log(`  [FAIL] /${moduleId}/…/Home → ${err}`)
    }
  }

  const failed = results.filter((r) => !r.ok)
  const evidenceDir = path.join(root, 'docs/evidence/perf')
  mkdirSync(evidenceDir, { recursive: true })
  const evidencePath = path.join(evidenceDir, `module-homes-hosted-no404-${Date.now()}.json`)
  const evidence = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    tenantId: auth.tenantId,
    loginOk: auth.loginOk,
    summary: {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    results,
  }
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2))
  console.log(`Evidence: ${evidencePath}`)

  if (failed.length) {
    console.error(`FAIL: ${failed.length}/${results.length} Home routes`)
    process.exit(1)
  }
  console.log(`PASS: ${results.length}/${results.length} Home routes present (no Next 404)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
