/**
 * Create All Module Repositories
 * 
 * Creates separate repositories for all modules
 * 
 * Usage: npx tsx scripts/create-all-repositories.ts
 */

import { execSync } from 'child_process'

const MODULES = ['core', 'crm', 'finance', 'hr', 'marketing', 'whatsapp', 'analytics', 'ai-studio', 'communication']

async function main() {
  console.log('📦 Creating all module repositories...\n')

  for (const module of MODULES) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Creating ${module} module repository...`)
    console.log('='.repeat(50))
    
    try {
      execSync(`npx tsx scripts/create-module-repository.ts ${module}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
    } catch (error) {
      console.error(`❌ Failed to create ${module} repository:`, error)
    }
  }

  console.log(`\n✅ All repositories created!`)
  console.log(`\n📋 Next steps:`)
  console.log(`   1. Review repositories in ./repositories/`)
  console.log(`   2. Initialize git repositories`)
  console.log(`   3. Create GitHub repositories`)
  console.log(`   4. Push to GitHub`)
  console.log(`   5. Set up CI/CD secrets`)
}

main().catch(console.error)

