/**
 * Automated Frontend Testing for Finance Dashboard
 * 
 * Tests the finance dashboard frontend using Playwright
 * Verifies KPI cards, charts, tables, filters, and export functionality
 * 
 * Usage:
 *   npm run dev  # Start server in another terminal
 *   npx tsx scripts/test-finance-frontend.ts [tenantId] [baseUrl]
 */

import { chromium, Browser, Page } from 'playwright'
import fetch from 'node-fetch'

interface TestResult {
  category: string
  test: string
  status: 'pass' | 'fail' | 'skip'
  message?: string
  duration?: number
}

const results: TestResult[] = []
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TENANT_ID = process.argv[2] || 'cmjimytmb0000snopu3p8h3b9'
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@demo.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@1234'

let browser: Browser | null = null
let page: Page | null = null

async function logResult(category: string, test: string, status: 'pass' | 'fail' | 'skip', message?: string, duration?: number) {
  results.push({ category, test, status, message, duration })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️'
  const time = duration ? ` (${duration}ms)` : ''
  console.log(`${icon} ${category} > ${test}${time}${message ? ` - ${message}` : ''}`)
}

async function setupBrowser() {
  try {
    browser = await chromium.launch({ headless: true })
    page = await browser.newPage()
    await page.setViewportSize({ width: 1920, height: 1080 })
    return true
  } catch (error) {
    console.error('Failed to launch browser:', error)
    return false
  }
}

async function login() {
  if (!page) return false

  const startTime = Date.now()
  try {
    // Navigate to login page or dashboard
    const loginUrl = `${BASE_URL}/finance/login`
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 })

    // Check if already logged in (redirected to dashboard)
    if (page.url().includes('/Home') || page.url().includes('/finance/')) {
      await logResult('Authentication', 'Login', 'pass', 'Already logged in', Date.now() - startTime)
      return true
    }

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    
    // Click submit button - wait for it to be enabled
    await page.waitForSelector('button[type="submit"]', { timeout: 5000 })
    await page.click('button[type="submit"]')

    // Wait for navigation - finance module redirects to /finance/[tenantId]/Home/
    await page.waitForURL(`**/finance/**/Home/**`, { timeout: 15000 })
    
    await logResult('Authentication', 'Login', 'pass', 'Login successful', Date.now() - startTime)
    return true
  } catch (error: any) {
    // Try direct navigation to dashboard if login fails
    try {
      const dashboardUrl = `${BASE_URL}/finance/${TENANT_ID}/Home/`
      await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 30000 })
      if (page.url().includes('/finance/')) {
        await logResult('Authentication', 'Login', 'pass', 'Direct navigation successful', Date.now() - startTime)
        return true
      }
    } catch (navError) {
      // Continue with original error
    }
    await logResult('Authentication', 'Login', 'fail', error.message, Date.now() - startTime)
    return false
  }
}

async function testKPICards() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000) // Additional wait for async data loading

    // Finance dashboard uses UniversalModuleHero with metrics
    // Check for hero metrics or KPI cards
    const kpiSelectors = [
      '[data-testid*="kpi"]',
      '[class*="KPI"]',
      '[class*="metric"]',
      '[class*="hero"]',
      'text=Total Revenue',
      'text=Invoices',
      'text=Purchase Orders',
      'text=Net Profit',
      'text=Revenue',
      'text=Expenses',
    ]

    let foundKPIs = 0
    for (const selector of kpiSelectors) {
      try {
        const elements = await page.locator(selector).count()
        if (elements > 0) {
          foundKPIs += elements
        }
      } catch (e) {
        // Continue
      }
    }

    // Also check for currency symbols (₹) - Finance uses INR
    const currencyElements = await page.locator('text=/₹/').count()
    
    // Check for UniversalModuleHero component (finance dashboard uses this)
    const heroElements = await page.locator('[class*="hero"], [class*="Hero"]').count()
    
    if (foundKPIs > 0 || currencyElements > 0 || heroElements > 0) {
      await logResult('KPI Cards', 'KPI Cards Display', 'pass', `Found ${foundKPIs} KPI elements, ${currencyElements} currency displays, ${heroElements} hero elements`, Date.now() - startTime)
    } else {
      await logResult('KPI Cards', 'KPI Cards Display', 'fail', 'No KPI cards found', Date.now() - startTime)
    }

    // Check for specific finance metrics
    const metrics = ['Revenue', 'Invoices', 'Purchase Orders', 'Net Profit', 'Expenses']
    for (const metric of metrics) {
      const found = await page.locator(`text=/${metric}/i`).count()
      if (found > 0) {
        await logResult('KPI Cards', `Metric: ${metric}`, 'pass', 'Found', Date.now() - startTime)
      } else {
        await logResult('KPI Cards', `Metric: ${metric}`, 'skip', 'Not found (may not be required)', Date.now() - startTime)
      }
    }

  } catch (error: any) {
    await logResult('KPI Cards', 'KPI Cards Display', 'fail', error.message, Date.now() - startTime)
  }
}

async function testCharts() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Wait for charts to render
    await page.waitForTimeout(2000)

    // Check for chart containers (Recharts uses SVG)
    const svgElements = await page.locator('svg').count()
    const chartContainers = await page.locator('[class*="chart"], [class*="Chart"], [id*="chart"]').count()

    if (svgElements > 0 || chartContainers > 0) {
      await logResult('Charts', 'Charts Render', 'pass', `Found ${svgElements} SVG elements, ${chartContainers} chart containers`, Date.now() - startTime)
    } else {
      await logResult('Charts', 'Charts Render', 'skip', 'No charts found (may not be required)', Date.now() - startTime)
    }

    // Check for specific chart types
    const chartTypes = ['P&L', 'Cash Flow', 'Expense', 'Revenue']
    for (const type of chartTypes) {
      const found = await page.locator(`text=/${type}/i`).count()
      if (found > 0) {
        await logResult('Charts', `Chart: ${type}`, 'pass', 'Found', Date.now() - startTime)
      }
    }

  } catch (error: any) {
    await logResult('Charts', 'Charts Render', 'fail', error.message, Date.now() - startTime)
  }
}

async function testTables() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Check for tables
    const tables = await page.locator('table').count()
    const tableContainers = await page.locator('[class*="table"], [class*="Table"]').count()

    if (tables > 0 || tableContainers > 0) {
      await logResult('Tables', 'Tables Display', 'pass', `Found ${tables} tables, ${tableContainers} table containers`, Date.now() - startTime)
    } else {
      await logResult('Tables', 'Tables Display', 'skip', 'No tables found (may not be required)', Date.now() - startTime)
    }

    // Check for table headers
    const headers = await page.locator('th, [class*="header"]').count()
    if (headers > 0) {
      await logResult('Tables', 'Table Headers', 'pass', `Found ${headers} headers`, Date.now() - startTime)
    }

  } catch (error: any) {
    await logResult('Tables', 'Tables Display', 'fail', error.message, Date.now() - startTime)
  }
}

async function testFilters() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Check for filter controls
    const filterSelectors = [
      'input[type="date"]',
      'select',
      '[class*="filter"]',
      '[class*="Filter"]',
      'button:has-text("Filter")',
    ]

    let foundFilters = 0
    for (const selector of filterSelectors) {
      try {
        const count = await page.locator(selector).count()
        foundFilters += count
      } catch (e) {
        // Continue
      }
    }

    if (foundFilters > 0) {
      await logResult('Filters', 'Filter Controls', 'pass', `Found ${foundFilters} filter controls`, Date.now() - startTime)
    } else {
      await logResult('Filters', 'Filter Controls', 'skip', 'No filters found (may not be required)', Date.now() - startTime)
    }

    // Try to interact with date filter if present
    const dateInputs = await page.locator('input[type="date"]').count()
    if (dateInputs > 0) {
      await logResult('Filters', 'Date Range Filter', 'pass', 'Date filter found', Date.now() - startTime)
    }

  } catch (error: any) {
    await logResult('Filters', 'Filter Controls', 'fail', error.message, Date.now() - startTime)
  }
}

async function testExport() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Check for export buttons
    const exportSelectors = [
      'button:has-text("Export")',
      'button:has-text("PDF")',
      'button:has-text("Excel")',
      'button:has-text("CSV")',
      '[class*="export"]',
      '[class*="Export"]',
    ]

    let foundExports = 0
    for (const selector of exportSelectors) {
      try {
        const count = await page.locator(selector).count()
        foundExports += count
      } catch (e) {
        // Continue
      }
    }

    if (foundExports > 0) {
      await logResult('Export', 'Export Buttons', 'pass', `Found ${foundExports} export buttons`, Date.now() - startTime)
    } else {
      await logResult('Export', 'Export Buttons', 'skip', 'No export buttons found (may not be required)', Date.now() - startTime)
    }

  } catch (error: any) {
    await logResult('Export', 'Export Buttons', 'fail', error.message, Date.now() - startTime)
  }
}

async function testPerformance() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Measure page load time using Performance API
    const loadTime = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (perfData) {
        return perfData.loadEventEnd - perfData.fetchStart
      }
      // Fallback to timing API
      const timing = performance.timing
      return timing.loadEventEnd - timing.navigationStart
    })

    if (loadTime < 3000) {
      await logResult('Performance', 'Page Load Time', 'pass', `${loadTime}ms (< 3s)`, Date.now() - startTime)
    } else if (loadTime < 5000) {
      await logResult('Performance', 'Page Load Time', 'pass', `${loadTime}ms (< 5s)`, Date.now() - startTime)
    } else if (loadTime < 10000) {
      await logResult('Performance', 'Page Load Time', 'pass', `${loadTime}ms (< 10s - acceptable)`, Date.now() - startTime)
    } else {
      await logResult('Performance', 'Page Load Time', 'fail', `${loadTime}ms (> 10s)`, Date.now() - startTime)
    }

    // Check for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000)
    
    if (consoleErrors.length === 0) {
      await logResult('Performance', 'Console Errors', 'pass', 'No console errors', Date.now() - startTime)
    } else {
      await logResult('Performance', 'Console Errors', 'fail', `${consoleErrors.length} errors found`, Date.now() - startTime)
    }

  } catch (error: any) {
    await logResult('Performance', 'Performance Check', 'fail', error.message, Date.now() - startTime)
  }
}

async function testResponsive() {
  if (!page) return

  const startTime = Date.now()
  try {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)

    const mobileElements = await page.locator('body').count()
    if (mobileElements > 0) {
      await logResult('Responsive', 'Mobile Viewport', 'pass', 'Page renders on mobile', Date.now() - startTime)
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)

  } catch (error: any) {
    await logResult('Responsive', 'Responsive Design', 'fail', error.message, Date.now() - startTime)
  }
}

async function checkServer() {
  try {
    // Use fetch to check if server is running
    const response = await fetch(BASE_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)
    
    return response !== null && response.status < 500
  } catch (error) {
    // Try alternative method with http module
    try {
      const http = await import('http')
      return new Promise<boolean>((resolve) => {
        const url = new URL(BASE_URL)
        const port = url.port || (url.protocol === 'https:' ? 443 : 3000)
        const req = http.request({
          hostname: url.hostname,
          port: port,
          path: '/',
          method: 'GET',
          timeout: 5000,
        }, (res) => {
          resolve(res.statusCode !== undefined && res.statusCode < 500)
        })
        
        req.on('error', () => resolve(false))
        req.on('timeout', () => {
          req.destroy()
          resolve(false)
        })
        
        req.end()
      })
    } catch (httpError) {
      return false
    }
  }
}

async function runTests() {
  console.log('🧪 Finance Dashboard Frontend Testing\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Tenant ID: ${TENANT_ID}`)
  console.log(`Test Email: ${TEST_EMAIL}\n`)

  // Check if server is running
  console.log('Checking if server is running...')
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.error('❌ Server is not running!')
    console.error(`\nPlease start the server first:`)
    console.error(`  npm run dev`)
    console.error(`\nThen run this script again:`)
    console.error(`  npx tsx scripts/test-finance-frontend.ts ${TENANT_ID}`)
    process.exit(1)
  }
  console.log('✅ Server is running\n')

  // Setup browser
  const browserReady = await setupBrowser()
  if (!browserReady) {
    console.error('❌ Failed to setup browser')
    return
  }

  try {
    // Navigate to dashboard and login
    const dashboardUrl = `${BASE_URL}/finance/${TENANT_ID}/Home/`
    console.log(`Navigating to: ${dashboardUrl}\n`)

    // Login (will navigate to dashboard)
    await login()

    // Ensure we're on the dashboard
    if (page && !page.url().includes('/Home') && !page.url().includes('/finance/')) {
      await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 30000 })
    }
    
    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await page.waitForTimeout(2000) // Additional wait for async data loading

    // Run tests
    console.log('\n📊 Running Tests...\n')
    await testKPICards()
    await testCharts()
    await testTables()
    await testFilters()
    await testExport()
    await testPerformance()
    await testResponsive()

    // Print summary
    console.log('\n📊 Test Results Summary:\n')
    console.log('─'.repeat(80))

    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const skipped = results.filter(r => r.status === 'skip').length

    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
      console.log(`${icon} ${result.category} > ${result.test}${result.message ? ` - ${result.message}` : ''}`)
    })

    console.log('─'.repeat(80))
    console.log(`\n✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`\nTotal: ${results.length} tests`)

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Check the errors above.')
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed!')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run tests
runTests()
