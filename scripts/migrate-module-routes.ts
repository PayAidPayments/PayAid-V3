/**
 * Module Route Migration Script
 * 
 * Automates migration of API routes from monolith to module directories
 * 
 * Usage: npx tsx scripts/migrate-module-routes.ts <module-name> <route-path>
 * Example: npx tsx scripts/migrate-module-routes.ts crm /api/contacts
 */

import * as fs from 'fs'
import * as path from 'path'

const MODULE_MAP: Record<string, { module: string; routes: string[] }> = {
  crm: {
    module: 'crm-module',
    routes: [
      '/api/contacts',
      '/api/deals',
      '/api/products',
      '/api/orders',
      '/api/tasks',
      '/api/leads',
      '/api/marketing',
      '/api/email-templates',
      '/api/social-media',
      '/api/landing-pages',
      '/api/checkout-pages',
      '/api/events',
      '/api/logos',
      '/api/websites',
      '/api/chat',
      '/api/chatbots',
      '/api/interactions',
      '/api/sales-reps',
      '/api/sequences',
      '/api/nurture',
    ],
  },
  invoicing: {
    module: 'invoicing-module',
    routes: [
      '/api/invoices',
    ],
  },
  accounting: {
    module: 'accounting-module',
    routes: [
      '/api/accounting',
      '/api/gst',
    ],
  },
  hr: {
    module: 'hr-module',
    routes: [
      '/api/hr',
    ],
  },
  whatsapp: {
    module: 'whatsapp-module',
    routes: [
      '/api/whatsapp',
    ],
  },
  analytics: {
    module: 'analytics-module',
    routes: [
      '/api/analytics',
      '/api/reports',
      '/api/dashboards',
    ],
  },
}

interface MigrationResult {
  success: boolean
  filesMigrated: number
  errors: string[]
}

async function migrateRoute(
  moduleName: string,
  routePath: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    filesMigrated: 0,
    errors: [],
  }

  try {
    const moduleInfo = MODULE_MAP[moduleName]
    if (!moduleInfo) {
      throw new Error(`Unknown module: ${moduleName}`)
    }

    const sourcePath = path.join(process.cwd(), 'app', routePath)
    const targetPath = path.join(process.cwd(), moduleInfo.module, 'app', routePath)

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`)
    }

    // Create target directory
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Copy files
    if (fs.statSync(sourcePath).isDirectory()) {
      // Copy directory recursively
      copyDirectory(sourcePath, targetPath)
      result.filesMigrated = countFiles(sourcePath)
    } else {
      // Copy single file
      fs.copyFileSync(sourcePath, targetPath)
      result.filesMigrated = 1
    }

    // Update imports in copied files
    updateImports(targetPath, moduleName)

    console.log(`✅ Migrated ${routePath} to ${moduleInfo.module}`)
  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : String(error))
    console.error(`❌ Error migrating ${routePath}:`, error)
  }

  return result
}

function copyDirectory(source: string, target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
  }

  const files = fs.readdirSync(source)
  for (const file of files) {
    const sourcePath = path.join(source, file)
    const targetPath = path.join(target, file)

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function countFiles(dir: string): number {
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

function updateImports(filePath: string, moduleName: string) {
  if (fs.statSync(filePath).isDirectory()) {
    const files = fs.readdirSync(filePath)
    for (const file of files) {
      const fullPath = path.join(filePath, file)
      if (fs.statSync(fullPath).isDirectory()) {
        updateImports(fullPath, moduleName)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        updateFileImports(fullPath, moduleName)
      }
    }
  } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    updateFileImports(filePath, moduleName)
  }
}

function updateFileImports(filePath: string, moduleName: string) {
  let content = fs.readFileSync(filePath, 'utf-8')

  // Update Prisma import
  content = content.replace(
    /from ['"]@\/lib\/db\/prisma['"]/g,
    "from '@payaid/db'"
  )

  // Update auth imports
  if (moduleName === 'crm') {
    content = content.replace(
      /requireModuleAccess\(request, ['"]crm['"]\)/g,
      "requireCRMAccess(request)"
    )
    content = content.replace(
      /from ['"]@\/lib\/middleware\/license['"]/g,
      "from '@/lib/middleware/auth'"
    )
  }

  // Update other module-specific imports
  const moduleAuthMap: Record<string, string> = {
    crm: 'requireCRMAccess',
    invoicing: 'requireInvoicingAccess',
    accounting: 'requireAccountingAccess',
    hr: 'requireHRAccess',
    whatsapp: 'requireWhatsAppAccess',
    analytics: 'requireAnalyticsAccess',
  }

  const authFunction = moduleAuthMap[moduleName]
  if (authFunction) {
    content = content.replace(
      new RegExp(`requireModuleAccess\\(request, ['"]${moduleName}['"]\\)`, 'g'),
      `${authFunction}(request)`
    )
  }

  fs.writeFileSync(filePath, content, 'utf-8')
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 1) {
    console.log('Usage: npx tsx scripts/migrate-module-routes.ts <module-name> [route-path]')
    console.log('Example: npx tsx scripts/migrate-module-routes.ts crm /api/contacts')
    console.log('\nAvailable modules:', Object.keys(MODULE_MAP).join(', '))
    process.exit(1)
  }

  const moduleName = args[0]
  const routePath = args[1]

  if (!MODULE_MAP[moduleName]) {
    console.error(`Unknown module: ${moduleName}`)
    console.log('Available modules:', Object.keys(MODULE_MAP).join(', '))
    process.exit(1)
  }

  if (routePath) {
    // Migrate single route
    const result = await migrateRoute(moduleName, routePath)
    if (result.success) {
      console.log(`✅ Migration complete: ${result.filesMigrated} files migrated`)
    } else {
      console.error('❌ Migration failed:', result.errors)
      process.exit(1)
    }
  } else {
    // Migrate all routes for module
    console.log(`🚀 Migrating all routes for ${moduleName} module...`)
    const moduleInfo = MODULE_MAP[moduleName]
    let totalMigrated = 0
    const errors: string[] = []

    for (const route of moduleInfo.routes) {
      const result = await migrateRoute(moduleName, route)
      if (result.success) {
        totalMigrated += result.filesMigrated
      } else {
        errors.push(...result.errors)
      }
    }

    console.log(`\n✅ Migration complete: ${totalMigrated} files migrated`)
    if (errors.length > 0) {
      console.error('❌ Errors:', errors)
    }
  }
}

main().catch(console.error)

