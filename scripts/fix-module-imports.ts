/**
 * Fix Module Import Script
 * 
 * Fixes import inconsistencies in migrated module files
 * 
 * Usage: npx tsx scripts/fix-module-imports.ts [module]
 */

import * as fs from 'fs'
import * as path from 'path'

const MODULE_FIXES: Record<string, { authImport: string; authFunction: string; moduleId: string }> = {
  'crm-module': {
    authImport: "from '@/lib/middleware/auth'",
    authFunction: 'requireCRMAccess',
    moduleId: 'crm',
  },
  'invoicing-module': {
    authImport: "from '@/lib/middleware/auth'",
    authFunction: 'requireFinanceAccess',
    moduleId: 'finance',
  },
  'accounting-module': {
    authImport: "from '@/lib/middleware/auth'",
    authFunction: 'requireAccountingAccess',
    moduleId: 'accounting',
  },
  'hr-module': {
    authImport: "from '@/lib/middleware/auth'",
    authFunction: 'requireHRAccess',
    moduleId: 'hr',
  },
  'whatsapp-module': {
    authImport: "from '@/lib/middleware/auth'",
    authFunction: 'requireWhatsAppAccess',
    moduleId: 'whatsapp',
  },
  'analytics-module': {
    authImport: "from '@/lib/middleware/auth'",
    authFunction: 'requireAnalyticsAccess',
    moduleId: 'analytics',
  },
}

function fixFileImports(filePath: string, moduleConfig: typeof MODULE_FIXES[string]): boolean {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  // Fix requireModuleAccess calls
  const requireModuleAccessRegex = new RegExp(
    `const\\s+\\{\\s*tenantId(?:,\\s*\\w+)?\\s*\\}\\s*=\\s*await\\s+requireModuleAccess\\(request,\\s*['"]${moduleConfig.moduleId}['"]\\)`,
    'g'
  )

  if (requireModuleAccessRegex.test(content)) {
    // Replace with module-specific function
    content = content.replace(
      requireModuleAccessRegex,
      `const auth = ${moduleConfig.authFunction}(request)\n    if (!auth.authenticated || auth.response) {\n      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })\n    }\n    const { tenantId } = { tenantId: auth.payload.tenantId }`
    )
    modified = true
  }

  // Fix import statements
  if (content.includes('requireModuleAccess') || content.includes('handleLicenseError')) {
    // Update import to use module-specific function
    content = content.replace(
      /import\s+\{[^}]*requireModuleAccess[^}]*\}\s+from\s+['"]@\/lib\/middleware\/auth['"]/g,
      `import { ${moduleConfig.authFunction} } ${moduleConfig.authImport}`
    )
    content = content.replace(
      /import\s+\{[^}]*handleLicenseError[^}]*\}\s+from\s+['"]@\/lib\/middleware\/auth['"]/g,
      `import { ${moduleConfig.authFunction} } ${moduleConfig.authImport}`
    )
    modified = true
  }

  // Fix @payaid/db import if needed
  if (content.includes('@/lib/db/prisma') && !content.includes('@payaid/db')) {
    content = content.replace(
      /from\s+['"]@\/lib\/db\/prisma['"]/g,
      "from '@payaid/db'"
    )
    modified = true
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  }

  return false
}

function fixModuleImports(moduleDir: string, moduleConfig: typeof MODULE_FIXES[string]): number {
  const apiDir = path.join(moduleDir, 'app', 'api')
  if (!fs.existsSync(apiDir)) {
    return 0
  }

  let fixedCount = 0

  function processDirectory(dir: string) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        processDirectory(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (fixFileImports(filePath, moduleConfig)) {
          fixedCount++
        }
      }
    }
  }

  processDirectory(apiDir)
  return fixedCount
}

async function main() {
  const args = process.argv.slice(2)
  const moduleName = args[0]

  if (moduleName && !MODULE_FIXES[moduleName]) {
    console.error(`Unknown module: ${moduleName}`)
    console.log('Available modules:', Object.keys(MODULE_FIXES).join(', '))
    process.exit(1)
  }

  const modulesToFix = moduleName ? [moduleName] : Object.keys(MODULE_FIXES)

  console.log('🔧 Fixing module imports...\n')

  let totalFixed = 0

  for (const module of modulesToFix) {
    const moduleDir = path.join(process.cwd(), module)
    if (!fs.existsSync(moduleDir)) {
      console.warn(`⚠️  Module directory not found: ${module}`)
      continue
    }

    const fixed = fixModuleImports(moduleDir, MODULE_FIXES[module])
    console.log(`✅ ${module}: Fixed ${fixed} files`)
    totalFixed += fixed
  }

  console.log(`\n📊 Total files fixed: ${totalFixed}`)
}

main().catch(console.error)

