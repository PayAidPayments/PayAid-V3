/**
 * Script to update all API routes from authenticateRequest to requireModuleAccess
 * Maps routes to their appropriate modules
 * 
 * Run: npx tsx scripts/update-all-routes-to-licensing.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

// Route to module mapping
const routeModuleMap: Record<string, string> = {
  // CRM Module
  'contacts': 'crm',
  'deals': 'crm',
  'products': 'crm',
  'orders': 'crm',
  'leads': 'crm',
  'sales-reps': 'crm',
  'sequences': 'crm',
  'nurture': 'crm',
  
  // Invoicing Module
  'invoices': 'invoicing',
  
  // Accounting Module
  'accounting': 'accounting',
  'gst': 'accounting',
  
  // HR Module
  'hr': 'hr',
  
  // WhatsApp Module
  'whatsapp': 'whatsapp',
  
  // Analytics Module
  'analytics': 'analytics',
  'reports': 'analytics',
  'dashboards': 'analytics',
  
  // Marketing Module (part of CRM)
  'marketing': 'crm',
  'email-templates': 'crm',
  'social-media': 'crm',
  'landing-pages': 'crm',
  'checkout-pages': 'crm',
  'events': 'crm',
  'logos': 'crm',
  
  // AI Module (part of Analytics)
  'ai': 'analytics',
  
  // Chat Module (part of CRM)
  'chat': 'crm',
  'chatbots': 'crm',
  
  // Websites Module (part of CRM)
  'websites': 'crm',
  
  // Tasks Module (part of CRM)
  'tasks': 'crm',
  
  // Industries (part of CRM)
  'industries': 'crm',
  
  // Settings (no module - core feature)
  'settings': 'core',
  'alerts': 'core',
  'calls': 'core',
  'interactions': 'core',
  'upload': 'core',
  'payments': 'core',
}

// Find module for a route path
function getModuleForRoute(routePath: string): string | null {
  // Skip auth routes and webhooks
  if (routePath.includes('/auth/') || routePath.includes('/webhook')) {
    return null
  }
  
  // Check each key in the map
  for (const [key, module] of Object.entries(routeModuleMap)) {
    if (routePath.includes(`/api/${key}/`) || routePath.includes(`/api/${key}\\`)) {
      return module
    }
  }
  
  // Default to null if no match (will skip)
  return null
}

// Find all route files
const apiDir = path.join(process.cwd(), 'app', 'api')
const routeFiles = globSync('**/route.ts', { cwd: apiDir, absolute: true })

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
    
    // Get module for this route
    const relativePath = path.relative(process.cwd(), filePath)
    const module = getModuleForRoute(relativePath)
    
    if (!module || module === 'core') {
      // Skip core routes or routes without module mapping
      console.log(`⏭️  Skipping ${relativePath} (no module mapping or core route)`)
      skippedCount++
      continue
    }
    
    let modified = false
    
    // 1. Update import statement
    if (content.includes("import { authenticateRequest } from '@/lib/middleware/auth'")) {
      const importRegex = /import\s+\{\s*authenticateRequest\s*\}\s+from\s+'@\/lib\/middleware\/auth'/g
      content = content.replace(
        importRegex,
        "import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'"
      )
      modified = true
    }
    
    // 2. Replace authenticateRequest pattern
    // Pattern 1: const user = await authenticateRequest(request); if (!user) { return ... }
    const pattern1Regex = new RegExp(
      'const\\s+user\\s*=\\s*await\\s+authenticateRequest\\s*\\(\\s*request\\s*\\)\\s*;?\\s*if\\s*\\(\\s*!user\\s*\\)\\s*\\{[^}]*return\\s+NextResponse\\.json\\s*\\(\\s*\\{[^}]*error[^}]*\\}[^,]*,\\s*\\{[^}]*status:\\s*401[^}]*\\}\\s*\\)\\s*;?\\s*\\}',
      'gs'
    )
    
    if (pattern1Regex.test(content)) {
      const replacement = `// Check ${module} module license\n    const { tenantId, userId } = await requireModuleAccess(request, '${module}')`
      content = content.replace(pattern1Regex, replacement)
      modified = true
    }
    
    // Pattern 2: const user = await authenticateRequest(request) (standalone)
    const pattern2Regex = /const\s+user\s*=\s*await\s+authenticateRequest\s*\(\s*request\s*\)\s*;?/g
    
    if (pattern2Regex.test(content) && !content.includes('requireModuleAccess')) {
      const replacement = `const { tenantId, userId } = await requireModuleAccess(request, '${module}')`
      content = content.replace(pattern2Regex, replacement)
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
    
    // 5. Replace user.id with userId
    if (content.includes('user.id') && !content.includes('user.id ===')) {
      content = content.replace(/user\.id(?!\s*===)/g, 'userId')
      modified = true
    }
    
    // 6. Add error handling if not present
    if (modified && !content.includes('handleLicenseError')) {
      // Find catch blocks and add license error handling
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
      console.log(`✅ Updated ${relativePath} (${module} module)`)
      updatedCount++
    } else {
      console.log(`⏭️  No changes needed for ${relativePath}`)
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
