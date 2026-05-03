import { readdirSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const releaseDir = path.join(process.cwd(), 'docs', 'evidence', 'release-gates')
const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')

function latestReleaseGateArtifact() {
  const files = readdirSync(releaseDir)
    .filter((f) => f.endsWith('-release-gate-suite.json'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function parseJson(relName) {
  if (!relName) return null
  const abs = path.join(releaseDir, relName)
  return JSON.parse(readFileSync(abs, 'utf8'))
}

const latest = latestReleaseGateArtifact()
const artifact = parseJson(latest)
const outputModeArg = process.argv.find((arg) => arg.startsWith('--format='))
const outputMode = outputModeArg ? outputModeArg.split('=')[1] : 'json'
const writeArtifact = process.argv.includes('--write')

function toMarkdown(payload, actions) {
  const lines = []
  lines.push('# Warn-only gate next actions')
  lines.push('')
  lines.push(`- Artifact: ${payload.latestReleaseGateArtifact}`)
  lines.push(`- all_pass: ${payload.allPass}`)
  lines.push(`- warn_only_failure_count: ${payload.warnOnlyFailureCount}`)
  if (payload.warnOnlyFailureCount === 0) {
    lines.push('')
    lines.push('No warn-only gate failures in the latest release-gate artifact.')
    return `${lines.join('\n')}\n`
  }
  lines.push('')
  for (const action of actions) {
    const failure = payload.warnOnlyFailures.find((x) => x.gate === action.gate)
    lines.push(`## ${action.gate}`)
    if (failure) {
      lines.push(`- exit_code: ${failure.exit_code}`)
      lines.push(`- timed_out: ${failure.timed_out}`)
      lines.push(`- duration_ms: ${failure.duration_ms}`)
    }
    lines.push(`- issue: ${action.issue}`)
    lines.push(`- notes: ${action.notes}`)
    lines.push('- commands:')
    for (const c of action.commands) {
      lines.push(`  - \`${c}\``)
    }
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

if (!artifact || !Array.isArray(artifact.results)) {
  const payload = {
    ok: false,
    reason: 'missing_release_gate_artifact',
    message: 'Run `npm run release:gate:timeline-contracts` (or another release gate) first.',
  }
  if (outputMode === 'markdown') {
    console.log('# Warn-only gate next actions')
    console.log('')
    console.log('- Status: missing release-gate artifact')
    console.log(`- Message: ${payload.message}`)
  } else {
    console.log(JSON.stringify(payload, null, 2))
  }
  process.exit(1)
}

const warnOnlyFailures = artifact.results.filter((r) => {
  const failed = Number(r.exit_code) !== 0 || r.timed_out === true
  return r.warn_only === true && failed
})

const actions = warnOnlyFailures.map((r) => {
  if (r.gate === 'prisma-generate-closure-contracts') {
    return {
      gate: r.gate,
      issue: 'Prisma generate closure timed out/failed (warn-only)',
      commands: [
        'npm run check:prisma-generate-closure',
        'npm run db:generate',
        'npm run db:local:migrate',
      ],
      notes: 'Prefer Ubuntu CI/WSL for clean Prisma generate signals when Windows host hangs.',
    }
  }
  return {
    gate: r.gate,
    issue: 'Warn-only gate failed',
    commands: ['npm run release:gate:timeline-contracts'],
    notes: 'Review release-gate output_excerpt for this gate.',
  }
})

const payload = {
  ok: true,
  latestReleaseGateArtifact: `docs/evidence/release-gates/${latest}`,
  allPass: artifact.all_pass === true,
  warnOnlyFailureCount: warnOnlyFailures.length,
  warnOnlyFailures: warnOnlyFailures.map((r) => ({
    gate: r.gate,
    exit_code: r.exit_code,
    timed_out: r.timed_out,
    duration_ms: r.duration_ms,
  })),
  nextActions: actions,
}

if (outputMode === 'markdown') {
  const markdown = toMarkdown(payload, actions)
  console.log(markdown)
  if (writeArtifact) {
    await mkdir(closureDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outPath = path.join(closureDir, `${stamp}-release-gate-warn-only-next-actions.md`)
    await writeFile(outPath, markdown, 'utf8')
    console.log(
      JSON.stringify(
        {
          ok: true,
          artifact_path: path.relative(process.cwd(), outPath).replaceAll('\\', '/'),
        },
        null,
        2
      )
    )
  }
} else {
  console.log(JSON.stringify(payload, null, 2))
}
