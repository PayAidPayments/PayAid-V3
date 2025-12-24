/**
 * Fix Await Auth Calls Script
 * 
 * Fixes incorrect await usage with synchronous auth functions
 * 
 * Usage: npx tsx scripts/fix-await-auth.ts [module]
 */

import * as fs from 'fs'
import * as path from 'path'

const MODULE_AUTH_FUNCTIONS: Record<string, string> = {
  'crm-module': 'requireCRMAccess',
  'invoicing-module': 'requireFinanceAccess',
  'accounting-module': 'requireAccountingAccess',
  'hr-module': 'requireHRAccess',
  'whatsapp-module': 'requireWhatsAppAccess',
  'analytics-module': 'requireAnalyticsAccess',
}

function fixAwaitAuth(filePath: string, authFunction: string): boolean {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false
  }

  let content = fs.readFileSync(filePath, 'utf-8')
  let modified = false

  // Fix await requireCRMAccess(request) pattern
  const awaitPattern = new RegExp(
    `const\\s+\\{\\s*tenantId(?:,\\s*\\w+)?\\s*\\}\\s*=\\s*await\\s+${authFunction}\\(request\\)`,
    'g'
  )

  if (awaitPattern.test(content)) {
    // Replace with synchronous pattern
    content = content.replace(
      awaitPattern,
      `const auth = ${authFunction}(request)\n    if (!auth.authenticated || auth.response) {\n      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })\n    }\n    const tenantId = auth.payload.tenantId`
    )
    modified = true
  }

  // Also fix if destructuring includes userId
  const awaitPatternWithUserId = new RegExp(
    `const\\s+\\{\\s*tenantId,\\s*userId\\s*\\}\\s*=\\s*await\\s+${authFunction}\\(request\\)`,
    'g'
  )

  if (awaitPatternWithUserId.test(content)) {
    content = content.replace(
      awaitPatternWithUserId,
      `const auth = ${authFunction}(request)\n    if (!auth.authenticated || auth.response) {\n      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })\n    }\n    const { tenantId, userId } = { tenantId: auth.payload.tenantId, userId: auth.payload.userId }`
    )
    modified = true
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  }

  return false
}

function fixModuleAwaitAuth(moduleDir: string, authFunction: string): number {
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
        if (fixAwaitAuth(filePath, authFunction)) {
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

  if (moduleName && !MODULE_AUTH_FUNCTIONS[moduleName]) {
    console.error(`Unknown module: ${moduleName}`)
    console.log('Available modules:', Object.keys(MODULE_AUTH_FUNCTIONS).join(', '))
    process.exit(1)
  }

  const modulesToFix = moduleName ? [moduleName] : Object.keys(MODULE_AUTH_FUNCTIONS)

  console.log('🔧 Fixing await auth calls...\n')

  let totalFixed = 0

  for (const module of modulesToFix) {
    const moduleDir = path.join(process.cwd(), module)
    if (!fs.existsSync(moduleDir)) {
      console.warn(`⚠️  Module directory not found: ${module}`)
      continue
    }

    const authFunction = MODULE_AUTH_FUNCTIONS[module]
    const fixed = fixModuleAwaitAuth(moduleDir, authFunction)
    console.log(`✅ ${module}: Fixed ${fixed} files`)
    totalFixed += fixed
  }

  console.log(`\n📊 Total files fixed: ${totalFixed}`)
}

main().catch(console.error)

