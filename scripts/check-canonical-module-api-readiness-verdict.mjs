import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const CHECKLIST_PATH = 'docs/CANONICAL_MODULE_API_CONSUMER_READINESS_CHECKLIST.md'
const COMMANDS = [
  ['canonical-contract', ['run', 'check:canonical-module-api-contract']],
  ['canonical-post-cutover', ['run', 'check:canonical-module-api-post-cutover']],
  ['canonical-response-snapshots', ['run', 'check:canonical-module-api-response-snapshots']],
  ['canonical-consumer-usage', ['run', 'check:canonical-module-api-consumer-usage']],
]

function runCommand(label, args) {
  const started = Date.now()
  const run = spawnSync('npm', args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const elapsedMs = Date.now() - started
  const exitCode = typeof run.status === 'number' ? run.status : 1
  return {
    label,
    command: `npm ${args.join(' ')}`,
    ok: exitCode === 0,
    exitCode,
    elapsedMs,
    outputExcerpt: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-40).join('\n'),
  }
}

function parseChecklist() {
  const abs = path.join(process.cwd(), CHECKLIST_PATH)
  const text = readFileSync(abs, 'utf8')
  const lines = text.split('\n')
  const unchecked = []
  const checked = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (line.startsWith('- [ ]')) {
      unchecked.push({ line: i + 1, text: line.replace('- [ ]', '').trim() })
    }
    if (line.startsWith('- [x]')) {
      checked.push({ line: i + 1, text: line.replace('- [x]', '').trim() })
    }
  }

  return {
    path: CHECKLIST_PATH,
    checkedCount: checked.length,
    uncheckedCount: unchecked.length,
    uncheckedItems: unchecked,
  }
}

const commandResults = COMMANDS.map(([label, args]) => runCommand(label, args))
const commandsOk = commandResults.every((r) => r.ok)
const checklist = parseChecklist()
const checklistOk = checklist.uncheckedCount === 0
const overallOk = commandsOk && checklistOk

const payload = {
  check: 'canonical-module-api-readiness-verdict',
  timestamp: isoNow,
  overallOk,
  commandsOk,
  checklistOk,
  commandResults,
  checklist,
  notes: [
    'Consolidates canonical contract checks + post-cutover guard + checklist status.',
    'Use as final readiness gate before enabling CANONICAL_MODULE_API_ONLY=1 in production.',
  ],
}

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-module-api-readiness-verdict.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-module-api-readiness-verdict.md`)
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const md = []
md.push('# Canonical module API readiness verdict')
md.push('')
md.push(`- Timestamp: ${isoNow}`)
md.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
md.push(`- Commands: ${commandsOk ? 'pass' : 'fail'}`)
md.push(`- Checklist: ${checklistOk ? 'pass' : 'fail'} (${checklist.uncheckedCount} unchecked)`)
md.push(`- JSON artifact: \`${jsonPath}\``)
md.push('')
md.push('## Command results')
md.push('')
for (const result of commandResults) {
  md.push(`- ${result.ok ? 'PASS' : 'FAIL'} \`${result.command}\` (${result.elapsedMs}ms)`)
}
md.push('')
md.push('## Unchecked checklist items')
md.push('')
if (checklist.uncheckedItems.length === 0) {
  md.push('- none')
} else {
  for (const item of checklist.uncheckedItems) {
    md.push(`- (${item.line}) ${item.text}`)
  }
}
md.push('')
md.push('## Raw payload')
md.push('')
md.push('```json')
md.push(JSON.stringify(payload, null, 2))
md.push('```')
md.push('')

writeFileSync(mdPath, md.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk, jsonPath, mdPath, unchecked: checklist.uncheckedCount }, null, 2))
process.exitCode = overallOk ? 0 : 1
