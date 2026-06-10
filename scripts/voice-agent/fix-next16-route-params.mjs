#!/usr/bin/env node
/** One-off: sync apps/voice route/page params to Promise<> for Next.js 16. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const voiceApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/voice')

const files = []
function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) walk(p)
    else if (/\.(tsx?)$/.test(name.name)) files.push(p)
  }
}

walk(path.join(voiceApp, 'app'))

const typeReplacements = [
  [/\{ params \}: \{ params: \{ id: string \} \}/g, '{ params }: { params: Promise<{ id: string }> }'],
  [/\{ params \}: \{ params: \{ companyId: string \} \}/g, '{ params }: { params: Promise<{ companyId: string }> }'],
  [/params: \{ tenantId: string \}/g, 'params: Promise<{ tenantId: string }>'],
]

let changed = []
for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s
  for (const [re, rep] of typeReplacements) s = s.replace(re, rep)

  if (s.includes('Promise<{ id: string }>') && s.includes('params.id')) {
    s = s.replace(/params\.id/g, 'id')
    s = s.replace(
      /(export async function \w+\([^)]*\) \{\s*try \{\s*)/g,
      '$1const { id } = await params\n    ',
    )
  }
  if (s.includes('Promise<{ companyId: string }>') && s.includes('params.companyId')) {
    s = s.replace(/params\.companyId/g, 'companyId')
    s = s.replace(
      /(export async function \w+\([^)]*\) \{\s*try \{\s*)/g,
      '$1const { companyId } = await params\n    ',
    )
  }
  if (s.includes('Promise<{ tenantId: string }>') && /params\.tenantId/.test(s)) {
    s = s.replace(/params\.tenantId/g, 'tenantId')
    s = s.replace(
      /(export default (?:async )?function[^{]+\{)\s*/g,
      (m) => `${m}const { tenantId } = await params\n  `,
    )
  }

  if (s !== orig) {
    fs.writeFileSync(file, s)
    changed.push(path.relative(voiceApp, file))
  }
}

console.log(JSON.stringify({ changedCount: changed.length, changed }, null, 2))
