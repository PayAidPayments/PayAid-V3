/**
 * Route Verification Script
 * Checks if all routes referenced in sidebar and implementation checklist exist
 */

import { existsSync } from 'fs'
import { join } from 'path'

const appDir = join(process.cwd(), 'app')
const apiDir = join(process.cwd(), 'app', 'api')

// Routes from sidebar and implementation checklist
const routesToCheck = {
  // Marketplace
  marketplace: [
    '/dashboard/marketplace/page.tsx',
    '/dashboard/marketplace/[id]/install/page.tsx',
    '/dashboard/marketplace/[id]/reviews/page.tsx',
    '/dashboard/marketplace/tally-sync/page.tsx',
  ],
  
  // Developer Portal
  developer: [
    '/dashboard/developer/portal/page.tsx',
    '/dashboard/developer/portal/submit/page.tsx',
    '/dashboard/developer/api-keys/page.tsx',
    '/dashboard/developer/webhooks/page.tsx',
    '/dashboard/developer/api-explorer/page.tsx',
    '/dashboard/developer/analytics/page.tsx',
    '/dashboard/developer/ai-governance/page.tsx',
    '/dashboard/developer/ai-governance/audit-trail/page.tsx',
    '/dashboard/developer/docs/page.tsx',
  ],
  
  // Analytics
  analytics: [
    '/dashboard/analytics/ai-query/page.tsx',
    '/dashboard/analytics/scenario/page.tsx',
  ],
  
  // API Routes
  api: [
    '/api/marketplace/apps/route.ts',
    '/api/marketplace/apps/install/route.ts',
    '/api/marketplace/apps/[id]/reviews/route.ts',
    '/api/developer/portal/stats/route.ts',
    '/api/developer/portal/apps/submit/route.ts',
    '/api/ai/governance/audit-trail/route.ts',
    '/api/ai/workflows/generate/route.ts',
    '/api/ai/analytics/nl-query/route.ts',
    '/api/ai/analytics/scenario/route.ts',
    '/api/integrations/tally/sync/route.ts',
    '/api/integrations/razorpay/payment-link/route.ts',
    '/api/monitoring/api-usage/route.ts',
  ],
}

function checkRoute(route: string): boolean {
  const fullPath = join(process.cwd(), route)
  return existsSync(fullPath)
}

console.log('🔍 Verifying Routes...\n')

let totalRoutes = 0
let missingRoutes: string[] = []
let existingRoutes: string[] = []

for (const [category, routes] of Object.entries(routesToCheck)) {
  console.log(`\n📁 ${category.toUpperCase()}`)
  console.log('─'.repeat(50))
  
  for (const route of routes) {
    totalRoutes++
    const exists = checkRoute(route)
    
    if (exists) {
      console.log(`✅ ${route}`)
      existingRoutes.push(route)
    } else {
      console.log(`❌ ${route} - MISSING`)
      missingRoutes.push(route)
    }
  }
}

console.log('\n' + '='.repeat(50))
console.log(`\n📊 Summary:`)
console.log(`   Total Routes: ${totalRoutes}`)
console.log(`   ✅ Existing: ${existingRoutes.length}`)
console.log(`   ❌ Missing: ${missingRoutes.length}`)

if (missingRoutes.length > 0) {
  console.log(`\n⚠️  Missing Routes:`)
  missingRoutes.forEach(route => console.log(`   - ${route}`))
  process.exit(1)
} else {
  console.log(`\n✅ All routes verified!`)
  process.exit(0)
}
