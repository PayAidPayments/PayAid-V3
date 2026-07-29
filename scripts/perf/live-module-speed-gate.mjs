#!/usr/bin/env node

/**
 * Live Module Speed Gate
 * 
 * Logs into the deployed PayAid V3 app and measures:
 * - TTFB and response times for key module APIs
 * - Time-to-useful for critical dashboard endpoints
 * 
 * Fails if any critical API exceeds threshold or returns 500
 * 
 * Usage:
 *   PERF_BASE_URL=https://payaid-v3.vercel.app \
 *   PERF_TEST_EMAIL=admin@demo.com \
 *   PERF_TEST_PASSWORD=Test@1234 \
 *   PERF_API_BUDGET_MS=8000 \
 *   npm run perf:live-modules
 */

import { performance } from 'node:perf_hooks'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Configuration
const BASE_URL = process.env.PERF_BASE_URL || 'https://payaid-v3.vercel.app'
const EMAIL = process.env.PERF_TEST_EMAIL || 'admin@demo.com'
const PASSWORD = process.env.PERF_TEST_PASSWORD || 'Test@1234'
const API_BUDGET_MS = parseInt(process.env.PERF_API_BUDGET_MS || '8000', 10)

// ANSI colors
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

let token = null
let tenantId = null
let exitCode = 0

// Test results
const results = []

async function login() {
  console.log(`${BLUE}${BOLD}Logging in to ${BASE_URL}...${RESET}`)
  
  const start = performance.now()
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const elapsed = performance.now() - start

  if (!response.ok) {
    console.error(`${RED}Login failed: ${response.status} ${response.statusText}${RESET}`)
    process.exit(1)
  }

  const data = await response.json()
  token = data.token
  tenantId = data.user?.tenantId || data.tenant?.id

  console.log(`${GREEN}✓ Login successful (${elapsed.toFixed(0)}ms)${RESET}`)
  console.log(`  Token: ${token ? '✓' : '✗'}`)
  console.log(`  Tenant ID: ${tenantId || 'N/A'}`)
  console.log()

  return { token, tenantId }
}

async function measureAPI(name, url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  
  console.log(`${BLUE}Testing: ${name}${RESET}`)
  console.log(`  URL: ${fullUrl}`)

  const start = performance.now()
  let response
  let error = null
  
  try {
    response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch (err) {
    error = err.message
  }

  const elapsed = performance.now() - start
  const status = response?.status || 0
  const statusText = response?.statusText || 'ERROR'

  // Collect result
  const result = {
    name,
    url: fullUrl,
    status,
    statusText,
    elapsed: Math.round(elapsed),
    error,
    budget: API_BUDGET_MS,
    withinBudget: elapsed <= API_BUDGET_MS && status !== 500,
  }

  results.push(result)

  // Print result
  const statusColor = status >= 500 ? RED : status >= 400 ? YELLOW : GREEN
  const budgetColor = result.withinBudget ? GREEN : RED
  const budgetSymbol = result.withinBudget ? '✓' : '✗'

  console.log(`  Status: ${statusColor}${status} ${statusText}${RESET}`)
  console.log(`  Time: ${budgetColor}${elapsed.toFixed(0)}ms ${budgetSymbol}${RESET} (budget: ${API_BUDGET_MS}ms)`)

  if (error) {
    console.log(`  ${RED}Error: ${error}${RESET}`)
  }

  if (!result.withinBudget) {
    console.log(`  ${RED}${BOLD}FAILED: ${elapsed > API_BUDGET_MS ? 'Exceeded budget' : 'Server error'}${RESET}`)
    exitCode = 1
  }

  console.log()

  return result
}

async function testModuleAPIs() {
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════${RESET}`)
  console.log(`${BOLD}${BLUE}   PayAid V3 Live Module Speed Gate${RESET}`)
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════${RESET}`)
  console.log()

  await login()

  console.log(`${BOLD}Testing Critical Module APIs...${RESET}`)
  console.log()

  // Home / Dashboard
  await measureAPI('Home Summary', '/api/home/summary')
  await measureAPI('Home Briefing', '/api/home/briefing')

  // CRM
  if (tenantId) {
    await measureAPI('CRM Dashboard Stats (lite)', `/api/crm/dashboard/stats?lite=1&tenantId=${tenantId}`)
  }

  // Marketing (if available)
  if (tenantId) {
    await measureAPI('Marketing Dashboard', `/api/marketing/dashboard/enriched?tenantId=${tenantId}`)
  }

  // HR
  if (tenantId) {
    await measureAPI('HR Summary (lite)', `/api/hr/summary?tenantId=${tenantId}`)
  }

  // Finance
  if (tenantId) {
    await measureAPI('Finance Dashboard Stats', `/api/finance/dashboard/stats?tenantId=${tenantId}`)
  }

  // Notifications (chrome)
  await measureAPI('Notifications', '/api/notifications?limit=50')

  // Print summary
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════${RESET}`)
  console.log(`${BOLD}${BLUE}   Summary${RESET}`)
  console.log(`${BOLD}${BLUE}═══════════════════════════════════════════${RESET}`)
  console.log()

  const passed = results.filter((r) => r.withinBudget).length
  const failed = results.filter((r) => !r.withinBudget).length
  const total = results.length

  console.log(`  Total: ${total}`)
  console.log(`  ${GREEN}Passed: ${passed}${RESET}`)
  console.log(`  ${RED}Failed: ${failed}${RESET}`)
  console.log()

  // Table
  console.log(`${BOLD}Results Table:${RESET}`)
  console.log()
  console.log('┌────────────────────────────────────────┬─────────┬──────────┬──────────┐')
  console.log('│ API Endpoint                           │ Status  │ Time (ms)│ Result   │')
  console.log('├────────────────────────────────────────┼─────────┼──────────┼──────────┤')

  results.forEach((r) => {
    const name = r.name.padEnd(38).slice(0, 38)
    const status = String(r.status).padEnd(7).slice(0, 7)
    const time = String(r.elapsed).padStart(8).slice(0, 8)
    const resultText = r.withinBudget ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`
    console.log(`│ ${name} │ ${status} │ ${time} │ ${resultText}   │`)
  })

  console.log('└────────────────────────────────────────┴─────────┴──────────┴──────────┘')
  console.log()

  // Write evidence
  const evidenceDir = `${__dirname}/../../docs/evidence/perf`
  try {
    mkdirSync(evidenceDir, { recursive: true })
  } catch {}

  const evidencePath = `${evidenceDir}/live-speed-gate-${Date.now()}.json`
  const evidence = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    budgetMs: API_BUDGET_MS,
    summary: {
      total,
      passed,
      failed,
    },
    results,
  }

  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2))
  console.log(`${GREEN}Evidence written to:${RESET} ${evidencePath}`)
  console.log()

  // Exit
  if (exitCode !== 0) {
    console.log(`${RED}${BOLD}SPEED GATE FAILED${RESET}`)
    console.log(`${RED}One or more APIs exceeded budget or returned server error.${RESET}`)
    console.log()
  } else {
    console.log(`${GREEN}${BOLD}SPEED GATE PASSED${RESET}`)
    console.log(`${GREEN}All critical APIs are within budget.${RESET}`)
    console.log()
  }

  process.exit(exitCode)
}

testModuleAPIs().catch((err) => {
  console.error(`${RED}${BOLD}Fatal error:${RESET}`, err)
  process.exit(1)
})
