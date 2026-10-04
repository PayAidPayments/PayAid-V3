#!/usr/bin/env node
/**
 * Phase 3 customer product-flow integrity + smoke.
 */
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
    'lib/ai/customer-specialists/flows/sales-follow-up.ts',
    'lib/ai/customer-specialists/flows/gst-invoice-draft.ts',
    'lib/ai/customer-specialists/flows/audit.ts',
    'lib/ai/customer-specialists/flows/types.ts',
    'lib/ai/customer-specialists/flows/index.ts',
    'apps/dashboard/app/api/ai/customer-flows/sales-follow-up/route.ts',
    'apps/dashboard/app/api/ai/customer-flows/gst-invoice-draft/route.ts',
    'docs/ai/customer/flows.md',
    'scripts/smoke-customer-flows.ts',
  ]

  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`)
  }

  const salesRoute = fs.readFileSync(
    path.join(root, 'apps/dashboard/app/api/ai/customer-flows/sales-follow-up/route.ts'),
    'utf8'
  )
  const gstRoute = fs.readFileSync(
    path.join(root, 'apps/dashboard/app/api/ai/customer-flows/gst-invoice-draft/route.ts'),
    'utf8'
  )
  if (!salesRoute.includes('wrapAiRoute')) fail('sales route must use wrapAiRoute')
  if (!gstRoute.includes('wrapAiRoute')) fail('gst route must use wrapAiRoute')
  if (!salesRoute.includes('modeFrom: () => \'draft\'') && !salesRoute.includes('modeFrom: () => "draft"')) {
    fail('sales route must force draft mode')
  }
  if (!gstRoute.includes('modeFrom: () => \'draft\'') && !gstRoute.includes('modeFrom: () => "draft"')) {
    fail('gst route must force draft mode')
  }

  if (process.exitCode) {
    console.error('Customer flows check FAILED (files)')
    process.exit(process.exitCode)
  }

  const tsxCli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')
  if (!fs.existsSync(tsxCli)) {
    fail('tsx CLI missing; cannot run flow smoke')
    process.exit(1)
  }

  const smoke = spawnSync(
    process.execPath,
    [tsxCli, path.join(root, 'scripts', 'smoke-customer-flows.ts')],
    { cwd: root, encoding: 'utf8' }
  )
  if (smoke.stdout) process.stdout.write(smoke.stdout)
  if (smoke.stderr) process.stderr.write(smoke.stderr)
  if (smoke.status !== 0) {
    fail(`flow smoke exited ${smoke.status}`)
    process.exit(1)
  }

  console.log('Customer flows check PASS')
}

main()
