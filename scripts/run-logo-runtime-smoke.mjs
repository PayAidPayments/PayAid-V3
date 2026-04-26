#!/usr/bin/env node
/**
 * Authenticated smoke check for logo generation endpoints.
 *
 * Required env:
 * - LOGO_SMOKE_AUTH_TOKEN (or CANONICAL_STAGING_AUTH_TOKEN)
 *
 * Optional env:
 * - LOGO_SMOKE_BASE_URL (default: https://payaid-v3.vercel.app)
 * - LOGO_SMOKE_ALLOW_AI_SOFT_FAIL=0|1 (default: 1)
 */

import { isStrictFlagEnabled } from './strict-flag.mjs'

const baseUrl = (process.env.LOGO_SMOKE_BASE_URL || 'https://payaid-v3.vercel.app').replace(/\/+$/, '')
const authToken = (process.env.LOGO_SMOKE_AUTH_TOKEN || process.env.CANONICAL_STAGING_AUTH_TOKEN || '').trim()
const allowAiSoftFail = isStrictFlagEnabled(process.env.LOGO_SMOKE_ALLOW_AI_SOFT_FAIL ?? '1')

if (!authToken) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Missing LOGO_SMOKE_AUTH_TOKEN',
        nextSteps: [
          'Set LOGO_SMOKE_AUTH_TOKEN (or CANONICAL_STAGING_AUTH_TOKEN) to a valid app JWT.',
          'Run: node scripts/run-logo-runtime-smoke.mjs',
        ],
      },
      null,
      2
    )
  )
  process.exit(1)
}

function withTimeout(ms = 20_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { controller, clear: () => clearTimeout(timer) }
}

function extractErrorText(json, text) {
  return [
    json?.error,
    json?.message,
    json?.hint,
    typeof text === 'string' ? text.slice(0, 400) : '',
  ]
    .filter(Boolean)
    .join(' | ')
}

function extractBuildRef(res, json) {
  return (
    res.headers.get('x-payaid-build-ref') ||
    json?.buildRef ||
    'unknown'
  )
}

function isSchemaMismatch(text) {
  return /logotype|column.+logoType.+does not exist|invalid prisma\.logo\.create/i.test(text || '')
}

async function callApi({ key, path, method, body }) {
  const timeout = withTimeout()
  const startedAt = Date.now()
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: timeout.controller.signal,
    })
    const text = await res.text().catch(() => '')
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    const errorText = extractErrorText(json, text)
    return {
      key,
      status: res.status,
      ok: res.ok,
      elapsedMs: Date.now() - startedAt,
      buildRef: extractBuildRef(res, json),
      errorText,
      schemaMismatchDetected: isSchemaMismatch(errorText),
    }
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error)
    return {
      key,
      status: null,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      errorText,
      schemaMismatchDetected: isSchemaMismatch(errorText),
    }
  } finally {
    timeout.clear()
  }
}

const vectorPayload = {
  businessName: 'PayAid Smoke Vector',
  industry: 'fintech',
  style: 'minimal, modern',
  fontFamily: 'Inter',
  fontSize: 64,
  color: '#111827',
  iconStyle: 'shield',
  iconColor: '#1D4ED8',
  saveToBrandKit: false,
  setAsBrandLogo: false,
}

const aiPayload = {
  businessName: 'PayAid Smoke AI',
  industry: 'fintech',
  style: 'modern',
  colors: ['#111827', '#1D4ED8'],
}

const vectorResult = await callApi({
  key: 'vector-logo-create',
  method: 'POST',
  path: '/api/logos/vector',
  body: vectorPayload,
})

const aiResult = await callApi({
  key: 'ai-logo-create',
  method: 'POST',
  path: '/api/logos',
  body: aiPayload,
})

const schemaMismatchDetected = vectorResult.schemaMismatchDetected || aiResult.schemaMismatchDetected
const vectorPass = vectorResult.ok && !vectorResult.schemaMismatchDetected
const aiPass = !aiResult.schemaMismatchDetected && (aiResult.ok || (allowAiSoftFail && aiResult.status >= 500))
const overallOk = vectorPass && aiPass && !schemaMismatchDetected

const summary = {
  check: 'logo-runtime-smoke',
  baseUrl,
  allowAiSoftFail,
  overallOk,
  schemaMismatchDetected,
  results: [vectorResult, aiResult],
  nextSteps: overallOk
    ? ['Logo endpoints are reachable without schema mismatch regression.']
    : [
        schemaMismatchDetected
          ? 'Schema mismatch still detected. Verify Logo.logoType migration deployment.'
          : 'Review endpoint errors. If only AI provider failed, configure provider keys or set LOGO_SMOKE_ALLOW_AI_SOFT_FAIL=1.',
      ],
}

console.log(JSON.stringify(summary, null, 2))
process.exit(overallOk ? 0 : 1)
