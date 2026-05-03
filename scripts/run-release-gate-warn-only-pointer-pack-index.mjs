import { readdirSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const softMode = process.argv.includes('--soft')

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latestMarkdown = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-pack.md')
const latestJson = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-pack.json')
const now = new Date()
const stamp = now.toISOString().replace(/[:.]/g, '-')
const outPath = path.join(closureDir, `${stamp}-release-gate-warn-only-pointer-pack-index.json`)

await mkdir(closureDir, { recursive: true })

const payload = {
  ok: Boolean(latestMarkdown && latestJson),
  generated_at_utc: now.toISOString(),
  pointer_pack_markdown_artifact: latestMarkdown ? `docs/evidence/closure/${latestMarkdown}` : null,
  pointer_pack_json_artifact: latestJson ? `docs/evidence/closure/${latestJson}` : null,
}

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
