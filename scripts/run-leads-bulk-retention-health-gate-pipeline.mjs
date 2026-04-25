#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function runStep(label, command, args, env = process.env) {
  const startedAt = Date.now()
  const result = spawnSync(command, args, {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    label,
    command: [command, ...args].join(' '),
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    parsed: (() => {
      try {
        return result.stdout ? JSON.parse(String(result.stdout).trim()) : null
      } catch {
        return null
      }
    })(),
  }
}

const env = {
  ...process.env,
  LEADS_BULK_RETENTION_HEALTH_EVIDENCE_STRICT: '1',
  LEADS_BULK_RETENTION_HEALTH_EVIDENCE_RUN_CLEANUP:
    process.env.LEADS_BULK_RETENTION_HEALTH_EVIDENCE_RUN_CLEANUP || '1',
}

const steps = [
  runStep(
    'leads-bulk-retention-health-evidence',
    process.execPath,
    ['scripts/run-leads-bulk-retention-health-evidence.mjs'],
    env,
  ),
]

const overallOk = steps.every((s) => s.ok)
const output = {
  check: 'leads-bulk-retention-health-gate-pipeline',
  overallOk,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
    command: s.command,
  })),
}
let closurePack = null

if (overallOk) {
  const closurePackStep = runStep(
    'leads-bulk-retention-closure-pack',
    process.execPath,
    ['scripts/run-leads-bulk-retention-closure-pack.mjs'],
    env,
  )
  closurePack = {
    ok: closurePackStep.ok,
    exitCode: closurePackStep.exitCode,
    mdPath: closurePackStep.parsed?.mdPath || null,
    jsonPath: closurePackStep.parsed?.jsonPath || null,
  }
  if (!closurePackStep.ok) {
    output.overallOk = false
  }

  const closureDir = join(process.cwd(), 'docs', 'evidence', 'closure')
  const markerDir = join(closureDir, 'markers')
  mkdirSync(markerDir, { recursive: true })
  const markerPath = join(markerDir, 'leads-bulk-retention-health-gate-green.json')
  writeFileSync(
    markerPath,
    `${JSON.stringify(
      {
        check: output.check,
        overallOk: output.overallOk === true,
        generatedAt: new Date().toISOString(),
        steps: output.steps,
        closurePack,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  console.log(JSON.stringify({ markerPath }, null, 2))
}

output.closurePack = closurePack
console.log(JSON.stringify(output, null, 2))

if (!output.overallOk) {
  const failed = steps.find((s) => !s.ok)
  if (failed || (closurePack && !closurePack.ok)) {
    if (!failed && closurePack && !closurePack.ok) {
      console.error('\n# Failed step stdout')
      console.error('Closure pack generation failed.')
    }
    if (failed) {
    if (failed.stdout) {
      console.error('\n# Failed step stdout')
      console.error(failed.stdout)
    }
    if (failed.stderr) {
      console.error('\n# Failed step stderr')
      console.error(failed.stderr)
    }
    }
  }
}

process.exit(output.overallOk ? 0 : 1)
