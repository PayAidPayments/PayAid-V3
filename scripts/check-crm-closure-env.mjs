import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const iso = now.toISOString()
const stamp = iso.replace(/[:.]/g, '-')

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const tenantId = process.env.TENANT_ID || ''
const authToken = process.env.AUTH_TOKEN || ''

const missing = []
if (!tenantId.trim()) missing.push('TENANT_ID')
if (!authToken.trim()) missing.push('AUTH_TOKEN')

const tokenPreview = authToken
  ? `${authToken.slice(0, 8)}...${authToken.slice(-6)} (len=${authToken.length})`
  : '[missing]'

const result = {
  timestamp: iso,
  baseUrl,
  tenantId: tenantId || '[missing]',
  authTokenPreview: tokenPreview,
  missing,
  ready: missing.length === 0,
}

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, `${stamp}-crm-closure-env-readiness.md`)

const lines = []
lines.push('# CRM Closure Env Readiness')
lines.push('')
lines.push(`- Timestamp: ${result.timestamp}`)
lines.push(`- BASE_URL: ${result.baseUrl}`)
lines.push(`- TENANT_ID: ${result.tenantId}`)
lines.push(`- AUTH_TOKEN: ${result.authTokenPreview}`)
lines.push(`- Ready: ${result.ready ? 'yes' : 'no'}`)
lines.push(`- Missing: ${result.missing.length ? result.missing.join(', ') : 'none'}`)
lines.push('')
lines.push('## Raw JSON')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(result, null, 2))
lines.push('```')
lines.push('')

writeFileSync(outputPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ ...result, outputPath }, null, 2))

process.exit(result.ready ? 0 : 1)
