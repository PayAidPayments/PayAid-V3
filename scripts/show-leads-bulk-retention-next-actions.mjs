#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const markersDir = path.join(closureDir, 'markers')
const markerPath = path.join(markersDir, 'leads-bulk-retention-health-gate-green.json')
const markerMaxAgeHours = Number(process.env.LEADS_BULK_RETENTION_HEALTH_GATE_MARKER_MAX_AGE_HOURS || 6)

function latestFileBySuffix(suffix) {
  const files = readdirSync(closureDir).filter((f) => f.endsWith(suffix)).sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function loadJsonFromRelative(fileName) {
  if (!fileName) return null
  return JSON.parse(readFileSync(path.join(closureDir, fileName), 'utf8'))
}

function safeParseMarker() {
  if (!existsSync(markerPath)) return { exists: false, parsed: null, valid: false }
  try {
    const parsed = JSON.parse(readFileSync(markerPath, 'utf8'))
    return { exists: true, parsed, valid: true }
  } catch {
    return { exists: true, parsed: null, valid: false }
  }
}

const latestHealthJsonFile = latestFileBySuffix('-leads-bulk-retention-scheduler-health.json')
const latestHealth = loadJsonFromRelative(latestHealthJsonFile)
const marker = safeParseMarker()

const markerGeneratedAtMs = Date.parse(String(marker.parsed?.generatedAt ?? ''))
const markerAgeHours = Number.isFinite(markerGeneratedAtMs)
  ? Number(((Date.now() - markerGeneratedAtMs) / (60 * 60 * 1000)).toFixed(2))
  : null
const markerFresh = markerAgeHours !== null && markerAgeHours <= markerMaxAgeHours
const markerPassing = marker.valid && marker.parsed?.overallOk === true

let nextAction = {
  type: 'run_gate_pipeline',
  message: 'No valid fresh marker found. Run gate pipeline first.',
  commands: ['npm run run:leads-bulk-retention-health-gate-pipeline'],
}

if (markerPassing && markerFresh) {
  nextAction = {
    type: 'verify_marker',
    message: 'Marker is present and fresh. Verify marker for release checks.',
    commands: ['npm run verify:leads-bulk-retention-health-gate-marker'],
  }
}

const followUpCommands = [
  'npm run run:leads-bulk-retention-health-evidence:with-cleanup',
  'npm run cleanup:leads-bulk-retention-artifacts',
]

console.log(
  JSON.stringify(
    {
      ok: true,
      marker: {
        exists: marker.exists,
        validJson: marker.valid,
        passing: markerPassing,
        fresh: markerFresh,
        maxAgeHours: markerMaxAgeHours,
        ageHours: markerAgeHours,
        path: markerPath,
      },
      latestHealthEvidence: latestHealthJsonFile
        ? {
            path: `docs/evidence/closure/${latestHealthJsonFile}`,
            ok: Boolean(latestHealth?.ok),
            capturedAt: latestHealth?.capturedAt || null,
          }
        : null,
      nextAction,
      followUpCommands,
    },
    null,
    2,
  ),
)
