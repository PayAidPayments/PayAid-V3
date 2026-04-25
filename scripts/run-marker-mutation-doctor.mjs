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

const policy = {
  defaultTtlMinutes: Number(process.env.MARKER_MUTATION_APPROVAL_TTL_MINUTES || 30),
  maxWindowHours: Number(process.env.MARKER_MUTATION_APPROVAL_MAX_WINDOW_HOURS || 24),
  enforceMaxWindow: process.env.MARKER_MUTATION_APPROVAL_ENFORCE_MAX_WINDOW === '1',
}

function parseExpiry(raw) {
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.trim().toLowerCase().startsWith('expiresat='))
  if (!line) return null
  const value = line.split('=').slice(1).join('=').trim()
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? { raw: value, ms } : { raw: value, ms: null }
}

const present = existsSync(approvalFile)
let expiry = null
if (present) {
  const raw = readFileSync(approvalFile, 'utf8')
  expiry = parseExpiry(raw)
}

const nowMs = Date.now()
const expired = !present ? null : expiry?.ms == null ? null : nowMs > expiry.ms
const minutesRemaining =
  !present || expiry?.ms == null
    ? null
    : Number(Math.max(0, (expiry.ms - nowMs) / (60 * 1000)).toFixed(2))

const diagnosis = {
  state: !present ? 'no_approval_file' : expired ? 'approval_expired' : 'approval_active',
  canMutateWithEnvFlag: present && expired === false,
}

const nextSteps = []
if (!present) {
  nextSteps.push('Run: npm run markers:allow-mutation')
}
if (present && expired) {
  nextSteps.push('Approval expired. Run: npm run markers:allow-mutation')
}
if (present && expired === false) {
  nextSteps.push('To mutate markers, also set env flag: MARKETING_RELEASE_CLEANUP_ALLOW_MARKER_MUTATION=1')
}
nextSteps.push('Check effective policy: npm run markers:policy')
nextSteps.push('Check current status: npm run markers:status')

console.log(
  JSON.stringify(
    {
      ok: true,
      policy,
      status: {
        present,
        approvalFile,
        expiresAt: expiry?.raw || null,
        expired,
        minutesRemaining,
      },
      diagnosis,
      nextSteps,
    },
    null,
    2
  )
)

