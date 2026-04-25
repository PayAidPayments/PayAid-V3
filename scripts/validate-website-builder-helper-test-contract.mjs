import { spawnSync } from 'node:child_process'

const EXPECTED_CHECK = 'website-builder-step4-8-helper-tests'
const REQUIRED_STEP_FIELDS = ['label', 'command', 'ok', 'exitCode', 'elapsedMs']
const ALLOWED_STEP_LABELS = new Set([
  'helper-contract-gate',
  'flag-parser-gate',
  'gates',
  'docs-gate',
  'helper-gate',
  'next-action',
  'token-probe',
])

function runHelperTests() {
  const run = spawnSync('npm', ['run', 'test:website-builder-step4-8-helpers'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  return {
    exitCode: typeof run.status === 'number' ? run.status : 1,
    stdout: run.stdout || '',
    stderr: run.stderr || '',
  }
}

function tryParseJsonFromOutput(stdout) {
  if (!stdout) return null
  const match = stdout.match(/(\{[\s\S]*\})\s*$/)
  const candidate = match ? match[1] : stdout
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function validateContract(payload) {
  const errors = []

  if (!payload || typeof payload !== 'object') {
    errors.push('Output payload is missing or not an object.')
    return errors
  }

  if (payload.check !== EXPECTED_CHECK) {
    errors.push(`check must equal "${EXPECTED_CHECK}".`)
  }

  if (typeof payload.overallOk !== 'boolean') {
    errors.push('overallOk must be boolean.')
  }

  if (!Array.isArray(payload.steps)) {
    errors.push('steps must be an array.')
    return errors
  }

  for (const [index, step] of payload.steps.entries()) {
    if (!step || typeof step !== 'object') {
      errors.push(`steps[${index}] must be an object.`)
      continue
    }
    for (const field of REQUIRED_STEP_FIELDS) {
      if (!(field in step)) {
        errors.push(`steps[${index}] is missing required field "${field}".`)
      }
    }
    if (!ALLOWED_STEP_LABELS.has(step.label)) {
      errors.push(
        `steps[${index}].label "${String(step.label)}" is not in allowed set: ${[
          ...ALLOWED_STEP_LABELS,
        ].join(', ')}.`
      )
    }
  }

  return errors
}

const run = runHelperTests()
const payload = tryParseJsonFromOutput(run.stdout)
const contractErrors = validateContract(payload)
const contractOk = contractErrors.length === 0
const overallOk = run.exitCode === 0 && contractOk

console.log(
  JSON.stringify(
    {
      check: 'website-builder-helper-test-contract',
      overallOk,
      helperTestsExitCode: run.exitCode,
      contractOk,
      contractErrors,
      allowedStepLabels: [...ALLOWED_STEP_LABELS],
    },
    null,
    2
  )
)

process.exitCode = overallOk ? 0 : 1
