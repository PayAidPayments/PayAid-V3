/**
 * Complete Module Migration Script
 * 
 * Migrates all routes for all modules from monolith to module directories
 * 
 * Usage: npx tsx scripts/complete-module-migration.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface RouteMapping {
  source: string
  target: string
  module: string
  authFunction: string
}

const ROUTE_MAPPINGS: RouteMapping[] = [
  // CRM Module
  { source: 'app/api/contacts', target: 'crm-module/app/api/contacts', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/deals', target: 'crm-module/app/api/deals', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/products', target: 'crm-module/app/api/products', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/orders', target: 'crm-module/app/api/orders', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/tasks', target: 'crm-module/app/api/tasks', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/leads', target: 'crm-module/app/api/leads', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/marketing', target: 'crm-module/app/api/marketing', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/email-templates', target: 'crm-module/app/api/email-templates', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/social-media', target: 'crm-module/app/api/social-media', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/landing-pages', target: 'crm-module/app/api/landing-pages', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/checkout-pages', target: 'crm-module/app/api/checkout-pages', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/events', target: 'crm-module/app/api/events', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/logos', target: 'crm-module/app/api/logos', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/websites', target: 'crm-module/app/api/websites', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/chat', target: 'crm-module/app/api/chat', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/chatbots', target: 'crm-module/app/api/chatbots', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/interactions', target: 'crm-module/app/api/interactions', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/sales-reps', target: 'crm-module/app/api/sales-reps', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/sequences', target: 'crm-module/app/api/sequences', module: 'crm', authFunction: 'requireCRMAccess' },
  { source: 'app/api/nurture', target: 'crm-module/app/api/nurture', module: 'crm', authFunction: 'requireCRMAccess' },
  
  // Invoicing Module (Finance)
  { source: 'app/api/invoices', target: 'invoicing-module/app/api/invoices', module: 'finance', authFunction: 'requireFinanceAccess' },
  
  // Accounting Module
  { source: 'app/api/accounting', target: 'accounting-module/app/api/accounting', module: 'accounting', authFunction: 'requireAccountingAccess' },
  { source: 'app/api/gst', target: 'accounting-module/app/api/gst', module: 'accounting', authFunction: 'requireAccountingAccess' },
  
  // HR Module
  { source: 'app/api/hr', target: 'hr-module/app/api/hr', module: 'hr', authFunction: 'requireHRAccess' },
  
  // WhatsApp Module
  { source: 'app/api/whatsapp', target: 'whatsapp-module/app/api/whatsapp', module: 'whatsapp', authFunction: 'requireWhatsAppAccess' },
  
  // Analytics Module
  { source: 'app/api/analytics', target: 'analytics-module/app/api/analytics', module: 'analytics', authFunction: 'requireAnalyticsAccess' },
  { source: 'app/api/reports', target: 'analytics-module/app/api/reports', module: 'analytics', authFunction: 'requireAnalyticsAccess' },
  { source: 'app/api/dashboards', target: 'analytics-module/app/api/dashboards', module: 'analytics', authFunction: 'requireAnalyticsAccess' },
  
  // AI Studio Module (new module - ai-studio)
  { source: 'app/api/ai', target: 'ai-studio-module/app/api/ai', module: 'ai-studio', authFunction: 'requireAIStudioAccess' },
  { source: 'app/api/calls', target: 'ai-studio-module/app/api/calls', module: 'ai-studio', authFunction: 'requireAIStudioAccess' },
  
  // Communication Module (new module - communication)
  { source: 'app/api/email', target: 'communication-module/app/api/email', module: 'communication', authFunction: 'requireCommunicationAccess' },
  // Note: chat is already in CRM module, will be moved to communication module in future
  
  // Core Module (Billing, Admin, Settings, OAuth)
  { source: 'app/api/billing', target: 'core-module/app/api/billing', module: 'core', authFunction: 'requireCoreAccess' },
  { source: 'app/api/admin', target: 'core-module/app/api/admin', module: 'core', authFunction: 'requireCoreAccess' },
  { source: 'app/api/settings', target: 'core-module/app/api/settings', module: 'core', authFunction: 'requireCoreAccess' },
  { source: 'app/api/modules', target: 'core-module/app/api/modules', module: 'core', authFunction: 'requireCoreAccess' },
  { source: 'app/api/bundles', target: 'core-module/app/api/bundles', module: 'core', authFunction: 'requireCoreAccess' },
  { source: 'app/api/user/licenses', target: 'core-module/app/api/user/licenses', module: 'core', authFunction: 'requireCoreAccess' },
]

function copyDirectory(source: string, target: string) {
  if (!fs.existsSync(source)) {
    console.warn(`⚠️  Source does not exist: ${source}`)
    return false
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  const files = fs.readdirSync(source)
  let copied = 0

  for (const file of files) {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)

    if (fs.statSync(sourcePath).isDirectory()) {
      if (copyDirectory(sourcePath, targetPath)) {
        copied++
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fs.copyFileSync(sourcePath, targetPath)
      copied++
    }
  }

  return copied > 0
}

function updateFileImports(filePath: string, module: string, authFunction: string) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  // Update Prisma import
  if (content.includes('@/lib/db/prisma')) {
    content = content.replace(
      /from ['"]@\/lib\/db\/prisma['"]/g,
      "from '@payaid/db'"
    )
    modified = true
  }

  // Update auth imports
  if (content.includes('requireModuleAccess')) {
    // Replace requireModuleAccess with module-specific function
    content = content.replace(
      new RegExp(`requireModuleAccess\\(request, ['"]${module}['"]\\)`, 'g'),
      `${authFunction}(request)`
    )
    
    // Update import statement
    if (content.includes('@/lib/middleware/license')) {
      content = content.replace(
        /from ['"]@\/lib\/middleware\/license['"]/g,
        "from '@/lib/middleware/auth'"
      )
    }
    modified = true
  }

  // Update handleLicenseError if present
  if (content.includes('handleLicenseError')) {
    // Keep it for now, but update import
    if (content.includes('@/lib/middleware/license')) {
      content = content.replace(
        /from ['"]@\/lib\/middleware\/license['"]/g,
        "from '@payaid/auth'"
      )
    }
    modified = true
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
  }
}

function updateImportsRecursive(dir: string, module: string, authFunction: string) {
  if (!fs.existsSync(dir)) return

  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      updateImportsRecursive(filePath, module, authFunction)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFileImports(filePath, module, authFunction)
    }
  }
}

async function migrateRoute(mapping: RouteMapping): Promise<{ success: boolean; files: number }> {
  const sourcePath = path.join(process.cwd(), mapping.source)
  const targetPath = path.join(process.cwd(), mapping.target)

  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Skipping ${mapping.source} - does not exist`)
    return { success: false, files: 0 }
  }

  try {
    // Copy directory
    const copied = copyDirectory(sourcePath, targetPath)
    if (!copied) {
      return { success: false, files: 0 }
    }

    // Update imports
    updateImportsRecursive(targetPath, mapping.module, mapping.authFunction)

    // Count files
    const files = countFiles(targetPath)

    console.log(`✅ Migrated ${mapping.source} → ${mapping.target} (${files} files)`)
    return { success: true, files }
  } catch (error) {
    console.error(`❌ Error migrating ${mapping.source}:`, error)
    return { success: false, files: 0 }
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
  console.log('🚀 Starting complete module migration...\n')

  let totalFiles = 0
  let successCount = 0
  let failCount = 0

  for (const mapping of ROUTE_MAPPINGS) {
    const result = await migrateRoute(mapping)
    if (result.success) {
      totalFiles += result.files
      successCount++
    } else {
      failCount++
    }
  }

  console.log(`\n📊 Migration Summary:`)
  console.log(`   ✅ Success: ${successCount} routes`)
  console.log(`   ❌ Failed: ${failCount} routes`)
  console.log(`   📁 Total files: ${totalFiles}`)
  console.log(`\n✅ Migration complete!`)
}

main().catch(console.error)

