#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const markerPath = join(
  process.cwd(),
  'docs',
  'evidence',
  'closure',
  'markers',
  'leads-bulk-retention-health-gate-green.json',
)
const maxAgeHours = Number(process.env.LEADS_BULK_RETENTION_HEALTH_GATE_MARKER_MAX_AGE_HOURS || 6)

if (!existsSync(markerPath)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Missing leads bulk retention health green marker',
        markerPath,
        nextSteps: ['Run: npm run run:leads-bulk-retention-health-gate-pipeline'],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

let parsed = null
try {
  parsed = JSON.parse(readFileSync(markerPath, 'utf8'))
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Marker file is not valid JSON',
        markerPath,
        details: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

if (!parsed?.overallOk) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Marker exists but does not indicate pass state',
        markerPath,
        marker: parsed,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const generatedAtRaw = parsed.generatedAt
const generatedAtMs = generatedAtRaw ? Date.parse(generatedAtRaw) : NaN
if (!Number.isFinite(generatedAtMs)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Marker generatedAt is missing or invalid',
        markerPath,
        marker: parsed,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const maxAgeMs = maxAgeHours * 60 * 60 * 1000
const ageMs = Date.now() - generatedAtMs
if (ageMs > maxAgeMs) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Leads bulk retention health marker is stale',
        markerPath,
        generatedAt: generatedAtRaw,
        ageHours: Number((ageMs / (60 * 60 * 1000)).toFixed(2)),
        maxAgeHours,
        nextSteps: ['Run: npm run run:leads-bulk-retention-health-gate-pipeline'],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      markerPath,
      generatedAt: parsed.generatedAt || null,
      ageHours: Number((ageMs / (60 * 60 * 1000)).toFixed(2)),
      maxAgeHours,
      check: parsed.check || null,
    },
    null,
    2,
  ),
)
