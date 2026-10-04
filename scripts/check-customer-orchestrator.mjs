#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

function main() {
  const required = [
    'lib/ai/customer-specialists/orchestrator/runbooks.json',
    'lib/ai/customer-specialists/orchestrator/run-orchestrator.ts',
    'lib/ai/customer-specialists/orchestrator/draft-store.ts',
    'lib/ai/customer-specialists/orchestrator/index.ts',
    'apps/dashboard/app/api/ai/customer-flows/orchestrate/route.ts',
    'apps/dashboard/app/api/ai/customer-flows/drafts/route.ts',
    'apps/dashboard/app/api/ai/customer-flows/drafts/[draftId]/approve/route.ts',
    'apps/dashboard/app/ai-studio/[tenantId]/Flows/page.tsx',
    'docs/ai/customer/orchestrator.md',
    'scripts/smoke-customer-orchestrator.ts',
  ]

  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  }

  const runbooks = JSON.parse(
    fs.readFileSync(
      path.join(root, 'lib/ai/customer-specialists/orchestrator/runbooks.json'),
      'utf8'
    )
  )
  if (runbooks.pack !== 'customer') fail('orchestrator runbooks pack must be customer')
  if ((runbooks.maxAttempts || 0) < 3) fail('maxAttempts must be >= 3')
  const slugs = (runbooks.runbooks || []).map((r) => r.slug)
  for (const slug of ['sales-follow-up', 'gst-invoice-draft']) {
    if (!slugs.includes(slug)) fail(`missing runbook ${slug}`)
  }

  const approveRoute = fs.readFileSync(
    path.join(
      root,
      'apps/dashboard/app/api/ai/customer-flows/drafts/[draftId]/approve/route.ts'
    ),
    'utf8'
  )
  if (!approveRoute.includes('Not sent, filed, or paid')) {
    fail('approve route must document non-execution guarantee')
  }

  if (process.exitCode) {
    console.error('Customer orchestrator check FAILED (files)')
    process.exit(1)
  }

  const tsxCli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const smoke = spawnSync(
    process.execPath,
    [tsxCli, path.join(root, 'scripts', 'smoke-customer-orchestrator.ts')],
    { cwd: root, encoding: 'utf8' }
  )
  if (smoke.stdout) process.stdout.write(smoke.stdout)
  if (smoke.stderr) process.stderr.write(smoke.stderr)
  if (smoke.status !== 0) {
    fail(`orchestrator smoke exited ${smoke.status}`)
    process.exit(1)
  }

  console.log('Customer orchestrator check PASS')
}

main()
