/**
 * Sync Module Routes to Monolith
 * 
 * Copies routes from module directories back to app/api/ so they remain accessible
 * This is temporary until separate deployments are set up
 * 
 * Usage: npx tsx scripts/sync-module-routes-to-monolith.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface RouteMapping {
  source: string
  target: string
  module: string
}

const ROUTE_MAPPINGS: RouteMapping[] = [
  // CRM Module
  { source: 'crm-module/app/api/contacts', target: 'app/api/contacts', module: 'crm' },
  { source: 'crm-module/app/api/deals', target: 'app/api/deals', module: 'crm' },
  { source: 'crm-module/app/api/products', target: 'app/api/products', module: 'crm' },
  { source: 'crm-module/app/api/orders', target: 'app/api/orders', module: 'crm' },
  { source: 'crm-module/app/api/tasks', target: 'app/api/tasks', module: 'crm' },
  { source: 'crm-module/app/api/leads', target: 'app/api/leads', module: 'crm' },
  { source: 'crm-module/app/api/marketing', target: 'app/api/marketing', module: 'crm' },
  { source: 'crm-module/app/api/email-templates', target: 'app/api/email-templates', module: 'crm' },
  { source: 'crm-module/app/api/social-media', target: 'app/api/social-media', module: 'crm' },
  { source: 'crm-module/app/api/landing-pages', target: 'app/api/landing-pages', module: 'crm' },
  { source: 'crm-module/app/api/checkout-pages', target: 'app/api/checkout-pages', module: 'crm' },
  { source: 'crm-module/app/api/events', target: 'app/api/events', module: 'crm' },
  { source: 'crm-module/app/api/logos', target: 'app/api/logos', module: 'crm' },
  { source: 'crm-module/app/api/websites', target: 'app/api/websites', module: 'crm' },
  { source: 'crm-module/app/api/chat', target: 'app/api/chat', module: 'crm' },
  { source: 'crm-module/app/api/chatbots', target: 'app/api/chatbots', module: 'crm' },
  { source: 'crm-module/app/api/interactions', target: 'app/api/interactions', module: 'crm' },
  { source: 'crm-module/app/api/sales-reps', target: 'app/api/sales-reps', module: 'crm' },
  { source: 'crm-module/app/api/sequences', target: 'app/api/sequences', module: 'crm' },
  { source: 'crm-module/app/api/nurture', target: 'app/api/nurture', module: 'crm' },
  
  // Invoicing Module
  { source: 'invoicing-module/app/api/invoices', target: 'app/api/invoices', module: 'finance' },
  
  // Accounting Module
  { source: 'accounting-module/app/api/accounting', target: 'app/api/accounting', module: 'accounting' },
  { source: 'accounting-module/app/api/gst', target: 'app/api/gst', module: 'accounting' },
  
  // HR Module
  { source: 'hr-module/app/api/hr', target: 'app/api/hr', module: 'hr' },
  
  // WhatsApp Module
  { source: 'whatsapp-module/app/api/whatsapp', target: 'app/api/whatsapp', module: 'whatsapp' },
  
  // Analytics Module
  { source: 'analytics-module/app/api/analytics', target: 'app/api/analytics', module: 'analytics' },
  { source: 'analytics-module/app/api/reports', target: 'app/api/reports', module: 'analytics' },
  { source: 'analytics-module/app/api/dashboards', target: 'app/api/dashboards', module: 'analytics' },
  
  // AI Studio Module
  { source: 'ai-studio-module/app/api/ai', target: 'app/api/ai', module: 'ai-studio' },
  { source: 'ai-studio-module/app/api/calls', target: 'app/api/calls', module: 'ai-studio' },
  
  // Communication Module
  { source: 'communication-module/app/api/email', target: 'app/api/email', module: 'communication' },
  
  // Core Module
  { source: 'core-module/app/api/billing', target: 'app/api/billing', module: 'core' },
  { source: 'core-module/app/api/admin', target: 'app/api/admin', module: 'core' },
  { source: 'core-module/app/api/settings', target: 'app/api/settings', module: 'core' },
  { source: 'core-module/app/api/modules', target: 'app/api/modules', module: 'core' },
  { source: 'core-module/app/api/bundles', target: 'app/api/bundles', module: 'core' },
  { source: 'core-module/app/api/user/licenses', target: 'app/api/user/licenses', module: 'core' },
]

function copyDirectory(source: string, target: string): number {
  if (!fs.existsSync(source)) {
    return 0
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  let fileCount = 0
  const files = fs.readdirSync(source)

  for (const file of files) {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)

    if (fs.statSync(sourcePath).isDirectory()) {
      fileCount += copyDirectory(sourcePath, targetPath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fs.copyFileSync(sourcePath, targetPath)
      fileCount++
    }
  }

  return fileCount
}

async function main() {
  console.log('🔄 Syncing module routes to monolith...\n')
  console.log('⚠️  Note: This copies routes back so they remain accessible until separate deployments\n')

  let totalFiles = 0
  let successCount = 0
  let failCount = 0
  const failures: string[] = []

  for (const mapping of ROUTE_MAPPINGS) {
    const sourcePath = path.join(process.cwd(), mapping.source)
    const targetPath = path.join(process.cwd(), mapping.target)

    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Source does not exist: ${mapping.source}`)
      failCount++
      failures.push(mapping.source)
      continue
    }

    try {
      const fileCount = copyDirectory(sourcePath, targetPath)
      if (fileCount > 0) {
        console.log(`✅ ${mapping.target} (${fileCount} files)`)
        totalFiles += fileCount
        successCount++
      } else {
        console.warn(`⚠️  No files copied: ${mapping.source}`)
        failCount++
        failures.push(mapping.source)
      }
    } catch (error: any) {
      console.error(`❌ Error copying ${mapping.source}:`, error.message)
      failCount++
      failures.push(mapping.source)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Synced: ${successCount} routes`)
  console.log(`   ❌ Failed: ${failCount} routes`)
  console.log(`   📁 Total files: ${totalFiles}`)

  if (failures.length > 0) {
    console.log(`\n❌ Failed routes:`)
    failures.forEach(f => console.log(`   - ${f}`))
  }

  console.log(`\n✅ Route sync complete!`)
  console.log(`\n💡 Routes are now accessible from:`)
  console.log(`   - Module directories (source of truth)`)
  console.log(`   - app/api/ (copied for Next.js to serve)`)
  console.log(`\n⚠️  Remember: When editing routes, edit in module directories, then re-run this script`)
}

main().catch(console.error)

