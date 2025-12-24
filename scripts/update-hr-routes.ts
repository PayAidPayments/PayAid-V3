/**
 * Script to update all HR routes with license checking
 * This script helps identify which routes need updating
 * 
 * Run: npx tsx scripts/update-hr-routes.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

const hrRoutesDir = path.join(process.cwd(), 'app', 'api', 'hr')

// Find all route files
const routeFiles = globSync('**/route.ts', { cwd: hrRoutesDir, absolute: true })

console.log(`Found ${routeFiles.length} HR route files`)

// Pattern to replace
const patterns = [
  {
    from: /import { authenticateRequest } from '@/lib\/middleware\/auth'/g,
    to: "import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'",
  },
  {
    from: /const user = await authenticateRequest\(request\)\s+if \(!user\) \{\s+return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\)\s+\}/g,
    to: "// Check HR module license\n    const { tenantId, userId } = await requireModuleAccess(request, 'hr')",
  },
  {
    from: /user\.tenantId/g,
    to: 'tenantId',
  },
  {
    from: /user\.userId/g,
    to: 'userId',
  },
  {
    from: /user\.id/g,
    to: 'userId',
  },
]

let updatedCount = 0

for (const filePath of routeFiles) {
  try {
    let content = readFileSync(filePath, 'utf-8')
    let modified = false

    // Check if already updated
    if (content.includes('requireModuleAccess')) {
      console.log(`⏭️  Skipping ${path.relative(process.cwd(), filePath)} (already updated)`)
      continue
    }

    // Apply patterns
    for (const pattern of patterns) {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to)
        modified = true
      }
    }

    // Add error handling if not present
    if (modified && !content.includes('handleLicenseError')) {
      // Find catch blocks and add license error handling
      content = content.replace(
        /(\s+} catch \(error\) \{)/g,
        "$1\n    // Handle license errors\n    if (error && typeof error === 'object' && 'moduleId' in error) {\n      return handleLicenseError(error)\n    }"
      )
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ Updated ${path.relative(process.cwd(), filePath)}`)
      updatedCount++
    } else {
      console.log(`⏭️  No changes needed for ${path.relative(process.cwd(), filePath)}`)
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
  }
}

console.log(`\n✅ Updated ${updatedCount} files`)
