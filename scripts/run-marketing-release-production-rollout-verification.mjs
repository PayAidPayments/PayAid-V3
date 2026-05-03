#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { enrichTimeoutResult, resolveTimeoutMs } from './lib/timeout-helpers.mjs'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function resolveCheckTimeoutMs(label) {
  if (label === 'policy-mirror-verifier') {
    return resolveTimeoutMs({
      globalKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_POLICY_MIRROR',
    })
  }
  if (label === 'warning-flag-resolver') {
    return resolveTimeoutMs({
      globalKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_WARNING_FLAG_RESOLVER',
    })
  }
  if (label === 'evidence-helpers-suite') {
    return resolveTimeoutMs({
      globalKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_EVIDENCE_HELPERS_SUITE',
    })
  }
  if (
    label === 'evidence-bundle-with-helpers' ||
    label === 'evidence-bundle-with-helpers-and-latency-warn'
  ) {
    return resolveTimeoutMs({
      globalKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_EVIDENCE_BUNDLE',
    })
  }
  if (label === 'evidence-latency-gate-warn') {
    return resolveTimeoutMs({
      globalKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_EVIDENCE_LATENCY_GATE',
    })
  }
  return resolveTimeoutMs({
    globalKey: 'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS',
  })
}

function runCommand(label, command, args, options = {}) {
  const timeoutMs = resolveCheckTimeoutMs(label)
  const run = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: timeoutMs,
    ...options,
  })
  const timeoutMeta = enrichTimeoutResult({
    label,
    timeoutMs,
    status: run.status,
    error: run.error,
    stderr: run.stderr || '',
  })
  return {
    ok: run.status === 0,
    exitCode: timeoutMeta.exitCode,
    timedOut: timeoutMeta.timedOut,
    timeoutMs: timeoutMeta.timeoutMs,
    stdout: (run.stdout || '').trim(),
    stderr: timeoutMeta.stderr,
  }
}

function runNpmScript(label, scriptName) {
  const run = runCommand(label, 'npm', ['run', scriptName], { shell: true })
  return {
    name: label,
    ok: run.ok,
    exitCode: run.exitCode,
    timedOut: run.timedOut,
    timeoutMs: run.timeoutMs,
    command: `npm run ${scriptName}`,
    output: [run.stdout, run.stderr].filter(Boolean).join('\n').trim(),
  }
}

const closureDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(closureDir, { recursive: true })

const stamp = isoForFile(new Date())
const capturedAt = new Date().toISOString()
const jsonPath = join(closureDir, `${stamp}-marketing-release-production-rollout-verification.json`)
const mdPath = join(closureDir, `${stamp}-marketing-release-production-rollout-verification.md`)
const latestPath = join(closureDir, 'latest-marketing-release-production-rollout-verification.md')

const branchRun = runCommand('git-branch-check', 'git', ['branch', '--show-current'])
const headRun = runCommand('git-head-check', 'git', ['rev-parse', 'HEAD'])
const branch = branchRun.stdout || 'unknown'
const head = headRun.stdout || 'unknown'
const warningOnly = process.env.MARKETING_RELEASE_PRODUCTION_VERIFICATION_WARNING_ONLY === '1'
const evidenceBundleScript = warningOnly
  ? 'run:marketing-release-gate-evidence-bundle:with-helpers-and-latency:warn'
  : 'run:marketing-release-gate-evidence-bundle:with-helpers'
const evidenceBundleLabel = warningOnly
  ? 'evidence-bundle-with-helpers-and-latency-warn'
  : 'evidence-bundle-with-helpers'

const checks = [
  runNpmScript('policy-mirror-verifier', 'verify:marketing-release-policy-mirror'),
  runNpmScript('warning-flag-resolver', 'test:marketing-release-warning-flag-resolver'),
  runNpmScript('evidence-helpers-suite', 'test:marketing-release-evidence-helpers-suite'),
  runNpmScript(evidenceBundleLabel, evidenceBundleScript),
  runNpmScript(
    'evidence-latency-gate-warn',
    'run:marketing-release-evidence-latency-gate:warn',
  ),
]

const requiredPointers = [
  'docs/evidence/closure/latest-marketing-release-gate-evidence-bundle.md',
  'docs/evidence/closure/latest-marketing-release-evidence-helpers-suite.md',
  'docs/evidence/closure/latest-marketing-release-gate-profile-matrix.md',
  'docs/evidence/closure/latest-marketing-release-gate-verdict-evidence.md',
]

const pointers = requiredPointers.map((relativePath) => ({
  path: relativePath,
  exists: existsSync(join(process.cwd(), relativePath)),
}))

const allChecksOk = checks.every((check) => check.ok)
const allPointersOk = pointers.every((pointer) => pointer.exists)
const ok = allChecksOk && allPointersOk

const payload = {
  check: 'marketing-release-production-rollout-verification',
  capturedAt,
  warningOnly,
  ok,
  branch,
  head,
  checks,
  pointers,
  timeoutDefaults: {
    global: resolveCheckTimeoutMs('default'),
    policyMirrorVerifier: resolveCheckTimeoutMs('policy-mirror-verifier'),
    warningFlagResolver: resolveCheckTimeoutMs('warning-flag-resolver'),
    evidenceHelpersSuite: resolveCheckTimeoutMs('evidence-helpers-suite'),
    evidenceBundle: resolveCheckTimeoutMs(evidenceBundleLabel),
    evidenceLatencyGate: resolveCheckTimeoutMs('evidence-latency-gate-warn'),
  },
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Marketing Release Production Rollout Verification',
  '',
  `- Captured at: ${capturedAt}`,
  `- Branch: \`${branch}\``,
  `- Head: \`${head}\``,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Overall OK: ${ok ? 'yes' : 'no'}`,
  '',
  '## Checks',
  ...checks.map(
    (check) =>
      `- ${check.name}: ${check.ok ? 'pass' : 'fail'} (exit=${check.exitCode}, timeoutMs=${check.timeoutMs}${check.timedOut ? ', timed out' : ''})`,
  ),
  '',
  '## Pointer Files',
  ...pointers.map((pointer) => `- \`${pointer.path}\`: ${pointer.exists ? 'present' : 'missing'}`),
  '',
  '## Artifacts',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
]

writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Production Rollout Verification',
  '',
  `- Last updated: ${capturedAt}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Overall OK: ${ok ? 'yes' : 'no'}`,
  '',
  '## Artifacts',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '- `npm run run:marketing-release-production-rollout-verification`',
]

writeFileSync(latestPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok,
      check: payload.check,
      jsonPath,
      markdownPath: mdPath,
      latestPath,
    },
    null,
    2,
  ),
)

if (!ok) {
  process.exit(1)
}
