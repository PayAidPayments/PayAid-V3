/**
 * Batch update routes from authenticateRequest to requireModuleAccess
 * Uses Node.js fs instead of glob
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// Route to module mapping
const routeModuleMap: Record<string, string> = {
  'contacts': 'crm',
  'deals': 'crm',
  'products': 'crm',
  'orders': 'crm',
  'leads': 'crm',
  'sales-reps': 'crm',
  'sequences': 'crm',
  'nurture': 'crm',
  'marketing': 'crm',
  'email-templates': 'crm',
  'social-media': 'crm',
  'landing-pages': 'crm',
  'checkout-pages': 'crm',
  'events': 'crm',
  'logos': 'crm',
  'chat': 'crm',
  'chatbots': 'crm',
  'websites': 'crm',
  'tasks': 'crm',
  'industries': 'crm',
  'invoices': 'invoicing',
  'accounting': 'accounting',
  'gst': 'accounting',
  'hr': 'hr',
  'whatsapp': 'whatsapp',
  'analytics': 'analytics',
  'reports': 'analytics',
  'dashboards': 'analytics',
  'ai': 'analytics',
}

function getModuleForRoute(routePath: string): string | null {
  if (routePath.includes('/auth/') || routePath.includes('/webhook')) {
    return null
  }
  
  for (const [key, module] of Object.entries(routeModuleMap)) {
    if (routePath.includes(`/api/${key}/`) || routePath.includes(`\\api\\${key}\\`)) {
      return module
    }
  }
  
  return null
}

function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

const apiDir = join(process.cwd(), 'app', 'api')
const routeFiles = findRouteFiles(apiDir)

console.log(`Found ${routeFiles.length} route files\n`)

let updatedCount = 0
let skippedCount = 0
let errorCount = 0

for (const filePath of routeFiles) {
  try {
    let content = readFileSync(filePath, 'utf-8')
    
    // Skip if already using requireModuleAccess
    if (content.includes('requireModuleAccess')) {
      skippedCount++
      continue
    }
    
    // Skip if doesn't use authenticateRequest
    if (!content.includes('authenticateRequest')) {
      skippedCount++
      continue
    }
    
    const relativePath = relative(process.cwd(), filePath)
    const module = getModuleForRoute(relativePath)
    
    if (!module) {
      skippedCount++
      continue
    }
    
    let modified = false
    
    // 1. Update import
    if (content.includes("import { authenticateRequest } from '@/lib/middleware/auth'")) {
      content = content.replace(
        /import\s+\{\s*authenticateRequest\s*\}\s+from\s+'@\/lib\/middleware\/auth'/g,
        "import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'"
      )
      modified = true
    }
    
    // 2. Replace authenticateRequest calls
    // Pattern: const user = await authenticateRequest(request); if (!user) { return ... }
    const pattern1 = new RegExp(
      'const\\s+user\\s*=\\s*await\\s+authenticateRequest\\s*\\(\\s*request\\s*\\)\\s*;?\\s*if\\s*\\(\\s*!user\\s*\\)\\s*\\{[^}]*return\\s+NextResponse\\.json\\s*\\(\\s*\\{[^}]*error[^}]*\\}[^,]*,\\s*\\{[^}]*status:\\s*401[^}]*\\}\\s*\\)\\s*;?\\s*\\}',
      'gs'
    )
    
    if (pattern1.test(content)) {
      content = content.replace(
        pattern1,
        `// Check ${module} module license\n    const { tenantId, userId } = await requireModuleAccess(request, '${module}')`
      )
      modified = true
    }
    
    // Pattern: const user = await authenticateRequest(request)
    const pattern2 = /const\s+user\s*=\s*await\s+authenticateRequest\s*\(\s*request\s*\)\s*;?/g
    
    if (pattern2.test(content) && !content.includes('requireModuleAccess')) {
      content = content.replace(
        pattern2,
        `const { tenantId, userId } = await requireModuleAccess(request, '${module}')`
      )
      modified = true
    }
    
    // 3. Replace user.tenantId with tenantId
    if (content.includes('user.tenantId')) {
      content = content.replace(/user\.tenantId/g, 'tenantId')
      modified = true
    }
    
    // 4. Replace user.userId with userId
    if (content.includes('user.userId')) {
      content = content.replace(/user\.userId/g, 'userId')
      modified = true
    }
    
    // 5. Replace user.id with userId (careful with comparisons)
    if (content.includes('user.id') && !content.includes('user.id ===')) {
      content = content.replace(/user\.id(?!\s*===)/g, 'userId')
      modified = true
    }
    
    // 6. Add error handling
    if (modified && !content.includes('handleLicenseError')) {
      const catchPattern = /(\s+} catch \(error[^)]*\) \{)/g
      if (catchPattern.test(content)) {
        content = content.replace(
          catchPattern,
          `$1\n    // Handle license errors\n    if (error && typeof error === 'object' && 'moduleId' in error) {\n      return handleLicenseError(error)\n    }`
        )
      }
    }
    
    if (modified) {
      writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ Updated ${relativePath} (${module})`)
      updatedCount++
    } else {
      skippedCount++
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
    errorCount++
  }
}

console.log(`\n📊 Summary:`)
console.log(`✅ Updated: ${updatedCount} files`)
console.log(`⏭️  Skipped: ${skippedCount} files`)
console.log(`❌ Errors: ${errorCount} files`)
