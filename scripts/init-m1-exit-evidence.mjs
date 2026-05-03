import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      args[key] = next
      i += 1
    } else {
      args[key] = 'true'
    }
  }
  return args
}

function isoDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function buildWindowStart(dateStr) {
  const end = new Date(`${dateStr}T00:00:00.000Z`)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 7)
  return start.toISOString()
}

function normalizeTenantId(tenantId) {
  return tenantId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function summaryTemplate({ runDate, tenantId, env }) {
  const windowEnd = `${runDate}T00:00:00.000Z`
  const windowStart = buildWindowStart(runDate)
  return `# M1 Exit Evidence Summary

- Run date: ${runDate}
- Tenant ID: ${tenantId}
- Environment: ${env}
- Window: ${windowStart} to ${windowEnd}
- Collected by:

## 1) Inbound Unibox Coverage

- Provider/webhook delivery count:
- Created Unibox conversation count:
- Coverage by channel:
  - email:
  - whatsapp:
  - sms:
  - web:
  - phone:
  - in_app:
- Gap notes (if any):
- Artifact path(s):

## 2) SLA Measurability

- First-response median:
- First-response p95:
- Breach count:
- Breach rate:
- Unibox settings screenshot/export path:
- Artifact path(s):

## 3) SLA Enforceability

- Breach sample event id:
- Breach sample conversation id:
- Breached at:
- Follow-up action id:
- Non-breach control sample id:
- Artifact path(s):

## 4) Next-Action Acceptance

- Eligible recommendations:
- Accepted recommendations:
- Acceptance ratio:
- Meets >20% target? (yes/no):
- Artifact path(s):

## Exit Decision

- Inbound conversations criterion met? (yes/no):
- SLA measurable/enforceable criterion met? (yes/no):
- Next-action acceptance criterion met? (yes/no):
- Reviewer:
- Reviewed at:
`
}

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch (_) {
    return false
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const tenantIdRaw = args.tenant || process.env.PAYAID_TENANT_ID || 'tn_sample'
  const envRaw = (args.env || 'staging').toLowerCase()
  if (!['staging', 'prod'].includes(envRaw)) {
    throw new Error(`Invalid --env "${envRaw}". Use "staging" or "prod".`)
  }
  const runDate = args.date || isoDateOnly(new Date())
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
    throw new Error(`Invalid --date "${runDate}". Expected YYYY-MM-DD.`)
  }

  const tenantId = normalizeTenantId(tenantIdRaw)
  const suffix = envRaw === 'prod' ? '_prod_m1-exit' : '_m1-exit'
  const folderName = `${runDate}_${tenantId}${suffix}`
  const targetDir = path.join(process.cwd(), 'docs', 'evidence', 'm1-exit', folderName)
  const summaryPath = path.join(targetDir, 'summary.md')

  await mkdir(targetDir, { recursive: true })
  if (await exists(summaryPath)) {
    console.log(`[m1-exit] Summary already exists: ${summaryPath}`)
    return
  }

  const content = summaryTemplate({ runDate, tenantId, env: envRaw })
  await writeFile(summaryPath, content, 'utf8')
  console.log(`[m1-exit] Created: ${summaryPath}`)
}

main().catch((error) => {
  console.error(`[m1-exit] Failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
