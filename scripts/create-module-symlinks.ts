/**
 * Create Module Route Symlinks
 * 
 * Creates symlinks from app/api to module directories so routes remain accessible
 * This is a temporary solution until separate deployments are set up
 * 
 * Usage: npx tsx scripts/create-module-symlinks.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface RouteMapping {
  source: string
  target: string
  module: string
}

const ROUTE_MAPPINGS: RouteMapping[] = [
  // CRM Module
  { source: 'app/api/contacts', target: '../crm-module/app/api/contacts', module: 'crm' },
  { source: 'app/api/deals', target: '../crm-module/app/api/deals', module: 'crm' },
  { source: 'app/api/products', target: '../crm-module/app/api/products', module: 'crm' },
  { source: 'app/api/orders', target: '../crm-module/app/api/orders', module: 'crm' },
  { source: 'app/api/tasks', target: '../crm-module/app/api/tasks', module: 'crm' },
  { source: 'app/api/leads', target: '../crm-module/app/api/leads', module: 'crm' },
  { source: 'app/api/marketing', target: '../crm-module/app/api/marketing', module: 'crm' },
  { source: 'app/api/email-templates', target: '../crm-module/app/api/email-templates', module: 'crm' },
  { source: 'app/api/social-media', target: '../crm-module/app/api/social-media', module: 'crm' },
  { source: 'app/api/landing-pages', target: '../crm-module/app/api/landing-pages', module: 'crm' },
  { source: 'app/api/checkout-pages', target: '../crm-module/app/api/checkout-pages', module: 'crm' },
  { source: 'app/api/events', target: '../crm-module/app/api/events', module: 'crm' },
  { source: 'app/api/logos', target: '../crm-module/app/api/logos', module: 'crm' },
  { source: 'app/api/websites', target: '../crm-module/app/api/websites', module: 'crm' },
  { source: 'app/api/chat', target: '../crm-module/app/api/chat', module: 'crm' },
  { source: 'app/api/chatbots', target: '../crm-module/app/api/chatbots', module: 'crm' },
  { source: 'app/api/interactions', target: '../crm-module/app/api/interactions', module: 'crm' },
  { source: 'app/api/sales-reps', target: '../crm-module/app/api/sales-reps', module: 'crm' },
  { source: 'app/api/sequences', target: '../crm-module/app/api/sequences', module: 'crm' },
  { source: 'app/api/nurture', target: '../crm-module/app/api/nurture', module: 'crm' },
  
  // Invoicing Module
  { source: 'app/api/invoices', target: '../invoicing-module/app/api/invoices', module: 'finance' },
  
  // Accounting Module
  { source: 'app/api/accounting', target: '../accounting-module/app/api/accounting', module: 'accounting' },
  { source: 'app/api/gst', target: '../accounting-module/app/api/gst', module: 'accounting' },
  
  // HR Module
  { source: 'app/api/hr', target: '../hr-module/app/api/hr', module: 'hr' },
  
  // WhatsApp Module
  { source: 'app/api/whatsapp', target: '../whatsapp-module/app/api/whatsapp', module: 'whatsapp' },
  
  // Analytics Module
  { source: 'app/api/analytics', target: '../analytics-module/app/api/analytics', module: 'analytics' },
  { source: 'app/api/reports', target: '../analytics-module/app/api/reports', module: 'analytics' },
  { source: 'app/api/dashboards', target: '../analytics-module/app/api/dashboards', module: 'analytics' },
  
  // AI Studio Module
  { source: 'app/api/ai', target: '../ai-studio-module/app/api/ai', module: 'ai-studio' },
  { source: 'app/api/calls', target: '../ai-studio-module/app/api/calls', module: 'ai-studio' },
  
  // Communication Module
  { source: 'app/api/email', target: '../communication-module/app/api/email', module: 'communication' },
  
  // Core Module
  { source: 'app/api/billing', target: '../core-module/app/api/billing', module: 'core' },
  { source: 'app/api/admin', target: '../core-module/app/api/admin', module: 'core' },
  { source: 'app/api/settings', target: '../core-module/app/api/settings', module: 'core' },
  { source: 'app/api/modules', target: '../core-module/app/api/modules', module: 'core' },
  { source: 'app/api/bundles', target: '../core-module/app/api/bundles', module: 'core' },
  { source: 'app/api/user/licenses', target: '../core-module/app/api/user/licenses', module: 'core' },
]

function createSymlink(source: string, target: string): boolean {
  const sourcePath = path.join(process.cwd(), source)
  // Target is relative from source, resolve it properly
  const sourceDir = path.dirname(sourcePath)
  const absoluteTarget = path.resolve(sourceDir, target)

  // Check if source already exists
  if (fs.existsSync(sourcePath)) {
    try {
      const stats = fs.lstatSync(sourcePath)
      if (stats.isSymbolicLink()) {
        // Already a symlink, check if it points to correct target
        const currentTarget = fs.readlinkSync(sourcePath)
        if (path.resolve(path.dirname(sourcePath), currentTarget) === absoluteTarget) {
          return true // Already correctly linked
        }
        // Remove incorrect symlink
        fs.unlinkSync(sourcePath)
      } else {
        // Source exists but is not a symlink - skip
        console.warn(`⚠️  ${source} exists but is not a symlink - skipping`)
        return false
      }
    } catch (error) {
      // Error checking, try to create anyway
    }
  }

  // Check if target exists
  if (!fs.existsSync(absoluteTarget)) {
    console.warn(`⚠️  Target does not exist: ${target}`)
    return false
  }

  try {
    // Create parent directory if needed
    const parentDir = path.dirname(sourcePath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    // Create symlink (relative path)
    const relativeTarget = path.relative(path.dirname(sourcePath), absoluteTarget)
    
    // Use platform-specific symlink creation
    if (process.platform === 'win32') {
      // Windows: Use junction for directories, symlink for files
      execSync(`mklink /D "${sourcePath}" "${absoluteTarget}"`, { stdio: 'ignore' })
    } else {
      // Unix: Use symlink
      fs.symlinkSync(relativeTarget, sourcePath, 'dir')
    }
    
    return true
  } catch (error: any) {
    console.error(`❌ Error creating symlink ${source}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔗 Creating module route symlinks...\n')
  console.log('⚠️  Note: This creates symlinks so routes remain accessible until separate deployments\n')

  let successCount = 0
  let failCount = 0
  const failures: string[] = []

  for (const mapping of ROUTE_MAPPINGS) {
    if (createSymlink(mapping.source, mapping.target)) {
      console.log(`✅ ${mapping.source} → ${mapping.target}`)
      successCount++
    } else {
      failCount++
      failures.push(mapping.source)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${successCount} symlinks`)
  console.log(`   ❌ Failed: ${failCount} symlinks`)

  if (failures.length > 0) {
    console.log(`\n❌ Failed symlinks:`)
    failures.forEach(f => console.log(`   - ${f}`))
  }

  console.log(`\n✅ Symlink creation complete!`)
  console.log(`\n💡 Routes are now accessible from both locations:`)
  console.log(`   - Module directories (for future deployments)`)
  console.log(`   - app/api/ (via symlinks, for current monolith)`)
}

main().catch(console.error)

