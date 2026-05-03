import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')

const softMode = process.argv.includes('--soft')
const prefixArg = process.argv.find((arg) => arg.startsWith('--prefix='))
const prefix = prefixArg ? prefixArg.split('=')[1] : null
const minSchemaArg = process.argv.find((arg) => arg.startsWith('--min-schema-version='))
const minSchemaVersion = minSchemaArg ? Number(minSchemaArg.split('=')[1]) : 1
const currentSchemaVersion = 1

const minLooksValid =
  Number.isFinite(minSchemaVersion) &&
  Number.isInteger(minSchemaVersion) &&
  minSchemaVersion >= 1

let status = 'compatible'
if (!minLooksValid) status = 'invalid'
else if (currentSchemaVersion < minSchemaVersion) status = 'incompatible'

const payload = {
  ok: status === 'compatible',
  status,
  schema_version: currentSchemaVersion,
  required_min_schema_version: minSchemaVersion,
  prefix,
  generated_at_utc: new Date().toISOString(),
}

if (status === 'invalid') payload.reason = 'invalid-min-schema-version'

await mkdir(closureDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outPath = path.join(closureDir, `${stamp}-release-gate-warn-only-pointer-handoff-schema-check.json`)
await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8')

console.log(JSON.stringify(payload, null, 2))
console.log(
  JSON.stringify(
    {
      ok: true,
      artifact_path: path.relative(root, outPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
)

if (!payload.ok && !softMode) process.exit(1)
