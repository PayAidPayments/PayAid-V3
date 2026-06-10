import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

function parseEnv(text) {
  const map = new Map()
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    map.set(key, value)
  }
  return map
}

function serializeEnv(map, header = '') {
  const lines = []
  if (header) {
    lines.push(`# ${header}`)
    lines.push('')
  }
  for (const [key, value] of map.entries()) {
    lines.push(`${key}=${value}`)
  }
  lines.push('')
  return lines.join('\n')
}

const root = process.cwd()
const stubPath = path.join(root, 'docs', 'evidence', 'voice-agent', 'bolna-stage1-app-env.stub')
const targetPath = path.join(root, '.env.local')

if (!existsSync(stubPath)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Missing app stub file',
        hint: 'Run: npm run voice-agent:write-bolna-stage1-stubs',
        stubPath,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const stubMap = parseEnv(readFileSync(stubPath, 'utf8'))
const existingMap = existsSync(targetPath) ? parseEnv(readFileSync(targetPath, 'utf8')) : new Map()

let added = 0
let keptExisting = 0
for (const [key, value] of stubMap.entries()) {
  if (!existingMap.has(key) || !String(existingMap.get(key) || '').trim()) {
    existingMap.set(key, value)
    added++
  } else {
    keptExisting++
  }
}

mkdirSync(path.dirname(targetPath), { recursive: true })
writeFileSync(
  targetPath,
  serializeEnv(existingMap, 'Generated/merged by npm run voice-agent:apply-bolna-app-stub (fills missing keys only)'),
  'utf8',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      targetPath,
      stubPath,
      added,
      keptExisting,
      totalKeys: existingMap.size,
    },
    null,
    2,
  ),
)
