import { readFile, readdir } from 'node:fs/promises'
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

async function collectSummaryFiles(rootDir) {
  const results = []
  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name === 'summary.md') {
        results.push(fullPath)
      }
    }
  }
  await walk(rootDir)
  return results
}

const REQUIRED_PREFIXES = [
  '- Run date:',
  '- Tenant ID:',
  '- Environment:',
  '- Window:',
  '- Collected by:',
  '- Provider/webhook delivery count:',
  '- Created Unibox conversation count:',
  '  - email:',
  '  - whatsapp:',
  '  - sms:',
  '  - web:',
  '  - phone:',
  '  - in_app:',
  '- First-response median:',
  '- First-response p95:',
  '- Breach count:',
  '- Breach rate:',
  '- Breach sample event id:',
  '- Breach sample conversation id:',
  '- Follow-up action id:',
  '- Non-breach control sample id:',
  '- Eligible recommendations:',
  '- Accepted recommendations:',
  '- Acceptance ratio:',
  '- Meets >20% target? (yes/no):',
  '- Inbound conversations criterion met? (yes/no):',
  '- SLA measurable/enforceable criterion met? (yes/no):',
  '- Next-action acceptance criterion met? (yes/no):',
  '- Reviewer:',
  '- Reviewed at:',
]

const CRITICAL_PREFIXES = [
  '- Provider/webhook delivery count:',
  '- Created Unibox conversation count:',
  '- First-response median:',
  '- First-response p95:',
  '- Acceptance ratio:',
  '- Inbound conversations criterion met? (yes/no):',
  '- SLA measurable/enforceable criterion met? (yes/no):',
  '- Next-action acceptance criterion met? (yes/no):',
]

function isPlaceholder(value) {
  const v = value.trim().toLowerCase()
  return v === '' || v === 'tbd' || v === '<tbd>'
}

function validateSummaryContent(content, filePath, { requireCritical }) {
  const lines = content.split(/\r?\n/)
  const issues = []
  let completedRequiredCount = 0
  let missingCriticalCount = 0

  for (const prefix of REQUIRED_PREFIXES) {
    const line = lines.find((l) => l.startsWith(prefix))
    if (!line) {
      issues.push(`Missing line: "${prefix}"`)
      continue
    }
    const idx = line.indexOf(':')
    const value = idx >= 0 ? line.slice(idx + 1) : ''
    if (isPlaceholder(value)) {
      issues.push(`Empty value for "${prefix}"`)
    } else {
      completedRequiredCount += 1
    }
  }

  // Ensure environment is one of staging/prod
  const envLine = lines.find((l) => l.startsWith('- Environment:'))
  if (envLine) {
    const env = envLine.split(':').slice(1).join(':').trim().toLowerCase()
    if (env && !['staging', 'prod'].includes(env)) {
      issues.push(`Invalid environment "${env}" (expected staging/prod)`)
    }
  }

  if (requireCritical) {
    for (const prefix of CRITICAL_PREFIXES) {
      const line = lines.find((l) => l.startsWith(prefix))
      if (!line) {
        missingCriticalCount += 1
        issues.push(`Missing critical line: "${prefix}"`)
        continue
      }
      const idx = line.indexOf(':')
      const value = idx >= 0 ? line.slice(idx + 1) : ''
      if (isPlaceholder(value)) {
        missingCriticalCount += 1
        issues.push(`Empty critical value for "${prefix}"`)
      }
    }
  }

  const completionPercent = Math.round((completedRequiredCount / REQUIRED_PREFIXES.length) * 100)
  return { filePath, issues, completedRequiredCount, completionPercent, missingCriticalCount }
}

async function main() {
  const args = parseArgs(process.argv)
  const strict = args.strict === 'true'
  const requireCritical = args['require-critical'] === 'true'
  const minPercentArg = args['min-percent']
  const singleSummary = args.summary
  const baseDir = path.join(process.cwd(), 'docs', 'evidence', 'm1-exit')
  const minPercent =
    minPercentArg == null
      ? null
      : Number.isFinite(Number(minPercentArg))
        ? Number(minPercentArg)
        : NaN
  if (minPercentArg != null && (!Number.isFinite(minPercent) || minPercent < 0 || minPercent > 100)) {
    throw new Error(`Invalid --min-percent "${minPercentArg}". Expected a number between 0 and 100.`)
  }

  const targets = singleSummary
    ? [path.isAbsolute(singleSummary) ? singleSummary : path.join(process.cwd(), singleSummary)]
    : await collectSummaryFiles(baseDir)

  if (targets.length === 0) {
    console.log('[m1-exit] No summary.md files found.')
    return
  }

  let issueCount = 0
  let criticalIssueCount = 0
  let totalCompleted = 0
  const totalRequired = REQUIRED_PREFIXES.length * targets.length
  for (const summaryPath of targets) {
    const content = await readFile(summaryPath, 'utf8')
    const { issues, completedRequiredCount, completionPercent, missingCriticalCount } = validateSummaryContent(
      content,
      summaryPath,
      { requireCritical }
    )
    totalCompleted += completedRequiredCount
    criticalIssueCount += missingCriticalCount
    if (issues.length === 0) {
      console.log(`[m1-exit] OK (${completionPercent}%): ${summaryPath}`)
      continue
    }
    issueCount += issues.length
    console.log(`[m1-exit] Issues in (${completionPercent}%): ${summaryPath}`)
    for (const issue of issues) {
      console.log(`  - ${issue}`)
    }
  }

  const overallPercent = totalRequired === 0 ? 100 : Math.round((totalCompleted / totalRequired) * 100)
  console.log(
    `[m1-exit] Completion summary: ${totalCompleted}/${totalRequired} required fields filled (${overallPercent}%).`
  )
  let thresholdFailed = false
  if (minPercent != null) {
    if (overallPercent >= minPercent) {
      console.log(`[m1-exit] Completion threshold met: ${overallPercent}% >= ${minPercent}%.`)
    } else {
      thresholdFailed = true
      console.log(`[m1-exit] Completion threshold NOT met: ${overallPercent}% < ${minPercent}%.`)
    }
  }
  if (requireCritical) {
    if (criticalIssueCount === 0) {
      console.log('[m1-exit] Critical-field gate met: all required critical fields are populated.')
    } else {
      console.log(`[m1-exit] Critical-field gate NOT met: ${criticalIssueCount} critical field gap(s).`)
    }
  }

  if (issueCount === 0 && !thresholdFailed && (!requireCritical || criticalIssueCount === 0)) {
    console.log('[m1-exit] Validation passed with no issues.')
    return
  }

  if (issueCount > 0) {
    console.log(`[m1-exit] Validation found ${issueCount} issue(s).`)
  }
  if (strict) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(`[m1-exit] Failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
