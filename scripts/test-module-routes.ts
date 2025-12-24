/**
 * Test Module Routes
 * 
 * Verifies that migrated routes are accessible in their module directories
 * 
 * Usage: npx tsx scripts/test-module-routes.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface ModuleRoute {
  module: string
  route: string
  path: string
  exists: boolean
}

const MODULE_ROUTES: ModuleRoute[] = [
  // CRM Module
  { module: 'crm-module', route: '/api/contacts', path: 'crm-module/app/api/contacts', exists: false },
  { module: 'crm-module', route: '/api/deals', path: 'crm-module/app/api/deals', exists: false },
  { module: 'crm-module', route: '/api/products', path: 'crm-module/app/api/products', exists: false },
  { module: 'crm-module', route: '/api/orders', path: 'crm-module/app/api/orders', exists: false },
  { module: 'crm-module', route: '/api/tasks', path: 'crm-module/app/api/tasks', exists: false },
  { module: 'crm-module', route: '/api/leads', path: 'crm-module/app/api/leads', exists: false },
  { module: 'crm-module', route: '/api/marketing', path: 'crm-module/app/api/marketing', exists: false },
  
  // Invoicing Module
  { module: 'invoicing-module', route: '/api/invoices', path: 'invoicing-module/app/api/invoices', exists: false },
  
  // Accounting Module
  { module: 'accounting-module', route: '/api/accounting', path: 'accounting-module/app/api/accounting', exists: false },
  { module: 'accounting-module', route: '/api/gst', path: 'accounting-module/app/api/gst', exists: false },
  
  // HR Module
  { module: 'hr-module', route: '/api/hr/employees', path: 'hr-module/app/api/hr/employees', exists: false },
  
  // WhatsApp Module
  { module: 'whatsapp-module', route: '/api/whatsapp/accounts', path: 'whatsapp-module/app/api/whatsapp/accounts', exists: false },
  
  // Analytics Module
  { module: 'analytics-module', route: '/api/analytics', path: 'analytics-module/app/api/analytics', exists: false },
  
  // AI Studio Module
  { module: 'ai-studio-module', route: '/api/ai/chat', path: 'ai-studio-module/app/api/ai/chat/route.ts', exists: false },
  { module: 'ai-studio-module', route: '/api/calls', path: 'ai-studio-module/app/api/calls/route.ts', exists: false },
  
  // Communication Module
  { module: 'communication-module', route: '/api/email/accounts', path: 'communication-module/app/api/email/accounts/route.ts', exists: false },
  
  // Core Module
  { module: 'core-module', route: '/api/billing/create-order', path: 'core-module/app/api/billing/create-order/route.ts', exists: false },
  { module: 'core-module', route: '/api/admin/tenants', path: 'core-module/app/api/admin/tenants/route.ts', exists: false },
]

function checkRoute(route: ModuleRoute): boolean {
  const fullPath = path.join(process.cwd(), route.path)
  // Check if directory exists (routes can be directories or files)
  const exists = fs.existsSync(fullPath)
  route.exists = exists
  return exists
}

function checkMonolithRoute(route: string): boolean {
  const routePath = route.replace('/api/', '')
  const monolithPath = path.join(process.cwd(), 'app/api', routePath)
  return fs.existsSync(monolithPath)
}

async function main() {
  console.log('🔍 Testing Module Routes...\n')

  let passed = 0
  let failed = 0
  const failures: string[] = []

  for (const route of MODULE_ROUTES) {
    const exists = checkRoute(route)
    const inMonolith = checkMonolithRoute(route.route)

    // Current architecture: Routes exist in BOTH module directories AND monolith (synced)
    // Module directories = Source of truth
    // Monolith = Synced copy (for Next.js to serve)
    if (exists && inMonolith) {
      console.log(`✅ ${route.module}: ${route.route} - Migrated & synced correctly`)
      passed++
    } else if (!exists) {
      console.log(`❌ ${route.module}: ${route.route} - Missing in module`)
      failed++
      failures.push(`${route.module}: ${route.route} - Missing in module`)
    } else if (!inMonolith) {
      console.log(`⚠️  ${route.module}: ${route.route} - Not synced to monolith (run sync script)`)
      failed++
      failures.push(`${route.module}: ${route.route} - Not synced`)
    }
  }

  console.log(`\n📊 Test Summary:`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)

  if (failures.length > 0) {
    console.log(`\n❌ Failures:`)
    failures.forEach(f => console.log(`   - ${f}`))
  }

  // Check remaining routes in monolith
  console.log(`\n📋 Routes in monolith:`)
  const remainingDirs = fs.readdirSync(path.join(process.cwd(), 'app/api'))
    .filter(dir => {
      const dirPath = path.join(process.cwd(), 'app/api', dir)
      return fs.statSync(dirPath).isDirectory()
    })
    .sort()

  const coreRoutes = ['auth', 'oauth', 'payments', 'alerts', 'cron', 'dashboard', 'industries', 'upload', 'subscriptions']
  const syncedRoutes = MODULE_ROUTES.map(m => m.route.replace('/api/', '').split('/')[0])
  
  remainingDirs.forEach(dir => {
    const isCore = coreRoutes.includes(dir)
    const isSynced = syncedRoutes.includes(dir)
    let status = '⚠️'
    if (isCore) status = '✅'
    else if (isSynced) status = '🔄'
    console.log(`   ${status} ${dir} ${isCore ? '(core)' : isSynced ? '(synced from module)' : '(unknown)'}`)
  })

  console.log(`\n✅ Module route testing complete!`)
  
  if (failed === 0) {
    console.log(`\n🎉 All routes migrated successfully!`)
  } else {
    console.log(`\n⚠️  Some routes need attention.`)
    process.exit(1)
  }
}

main().catch(console.error)

