/**
 * Build all shared packages
 * 
 * Usage:
 *   npx tsx scripts/build-packages.ts
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const packages = [
  '@payaid/auth',
  '@payaid/types',
  '@payaid/db',
  '@payaid/ui',
  '@payaid/utils',
  '@payaid/oauth-client',
]

console.log('🔨 Building all shared packages...\n')

for (const packageName of packages) {
  const packagePath = join(process.cwd(), 'packages', packageName)
  
  if (!existsSync(packagePath)) {
    console.log(`  ⚠️  ${packageName}: Not found, skipping`)
    continue
  }
  
  try {
    console.log(`  📦 Building ${packageName}...`)
    execSync('npm run build', {
      cwd: packagePath,
      stdio: 'inherit',
    })
    console.log(`  ✅ ${packageName}: Built successfully\n`)
  } catch (error) {
    console.error(`  ❌ ${packageName}: Build failed`)
    console.error(error)
    process.exit(1)
  }
}

console.log('✅ All packages built successfully!')
