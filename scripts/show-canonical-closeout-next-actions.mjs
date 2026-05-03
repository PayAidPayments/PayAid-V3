import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')

function latestFileBySuffix(suffix) {
  const files = readdirSync(closureDir).filter((f) => f.endsWith(suffix)).sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function loadJson(fileName) {
  if (!fileName) return null
  const abs = path.join(closureDir, fileName)
  return JSON.parse(readFileSync(abs, 'utf8'))
}

const snapshotFile = latestFileBySuffix('-canonical-closeout-status-snapshot.json')
const monitorFile = latestFileBySuffix('-canonical-monitoring-complete-check.json')
const snapshot = loadJson(snapshotFile)
const monitor = loadJson(monitorFile)

if (!snapshot || !monitor) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: 'missing_artifacts',
        message:
          'Run `npm run run:canonical-closeout-status-snapshot` and `npm run check:canonical-monitoring-complete` first.',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const nextCheckpoint = snapshot.nextCheckpoint || null
const nextAction =
  nextCheckpoint && !nextCheckpoint.dueNow
    ? {
        type: 'wait_until_due',
        message: `Wait for ${nextCheckpoint.label} eligibility at ${nextCheckpoint.eligibleAtUtc}, then run checkpoint alias.`,
        commands: [`npm run run:canonical-monitor:${nextCheckpoint.label}`],
      }
    : {
        type: 'run_due_now',
        message: 'A checkpoint should be due now; run due checkpoint orchestrator.',
        commands: ['npm run run:canonical-due-monitor-checkpoints'],
      }

const finalizeCommands = [
  'npm run check:canonical-monitoring-complete',
  'npm run check:canonical-module-api-readiness-verdict:stable',
  'npm run run:canonical-closeout-status-snapshot',
]

console.log(
  JSON.stringify(
    {
      ok: true,
      latestSnapshot: snapshotFile ? `docs/evidence/closure/${snapshotFile}` : null,
      latestMonitoringCheck: monitorFile ? `docs/evidence/closure/${monitorFile}` : null,
      monitoringComplete: monitor.overallOk === true,
      nextCheckpoint,
      nextAction,
      finalizeCommands,
    },
    null,
    2
  )
)
