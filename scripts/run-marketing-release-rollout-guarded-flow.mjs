#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function runNpmScript(label, scriptName) {
  const startedAt = Date.now()
  const run = spawnSync('npm', ['run', scriptName], {
    shell: true,
    env: { ...process.env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    label,
    command: `npm run ${scriptName}`,
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    stdout: (run.stdout || '').trim(),
    stderr: (run.stderr || '').trim(),
  }
}

const skipRollout = process.env.MARKETING_RELEASE_GUARDED_FLOW_SKIP_ROLLOUT === '1'

const steps = [
  runNpmScript(
    'operator-policy-preflight',
    'show:marketing-release-operator-policy:rollout-warn-timeout-guard',
  ),
  runNpmScript('policy-mirror-verifier', 'verify:marketing-release-policy-mirror'),
]

if (skipRollout) {
  steps.push({
    label: 'rollout-verification-warn-timeout-guard',
    command: 'npm run run:marketing-release-production-rollout-verification:warn:timeout-guard',
    ok: true,
    exitCode: 0,
    elapsedMs: 0,
    skipped: true,
    skipReason: 'MARKETING_RELEASE_GUARDED_FLOW_SKIP_ROLLOUT=1',
    stdout: '',
    stderr: '',
  })
} else {
  steps.push(
    runNpmScript(
      'rollout-verification-warn-timeout-guard',
      'run:marketing-release-production-rollout-verification:warn:timeout-guard',
    ),
  )
}

const overallOk = steps.every((s) => s.ok)
const now = new Date()
const stamp = isoForFile(now)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const jsonPath = join(outDir, `${stamp}-marketing-release-rollout-guarded-flow.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-rollout-guarded-flow.md`)
const latestPath = join(outDir, 'latest-marketing-release-rollout-guarded-flow.md')

const payload = {
  check: 'marketing-release-rollout-guarded-flow',
  capturedAt: now.toISOString(),
  skipRollout,
  overallOk,
  steps: steps.map((s) => ({
    label: s.label,
    command: s.command,
    ok: s.ok,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
    skipped: Boolean(s.skipped),
    skipReason: s.skipReason || null,
  })),
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Marketing Release Rollout Guarded Flow',
  '',
  `- Captured at: ${payload.capturedAt}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Skip rollout: ${skipRollout ? 'yes' : 'no'}`,
  '',
  '## Steps',
  ...payload.steps.map(
    (s) =>
      `- ${s.label}: ${s.ok ? 'pass' : 'fail'} (exit=${s.exitCode}, elapsedMs=${s.elapsedMs}${s.skipped ? ', skipped' : ''})`,
  ),
  '',
  '## Artifacts',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
]
writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Rollout Guarded Flow',
  '',
  `- Last updated: ${payload.capturedAt}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Skip rollout: ${skipRollout ? 'yes' : 'no'}`,
  '',
  '## Artifacts',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '- `npm run run:marketing-release-rollout-guarded-flow`',
]
writeFileSync(latestPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: overallOk,
      check: payload.check,
      jsonPath,
      markdownPath: mdPath,
      latestPath,
    },
    null,
    2,
  ),
)

process.exit(overallOk ? 0 : 1)

