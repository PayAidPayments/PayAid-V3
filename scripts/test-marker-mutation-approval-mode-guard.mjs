#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

function runSetMarker(scriptPath, cwd, env = {}) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

function parseExpiresAt(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.trim().toLowerCase().startsWith('expiresat='))
  if (!line) return null
  return line.split('=').slice(1).join('=').trim()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const repoRoot = process.cwd()
const setMarkerScriptPath = join(repoRoot, 'scripts', 'set-marker-mutation-approval.mjs')
const tempBase = mkdtempSync(join(tmpdir(), 'payaid-marker-guard-'))
const approvalFile = join(
  tempBase,
  'docs',
  'evidence',
  'closure',
  'markers',
  'ALLOW_MARKER_MUTATION'
)

try {
  // Case 1: until env set but NOT explicitly enabled -> should still use TTL mode.
  {
    const now = Date.now()
    const untilIso = new Date(now + 12 * 60 * 60 * 1000).toISOString() // 12h
    const res = runSetMarker(setMarkerScriptPath, tempBase, {
      MARKER_MUTATION_APPROVAL_TTL_MINUTES: '1',
      MARKER_MUTATION_APPROVAL_UNTIL_ISO: untilIso,
      // MARKER_MUTATION_APPROVAL_USE_UNTIL_ENV intentionally omitted
    })
    assert(res.status === 0, `Case1 failed to run script: ${res.stderr || res.stdout}`)
    const expRaw = parseExpiresAt(approvalFile)
    assert(expRaw, 'Case1 missing expiresAt entry')
    const expMs = Date.parse(expRaw)
    const mins = (expMs - now) / (60 * 1000)
    assert(mins > 0.3 && mins < 3, `Case1 expected ~1 min TTL, got ${mins.toFixed(2)} min`)
  }

  // Cleanup between cases
  rmSync(join(tempBase, 'docs'), { recursive: true, force: true })

  // Case 2: until env enabled -> should honor absolute-until timestamp.
  {
    const now = Date.now()
    const untilIso = new Date(now + 12 * 60 * 60 * 1000).toISOString() // 12h
    const res = runSetMarker(setMarkerScriptPath, tempBase, {
      MARKER_MUTATION_APPROVAL_TTL_MINUTES: '1',
      MARKER_MUTATION_APPROVAL_UNTIL_ISO: untilIso,
      MARKER_MUTATION_APPROVAL_USE_UNTIL_ENV: '1',
    })
    assert(res.status === 0, `Case2 failed to run script: ${res.stderr || res.stdout}`)
    const expRaw = parseExpiresAt(approvalFile)
    assert(expRaw, 'Case2 missing expiresAt entry')
    const expMs = Date.parse(expRaw)
    const hrs = (expMs - now) / (60 * 60 * 1000)
    assert(hrs > 10 && hrs < 13, `Case2 expected ~12h until window, got ${hrs.toFixed(2)}h`)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        check: 'marker-mutation-approval-mode-guard',
        cases: [
          'until env ignored unless explicitly enabled',
          'until env honored when MARKER_MUTATION_APPROVAL_USE_UNTIL_ENV=1',
        ],
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        check: 'marker-mutation-approval-mode-guard',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
} finally {
  rmSync(tempBase, { recursive: true, force: true })
}

