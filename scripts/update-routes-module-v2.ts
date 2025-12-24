/**
 * Update API Routes for Module Reorganization (V1 → V2)
 * 
 * This script updates all API routes to use new module IDs:
 * - invoicing → finance
 * - accounting → finance
 * - whatsapp → marketing
 * 
 * Usage:
 *   npx tsx scripts/update-routes-module-v2.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const routeModuleMap: Record<string, string> = {
  // Finance module (merged invoicing + accounting)
  'invoices': 'finance',
  'accounting': 'finance',
  'gst': 'finance',
  
  // Marketing module
  'marketing': 'marketing',
  'whatsapp': 'marketing',
  'social-media': 'marketing',
  'email-templates': 'marketing',
  'events': 'marketing',
  
  // Sales module
  'landing-pages': 'sales',
  'checkout-pages': 'sales',
  
  // AI Studio module
  'websites': 'ai-studio',
  'logos': 'ai-studio',
  'ai': 'ai-studio',
  'calls': 'ai-studio',
  
  // Communication module
  'email': 'communication',
  'chat': 'communication',
  
  // Analytics module (unchanged)
  'analytics': 'analytics',
  'reports': 'analytics',
  'dashboards': 'analytics',
  
  // CRM module (unchanged)
  'contacts': 'crm',
  'deals': 'crm',
  'tasks': 'crm',
  'products': 'crm',
  'orders': 'crm', // Can be crm or sales, defaulting to crm
  'leads': 'crm',
  'interactions': 'crm',
  
  // HR module (unchanged)
  'hr': 'hr',
}

function getModuleForRoute(routePath: string): string | null {
  // Extract the first segment after /api/
  const segments = routePath.split('/').filter(Boolean)
  const apiIndex = segments.indexOf('api')
  
  if (apiIndex === -1 || apiIndex === segments.length - 1) {
    return null
  }
  
  const routeSegment = segments[apiIndex + 1]
  return routeModuleMap[routeSegment] || null
}

function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and other non-route directories
      if (!['node_modules', '.next', 'dist', 'build'].includes(file)) {
        findRouteFiles(filePath, fileList)
      }
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

function updateRouteFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const relativePath = filePath.replace(process.cwd() + '\\', '').replace(/\//g, '\\')
    
    // Skip if already updated or doesn't use requireModuleAccess
    if (!content.includes('requireModuleAccess')) {
      return false
    }
    
    // Get module for this route
    const module = getModuleForRoute(relativePath)
    if (!module) {
      return false
    }
    
    let updated = false
    let newContent = content
    
    // Update old module IDs to new ones
    const replacements: Array<[RegExp, string]> = [
      // invoicing → finance
      [/\brequireModuleAccess\s*\(\s*request\s*,\s*['"]invoicing['"]/g, `requireModuleAccess(request, 'finance')`],
      // accounting → finance
      [/\brequireModuleAccess\s*\(\s*request\s*,\s*['"]accounting['"]/g, `requireModuleAccess(request, 'finance')`],
      // whatsapp → marketing
      [/\brequireModuleAccess\s*\(\s*request\s*,\s*['"]whatsapp['"]/g, `requireModuleAccess(request, 'marketing')`],
    ]
    
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement)
        updated = true
      }
    }
    
    // Also update based on route path if module is determined
    if (module && !updated) {
      // Check if current module ID doesn't match expected
      const currentModuleMatch = newContent.match(/requireModuleAccess\s*\(\s*request\s*,\s*['"]([^'"]+)['"]/)
      if (currentModuleMatch && currentModuleMatch[1] !== module) {
        // Only update if it's an old module ID
        if (['invoicing', 'accounting', 'whatsapp'].includes(currentModuleMatch[1])) {
          newContent = newContent.replace(
            new RegExp(`requireModuleAccess\\s*\\(\\s*request\\s*,\\s*['"]${currentModuleMatch[1]}['"]`, 'g'),
            `requireModuleAccess(request, '${module}')`
          )
          updated = true
        }
      }
    }
    
    if (updated) {
      writeFileSync(filePath, newContent, 'utf-8')
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error)
    return false
  }
}

async function main() {
  console.log('🔄 Updating API routes for module reorganization (V1 → V2)...\n')
  
  const apiDir = join(process.cwd(), 'app', 'api')
  const routeFiles = findRouteFiles(apiDir)
  
  console.log(`Found ${routeFiles.length} route files\n`)
  
  let updatedCount = 0
  let skippedCount = 0
  
  for (const filePath of routeFiles) {
    const relativePath = filePath.replace(process.cwd() + '\\', '')
    const wasUpdated = updateRouteFile(filePath)
    
    if (wasUpdated) {
      console.log(`  ✅ Updated: ${relativePath}`)
      updatedCount++
    } else {
      skippedCount++
    }
  }
  
  console.log(`\n✅ Update complete!`)
  console.log(`   Updated: ${updatedCount} files`)
  console.log(`   Skipped: ${skippedCount} files`)
}

main().catch(console.error)
