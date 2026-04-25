#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const approvalFile = join(
  process.cwd(),
  'docs',
  'evidence',
  'closure',
  'markers',
  'ALLOW_MARKER_MUTATION'
)

function parseExpiry(raw) {
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.trim().toLowerCase().startsWith('expiresat='))
  if (!line) return null
  const value = line.split('=').slice(1).join('=').trim()
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return { raw: value, ms: null }
  return { raw: value, ms }
}

const present = existsSync(approvalFile)
if (!present) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        present: false,
        approvalFile,
        expired: null,
        expiresAt: null,
        minutesRemaining: null,
      },
      null,
      2
    )
  )
  process.exit(0)
}

const raw = readFileSync(approvalFile, 'utf8')
const parsed = parseExpiry(raw)
const now = Date.now()
const expired = parsed?.ms == null ? null : now > parsed.ms
const minutesRemaining =
  parsed?.ms == null ? null : Number(Math.max(0, (parsed.ms - now) / (60 * 1000)).toFixed(2))

console.log(
  JSON.stringify(
    {
      ok: true,
      present: true,
      approvalFile,
      expired,
      expiresAt: parsed?.raw || null,
      minutesRemaining,
    },
    null,
    2
  )
)

