import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const blueprintPath = path.join(root, 'docs', 'PAYAID_V3_BLUEPRINT_GAP_CHECKLIST.md')

function latestFileBySuffix(suffix) {
  const files = readdirSync(closureDir).filter((f) => f.endsWith(suffix)).sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function loadJson(fileName) {
  if (!fileName) return null
  return JSON.parse(readFileSync(path.join(closureDir, fileName), 'utf8'))
}

const snapshotFile = latestFileBySuffix('-canonical-closeout-status-snapshot.json')
const snapshot = loadJson(snapshotFile)

if (!snapshotFile || !snapshot) {
  console.error('Missing canonical closeout snapshot artifact.')
  process.exit(1)
}

const nextCheckpoint = snapshot.nextCheckpoint || null
const state = snapshot.overallOk ? 'PASS' : 'FAIL'
const stateNote = snapshot.overallOk
  ? '(all canonical closeout gates currently green)'
  : '(expected until time-gated monitoring windows complete)'
const nextLine = nextCheckpoint
  ? `- Next due checkpoint: \`${nextCheckpoint.label}\` at \`${nextCheckpoint.eligibleAtUtc}\` (remaining \`${nextCheckpoint.remainingMinutes}\` minutes at last refresh)`
  : '- Next due checkpoint: `none` (all checkpoints complete)'
const nextCommand = nextCheckpoint
  ? `- Next command when due: \`npm run run:canonical-monitor:${nextCheckpoint.label}\``
  : '- Next command when due: `npm run check:canonical-monitoring-complete`'

const newBlock = [
  '## Live closeout status (canonical gate)',
  '',
  `- Latest consolidated status: \`docs/evidence/closure/${snapshotFile.replace('.json', '.md')}\``,
  `- Current state: \`${state}\` ${stateNote}`,
  nextLine,
  nextCommand,
  '- One-command refresh: `npm run run:canonical-status-refresh`',
  '',
].join('\n')

const text = readFileSync(blueprintPath, 'utf8')
const startMarker = '## Live closeout status (canonical gate)'
const endMarker = '\n## Non-negotiable execution directives'
const startIdx = text.indexOf(startMarker)
const endIdx = text.indexOf(endMarker)

if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
  console.error('Could not locate live status block boundaries.')
  process.exit(1)
}

const updated = text.slice(0, startIdx) + newBlock + text.slice(endIdx + 1)
writeFileSync(blueprintPath, updated, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: true,
      updatedFile: 'docs/PAYAID_V3_BLUEPRINT_GAP_CHECKLIST.md',
      snapshot: `docs/evidence/closure/${snapshotFile}`,
      state,
      nextCheckpoint,
    },
    null,
    2
  )
)
