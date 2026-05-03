/**
 * Next.js 15+: route `params` is a Promise. Migrates handlers under apps/dashboard/app/api.
 * Usage: node scripts/fix-route-handler-async-params.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiRoot = path.join(__dirname, '../apps/dashboard/app/api')

function walkRouteTs(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) walkRouteTs(p, out)
    else if (name.name === 'route.ts') out.push(p)
  }
  return out
}

function paramKeyFromFile(filePath) {
  const rel = filePath.replace(/\\/g, '/')
  const matches = [...rel.matchAll(/\[([^\]]+)\]/g)]
  if (!matches.length) return null
  return matches[matches.length - 1][1]
}

function processFile(filePath) {
  const key = paramKeyFromFile(filePath)
  if (!key) return false

  let s = fs.readFileSync(filePath, 'utf8')
  const syncType = `{ params }: { params: { ${key}: string } }`
  const asyncType = `{ params }: { params: Promise<{ ${key}: string }> }`

  if (!s.includes(syncType)) return false

  s = s.split(syncType).join(asyncType)

  const injectRe = new RegExp(
    `(export async function (?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\\s*\\([\\s\\S]*?\\{ params \\}: \\{ params: Promise<\\{ ${key}: string \\}> \\}[\\s\\S]*?\\)\\s*\\{)(?!\\s*const \\{ ${key} \\} = await params)`,
    'g'
  )
  s = s.replace(injectRe, `$1\n  const { ${key} } = await params`)

  const paramsDot = new RegExp(`\\bparams\\.${key}\\b`, 'g')
  s = s.replace(paramsDot, key)

  fs.writeFileSync(filePath, s, 'utf8')
  return true
}

let n = 0
for (const f of walkRouteTs(apiRoot)) {
  try {
    if (processFile(f)) {
      console.log('updated', path.relative(path.join(__dirname, '..'), f))
      n++
    }
  } catch (e) {
    console.error('error', f, e)
  }
}
console.log('done, files updated:', n)
