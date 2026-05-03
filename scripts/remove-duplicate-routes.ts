/**
 * Remove Duplicate Routes Script
 * 
 * Identifies and optionally removes routes from monolith that have been migrated to modules
 * 
 * Usage: 
 *   npx tsx scripts/remove-duplicate-routes.ts --dry-run  # Preview only
 *   npx tsx scripts/remove-duplicate-routes.ts --remove   # Actually remove
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
  { source: 'app/api/contacts', target: 'crm-module/app/api/contacts', module: 'crm' },
  { source: 'app/api/deals', target: 'crm-module/app/api/deals', module: 'crm' },
  { source: 'app/api/products', target: 'crm-module/app/api/products', module: 'crm' },
  { source: 'app/api/orders', target: 'crm-module/app/api/orders', module: 'crm' },
  { source: 'app/api/tasks', target: 'crm-module/app/api/tasks', module: 'crm' },
  { source: 'app/api/leads', target: 'crm-module/app/api/leads', module: 'crm' },
  { source: 'app/api/marketing', target: 'crm-module/app/api/marketing', module: 'crm' },
  { source: 'app/api/email-templates', target: 'crm-module/app/api/email-templates', module: 'crm' },
  { source: 'app/api/social-media', target: 'crm-module/app/api/social-media', module: 'crm' },
  { source: 'app/api/landing-pages', target: 'crm-module/app/api/landing-pages', module: 'crm' },
  { source: 'app/api/checkout-pages', target: 'crm-module/app/api/checkout-pages', module: 'crm' },
  { source: 'app/api/events', target: 'crm-module/app/api/events', module: 'crm' },
  { source: 'app/api/logos', target: 'crm-module/app/api/logos', module: 'crm' },
  { source: 'app/api/websites', target: 'crm-module/app/api/websites', module: 'crm' },
  { source: 'app/api/chat', target: 'crm-module/app/api/chat', module: 'crm' },
  { source: 'app/api/chatbots', target: 'crm-module/app/api/chatbots', module: 'crm' },
  { source: 'app/api/interactions', target: 'crm-module/app/api/interactions', module: 'crm' },
  { source: 'app/api/sales-reps', target: 'crm-module/app/api/sales-reps', module: 'crm' },
  { source: 'app/api/sequences', target: 'crm-module/app/api/sequences', module: 'crm' },
  { source: 'app/api/nurture', target: 'crm-module/app/api/nurture', module: 'crm' },
  
  // Invoicing Module
  { source: 'app/api/invoices', target: 'invoicing-module/app/api/invoices', module: 'finance' },
  
  // Accounting Module
  { source: 'app/api/accounting', target: 'accounting-module/app/api/accounting', module: 'accounting' },
  { source: 'app/api/gst', target: 'accounting-module/app/api/gst', module: 'accounting' },
  
  // HR Module
  { source: 'app/api/hr', target: 'hr-module/app/api/hr', module: 'hr' },
  
  // WhatsApp Module
  { source: 'app/api/whatsapp', target: 'whatsapp-module/app/api/whatsapp', module: 'whatsapp' },
  
  // Analytics Module
  { source: 'app/api/analytics', target: 'analytics-module/app/api/analytics', module: 'analytics' },
  { source: 'app/api/reports', target: 'analytics-module/app/api/reports', module: 'analytics' },
  { source: 'app/api/dashboards', target: 'analytics-module/app/api/dashboards', module: 'analytics' },
  
  // AI Studio Module
  { source: 'app/api/ai', target: 'ai-studio-module/app/api/ai', module: 'ai-studio' },
  { source: 'app/api/calls', target: 'ai-studio-module/app/api/calls', module: 'ai-studio' },
  
  // Communication Module
  { source: 'app/api/email', target: 'communication-module/app/api/email', module: 'communication' },
  
  // Core Module
  { source: 'app/api/billing', target: 'core-module/app/api/billing', module: 'core' },
  { source: 'app/api/admin', target: 'core-module/app/api/admin', module: 'core' },
  { source: 'app/api/settings', target: 'core-module/app/api/settings', module: 'core' },
  { source: 'app/api/modules', target: 'core-module/app/api/modules', module: 'core' },
  { source: 'app/api/bundles', target: 'core-module/app/api/bundles', module: 'core' },
  { source: 'app/api/user/licenses', target: 'core-module/app/api/user/licenses', module: 'core' },
]

function removeDirectory(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) {
    return false
  }

  try {
    fs.rmSync(dirPath, { recursive: true, force: true })
    return true
  } catch (error) {
    console.error(`Error removing ${dirPath}:`, error)
    return false
  }
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  
  let count = 0
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      count += countFiles(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      count++
    }
  }

  return count
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const remove = args.includes('--remove')

  if (!dryRun && !remove) {
    console.log('Usage:')
    console.log('  npx tsx scripts/remove-duplicate-routes.ts --dry-run  # Preview only')
    console.log('  npx tsx scripts/remove-duplicate-routes.ts --remove   # Actually remove')
    process.exit(1)
  }

  console.log(dryRun ? '🔍 DRY RUN - Preview only\n' : '🗑️  REMOVING duplicate routes from monolith...\n')

  let totalFiles = 0
  let removedCount = 0
  const errors: string[] = []

  for (const mapping of ROUTE_MAPPINGS) {
    const sourcePath = path.join(process.cwd(), mapping.source)
    const targetPath = path.join(process.cwd(), mapping.target)

    if (!fs.existsSync(sourcePath)) {
      continue
    }

    if (!fs.existsSync(targetPath)) {
      console.warn(`⚠️  Target does not exist: ${mapping.target}`)
      continue
    }

    const fileCount = countFiles(sourcePath)
    totalFiles += fileCount

    if (dryRun) {
      console.log(`📋 Would remove: ${mapping.source} (${fileCount} files) → migrated to ${mapping.target}`)
    } else if (remove) {
      if (removeDirectory(sourcePath)) {
        console.log(`✅ Removed: ${mapping.source} (${fileCount} files)`)
        removedCount++
      } else {
        errors.push(`Failed to remove ${mapping.source}`)
      }
    }
  }

  console.log(`\n📊 Summary:`)
  if (dryRun) {
    console.log(`   📋 Would remove: ${totalFiles} files from ${ROUTE_MAPPINGS.length} routes`)
    console.log(`\n⚠️  This is a dry run. Use --remove to actually delete files.`)
  } else {
    console.log(`   ✅ Removed: ${removedCount} routes`)
    console.log(`   📁 Total files: ${totalFiles}`)
    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`)
      errors.forEach(err => console.error(`      - ${err}`))
    }
  }
}

main().catch(console.error)

